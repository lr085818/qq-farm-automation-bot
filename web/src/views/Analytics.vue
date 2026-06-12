<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import api from '@/api'
import { useAccountStore } from '@/stores/account'
import { usePlantBlacklistStore } from '@/stores/plant-blacklist'
import { useToastStore } from '@/stores/toast'

const accountStore = useAccountStore()
const plantBlacklistStore = usePlantBlacklistStore()
const toast = useToastStore()
const { currentAccountId } = storeToRefs(accountStore)
const { blacklist } = storeToRefs(plantBlacklistStore)

const activeTab = ref<'crops' | 'blacklist'>('crops')
const loading = ref(false)
const list = ref<any[]>([])
const sortKey = ref<'exp' | 'fert' | 'level'>('exp')
const imageErrors = ref<Record<string | number, boolean>>({})
const searchKeyword = ref('')
const batchLoading = ref(false)
const currentPage = ref(1)
const pageSize = 50

const metricMap: Record<'exp' | 'fert' | 'level', string> = {
  exp: 'expPerHour',
  fert: 'normalFertilizerExpPerHour',
  level: 'level',
}

const filteredList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword)
    return list.value
  return list.value.filter((item: any) => {
    const name = String(item?.name || '').toLowerCase()
    const seedId = String(item?.seedId || '')
    return name.includes(keyword) || seedId.includes(keyword)
  })
})

const sortedList = computed(() => {
  const metric = metricMap[sortKey.value]
  return [...filteredList.value].sort((a, b) => {
    const av = Number((a as Record<string, any>)?.[metric] ?? -1)
    const bv = Number((b as Record<string, any>)?.[metric] ?? -1)
    return bv - av
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedList.value.length / pageSize)))
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedList.value.slice(start, start + pageSize)
})

async function loadAnalytics() {
  if (!currentAccountId.value)
    return
  loading.value = true
  try {
    const res = await api.get('/api/analytics', {
      params: { sort: sortKey.value },
      headers: { 'x-account-id': currentAccountId.value },
    })
    list.value = Array.isArray(res.data.data) ? res.data.data : []
    currentPage.value = 1
  }
  catch {
    list.value = []
  }
  finally {
    loading.value = false
  }
}

async function handleToggleBlacklist(item: any) {
  await plantBlacklistStore.toggleBlacklist(item.seedId)
  toast.success(plantBlacklistStore.isBlacklisted(item.seedId) ? `${item.name} 已加入黑名单` : `${item.name} 已移出黑名单`)
}

async function handleAddAllToBlacklist() {
  if (batchLoading.value)
    return
  batchLoading.value = true
  try {
    await plantBlacklistStore.addAllToBlacklist(list.value.map((item: any) => item.seedId))
    toast.success(`已将 ${list.value.length} 种作物加入黑名单`)
  }
  finally {
    batchLoading.value = false
  }
}

async function handleClearBlacklist() {
  if (batchLoading.value)
    return
  batchLoading.value = true
  try {
    await plantBlacklistStore.clearBlacklist()
    toast.success('已清空黑名单')
  }
  finally {
    batchLoading.value = false
  }
}

function formatLv(level: any) {
  if (level === null || level === undefined || level === '' || Number(level) < 0)
    return '未知'
  return String(level)
}

function formatGrowTime(seconds: any) {
  const s = Number(seconds)
  if (!Number.isFinite(s) || s <= 0)
    return '0秒'
  if (s < 3600) {
    const mins = Math.floor(s / 60)
    return `${mins}分`
  }
  const hours = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  return mins > 0 ? `${hours}时${mins}分` : `${hours}时`
}

function getSeedNameById(seedId: number) {
  return list.value.find((item: any) => item.seedId === seedId)?.name || `作物 ${seedId}`
}

onMounted(() => {
  loadAnalytics()
  plantBlacklistStore.fetchBlacklist()
})

watch([currentAccountId, sortKey], () => {
  loadAnalytics()
})

watch(sortedList, () => {
  if (currentPage.value > totalPages.value)
    currentPage.value = totalPages.value
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      <button class="farm-3d-tab mb-2 px-4 py-2 text-sm" :class="{ 'is-active': activeTab === 'crops' }" @click="activeTab = 'crops'">
        <div class="flex items-center gap-2">
          <div class="i-carbon-sprout text-lg" />
          <span>全部作物</span>
          <span v-if="list.length" class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/50 dark:text-green-300">{{ list.length }}</span>
        </div>
      </button>
      <button class="farm-3d-tab mb-2 px-4 py-2 text-sm" :class="{ 'is-active': activeTab === 'blacklist' }" @click="activeTab = 'blacklist'">
        <div class="flex items-center gap-2">
          <div class="i-carbon-subtract-alt text-lg" />
          <span>黑名单作物</span>
          <span v-if="blacklist.length" class="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/50 dark:text-red-300">{{ blacklist.length }}</span>
        </div>
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="i-svg-spinners-90-ring-with-bg text-4xl text-blue-500" />
    </div>

    <div v-else-if="!currentAccountId" class="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">
      请选择账号后查看分析页。
    </div>

    <div v-else-if="list.length === 0" class="rounded-lg bg-white p-8 text-center text-gray-500 shadow dark:bg-gray-800">
      暂无分析数据。
    </div>

    <div v-else-if="activeTab === 'crops'" class="space-y-4">
      <div class="rounded-2xl border border-white/20 bg-white/40 p-4 shadow backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <div class="i-carbon-growth text-xl text-emerald-500" />
            <div>
              <div class="text-sm font-semibold">全部作物 {{ list.length }} 种</div>
              <div class="text-xs text-gray-500">作者当前分析页只保留作物列表和黑名单，这里已同步成同一结构。</div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <input v-model="searchKeyword" type="text" placeholder="搜索作物名称、种子ID..." class="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            <select v-model="sortKey" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 focus:border-blue-500 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="exp">按经验/时</option>
              <option value="fert">按普肥经验/时</option>
              <option value="level">按种子等级</option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-white/20 bg-white/40 shadow backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40">
        <div class="overflow-x-auto">
          <table class="w-full whitespace-nowrap text-left text-sm">
            <thead class="bg-gray-50/80 text-xs text-gray-500 uppercase dark:bg-gray-700/50 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3 font-medium">作物</th>
                <th class="px-4 py-3 font-medium">时间</th>
                <th class="px-4 py-3 text-right font-medium">经验/时</th>
                <th class="px-4 py-3 text-right font-medium">普通肥经验/时</th>
                <th class="px-4 py-3 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="item in pagedList" :key="item.seedId" class="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                      <img v-if="item.image && !imageErrors[item.seedId]" :src="item.image" class="h-8 w-8 object-contain" @error="imageErrors[item.seedId] = true">
                      <div v-else class="i-carbon-sprout text-xl text-gray-400" />
                    </div>
                    <div>
                      <div class="font-bold">
                        {{ item.name }}
                        <span v-if="blacklist.includes(item.seedId)" class="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">黑名单</span>
                      </div>
                      <div class="text-xs text-gray-400">Lv{{ formatLv(item.level) }} · ID {{ item.seedId }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatGrowTime(item.growTime) }}</td>
                <td class="px-4 py-3 text-right font-bold text-emerald-500">{{ item.expPerHour }}</td>
                <td class="px-4 py-3 text-right font-bold text-sky-500">{{ item.normalFertilizerExpPerHour ?? '-' }}</td>
                <td class="px-4 py-3 text-center">
                  <button class="farm-3d-button farm-3d-button--mini" :class="blacklist.includes(item.seedId) ? 'farm-3d-button--danger' : ''" @click="handleToggleBlacklist(item)">
                    {{ blacklist.includes(item.seedId) ? '移出黑名单' : '加入黑名单' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex items-center justify-between text-sm text-gray-500">
        <div>首页 上一页 {{ currentPage }} / {{ totalPages }} 下一页 末页 共 {{ sortedList.length }} 条</div>
        <div class="flex items-center gap-2">
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage <= 1" @click="currentPage = 1">首页</button>
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">末页</button>
        </div>
      </div>
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-white/20 bg-white/40 shadow backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40">
      <div class="border-b border-gray-200/50 p-4 dark:border-gray-700/50">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold">黑名单作物 {{ blacklist.length }} 种</div>
            <div class="text-xs text-gray-500">自动偷菜时会跳过这些作物。</div>
          </div>
          <div class="flex items-center gap-2">
            <button class="farm-3d-button farm-3d-button--orange px-3 py-2 text-sm" :disabled="batchLoading || list.length === 0" @click="handleAddAllToBlacklist">一键拉入黑名单</button>
            <button v-if="blacklist.length > 0" class="farm-3d-button farm-3d-button--danger px-3 py-2 text-sm" :disabled="batchLoading" @click="handleClearBlacklist">清空黑名单</button>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div v-if="blacklist.length === 0" class="py-8 text-center text-gray-500">暂无黑名单作物</div>
        <div v-else class="space-y-3">
          <div v-for="seedId in blacklist" :key="seedId" class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
            <div>
              <div class="font-medium">{{ getSeedNameById(seedId) }}</div>
              <div class="text-xs text-gray-400">ID {{ seedId }}</div>
            </div>
            <button class="farm-3d-button farm-3d-button--danger farm-3d-button--mini" @click="plantBlacklistStore.removeFromBlacklist(seedId)">移出黑名单</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
