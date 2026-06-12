const process = require('node:process');
/**
 * 配置常量与枚举定义
 */

const DEFAULT_SYSTEM_CONFIG = {
    serverUrl: 'wss://gate-obt.nqf.qq.com/prod/ws',
    clientVersion: '1.12.0.4_20260609',
    platform: 'qq',
    os: 'iOS',
};

const CONFIG = {
    serverUrl: DEFAULT_SYSTEM_CONFIG.serverUrl,
    clientVersion: DEFAULT_SYSTEM_CONFIG.clientVersion,
    platform: DEFAULT_SYSTEM_CONFIG.platform,
    os: DEFAULT_SYSTEM_CONFIG.os,
    heartbeatInterval: 25000,
    farmCheckInterval: 3000,
    friendCheckInterval: 12000,
    farmCheckIntervalMin: 3000,
    farmCheckIntervalMax: 5000,
    friendCheckIntervalMin: 12000,
    friendCheckIntervalMax: 15000,
    maxPendingRequests: Number(process.env.MAX_PENDING_REQUESTS) || 10,
    minRequestIntervalMs: Math.max(0, Number(process.env.MIN_REQUEST_INTERVAL_MS) || 120),
    adminPort: Number(process.env.ADMIN_PORT),
    adminHost: process.env.ADMIN_HOST || '127.0.0.1',
    adminPassword: process.env.ADMIN_PASSWORD,
    trustProxy: ['1', 'true', 'yes'].includes(String(process.env.TRUST_PROXY || '').toLowerCase()),
    ALLOWED_ORIGINS: String(process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean),
};

function updateRuntimeConfig(newConfig) {
    if (newConfig.serverUrl && typeof newConfig.serverUrl === 'string') {
        CONFIG.serverUrl = newConfig.serverUrl;
    }
    if (newConfig.clientVersion && typeof newConfig.clientVersion === 'string') {
        CONFIG.clientVersion = newConfig.clientVersion;
    }
    if (newConfig.platform && typeof newConfig.platform === 'string') {
        CONFIG.platform = newConfig.platform;
    }
    if (newConfig.os && typeof newConfig.os === 'string') {
        CONFIG.os = newConfig.os;
    }
}

function getRuntimeConfig() {
    return {
        serverUrl: CONFIG.serverUrl,
        clientVersion: CONFIG.clientVersion,
        platform: CONFIG.platform,
        os: CONFIG.os,
    };
}

function getDefaultSystemConfig() {
    return { ...DEFAULT_SYSTEM_CONFIG };
}

// 生长阶段枚举
const PlantPhase = {
    UNKNOWN: 0,
    SEED: 1,
    GERMINATION: 2,
    SMALL_LEAVES: 3,
    LARGE_LEAVES: 4,
    BLOOMING: 5,
    MATURE: 6,
    DEAD: 7,
};

const PHASE_NAMES = ['未知', '种子', '发芽', '小叶', '大叶', '开花', '成熟', '枯死'];

module.exports = { CONFIG, PlantPhase, PHASE_NAMES, updateRuntimeConfig, getRuntimeConfig, getDefaultSystemConfig };
