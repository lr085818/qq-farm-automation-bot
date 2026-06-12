/**
 * 数据分析模块 - 作物效率分析
 */

const { getAllPlants, getFruitPrice, getSeedPrice, getItemImageById } = require('../config/gameConfig');

const AUTHOR_ANALYTICS_MAX_SEED_ID = 20259;
const AUTHOR_ANALYTICS_FORCE_INCLUDE_SEED_IDS = new Set([20167]);

function shouldIncludeInAuthorAnalytics(plant, seenSeedIds) {
    const seedId = Number(plant && plant.seed_id) || 0;
    if (seedId <= 0 || seenSeedIds.has(seedId)) return false;

    const name = String(plant && plant.name || '').trim();
    if (!name || /^作物\d+$/.test(name)) return false;

    if (AUTHOR_ANALYTICS_FORCE_INCLUDE_SEED_IDS.has(seedId)) return true;
    return seedId <= AUTHOR_ANALYTICS_MAX_SEED_ID;
}

function parseGrowTime(growPhases) {
    if (!growPhases) return 0;
    const phases = growPhases.split(';').filter(p => p.length > 0);
    let totalTime = 0;
    for (const phase of phases) {
        const match = phase.match(/:(\d+)$/);
        if (match) {
            totalTime += Number.parseInt(match[1]);
        }
    }
    return totalTime;
}

function parseNormalFertilizerReduceSec(growPhases) {
    if (!growPhases) return 0;
    const phases = String(growPhases).split(';').filter(p => p.length > 0);
    if (!phases.length) return 0;
    const first = phases[0];
    const match = first.match(/:(\d+)$/);
    return match ? (Number.parseInt(match[1], 10) || 0) : 0;
}

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}时${mins}分` : `${hours}时`;
}

function getPlantRankings(sortBy = 'exp') {
    const plants = getAllPlants();
    const seenSeedIds = new Set();
    
    // 向作者当前分析页口径收敛：排除占位作物、重复 seedId 和高编号扩展作物，
    // 同时保留当前已上线的新作物“欢乐糖果”。
    const normalPlants = plants.filter(p => {
        if (!p.grow_phases) return false;
        if (!shouldIncludeInAuthorAnalytics(p, seenSeedIds)) return false;
        seenSeedIds.add(Number(p.seed_id) || 0);
        return true;
    });

    const results = [];
    for (const plant of normalPlants) {
        const baseGrowTime = parseGrowTime(plant.grow_phases);
        if (baseGrowTime <= 0) continue;
        const seasons = Number(plant.seasons) || 1;
        const isTwoSeason = seasons === 2;
        const growTime = isTwoSeason ? (baseGrowTime * 1.5) : baseGrowTime;
        
        const harvestExpBase = Number.parseInt(plant.exp) || 0;
        const harvestExp = isTwoSeason ? (harvestExpBase * 2) : harvestExpBase;
        const expPerHour = (harvestExp / growTime) * 3600;
        // 普通化肥：直接减少第一生长阶段时长（reduceSec）
        const reduceSecBase = parseNormalFertilizerReduceSec(plant.grow_phases);
        const reduceSecApplied = isTwoSeason ? (reduceSecBase * 2) : reduceSecBase;
        const fertilizedGrowTime = growTime - reduceSecApplied;
        const safeFertilizedTime = fertilizedGrowTime > 0 ? fertilizedGrowTime : 1;
        const normalFertilizerExpPerHour = (harvestExp / safeFertilizedTime) * 3600;
        
        const fruitId = Number(plant.fruit && plant.fruit.id) || 0;
        const fruitCount = Number(plant.fruit && plant.fruit.count) || 0;
        const fruitPrice = getFruitPrice(fruitId);
        const seedPrice = getSeedPrice(Number(plant.seed_id) || 0);

        // 单次收获总金币（毛收益）与净收益
        const income = (fruitCount * fruitPrice) * (isTwoSeason ? 2 : 1);
        const netProfit = income - seedPrice;
        const goldPerHour = (income / growTime) * 3600;
        const profitPerHour = (netProfit / growTime) * 3600;
        const normalFertilizerProfitPerHour = (netProfit / safeFertilizedTime) * 3600;

        const cfgLevel = Number(plant.land_level_need);
        const requiredLevel = (Number.isFinite(cfgLevel) && cfgLevel > 0) ? cfgLevel : null;
        results.push({
            id: plant.id,
            seedId: plant.seed_id,
            name: plant.name,
            seasons,
            level: requiredLevel,
            growTime,
            growTimeStr: formatTime(growTime),
            reduceSec: reduceSecBase,
            reduceSecApplied,
            expPerHour: Number.parseFloat(expPerHour.toFixed(2)),
            normalFertilizerExpPerHour: Number.parseFloat(normalFertilizerExpPerHour.toFixed(2)),
            goldPerHour: Number.parseFloat(goldPerHour.toFixed(2)), // 毛收益/时
            profitPerHour: Number.parseFloat(profitPerHour.toFixed(2)), // 净收益/时
            normalFertilizerProfitPerHour: Number.parseFloat(normalFertilizerProfitPerHour.toFixed(2)), // 普通肥净收益/时
            income,
            netProfit,
            fruitId,
            fruitCount,
            fruitPrice,
            seedPrice,
            image: getItemImageById(plant.seed_id),
        });
    }

    if (sortBy === 'exp') {
        results.sort((a, b) => b.expPerHour - a.expPerHour);
    } else if (sortBy === 'fert') {
        results.sort((a, b) => b.normalFertilizerExpPerHour - a.normalFertilizerExpPerHour);
    } else if (sortBy === 'gold') {
        results.sort((a, b) => b.goldPerHour - a.goldPerHour);
    } else if (sortBy === 'profit') {
        results.sort((a, b) => b.profitPerHour - a.profitPerHour);
    } else if (sortBy === 'fert_profit') {
        results.sort((a, b) => b.normalFertilizerProfitPerHour - a.normalFertilizerProfitPerHour);
    } else if (sortBy === 'level') {
        const lv = (v) => (v === null || v === undefined ? -1 : Number(v));
        results.sort((a, b) => lv(b.level) - lv(a.level));
    }

    return results;
}

module.exports = {
    getPlantRankings,
};
