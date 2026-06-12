<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import api from '@/api'
import { useAccountStore } from '@/stores/account'
import { useStatusStore } from '@/stores/status'
import { useToastStore } from '@/stores/toast'

const accountStore = useAccountStore()
const statusStore = useStatusStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { status } = storeToRefs(statusStore)

const SHOP_TABS = [
  { id: 2, key: 'seeds', label: '种子商店', icon: 'i-carbon-sprout' },
  { id: 1, key: 'items', label: '道具商城', icon: 'i-carbon-chemistry' },
]

const activeShopId = ref<number>(2)
const loading = ref(false)
const goodsList = ref<any[]>([])
const imageErrors = ref<Record<string | number, boolean>>({})
const currentPage = ref(1)
const pageSize = 30

const buyModal = ref({
  show: false,
  goods: null as any,
  quantity: 1,
  loading: false,
})

const canBuy = computed(() => !!currentAccount.value?.running)
const userGold = computed(() => Number(status.value?.status?.gold) || 0)
const userTicket = computed(() => Number(status.value?.status?.ticket) || 0)
const totalPages = computed(() => Math.max(1, Math.ceil(goodsList.value.length / pageSize)))
const pageStart = computed(() => (currentPage.value - 1) * pageSize)
const pageEnd = computed(() => pageStart.value + pageSize)
const pagedGoodsList = computed(() => goodsList.value.slice(pageStart.value, pageEnd.value))
function toDisplayNumber(value: any, fallback = 0): number {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : fallback
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (value && typeof value === 'object') {
    if ('low' in value) {
      const low = Number(value.low) || 0
      const high = Number(value.high) || 0
      return high === 0 ? low : high * 4294967296 + (low >>> 0)
    }
    if ('value' in value)
      return toDisplayNumber(value.value, fallback)
  }
  return fallback
}

function toDisplayText(value: any, fallback = ''): string {
  if (typeof value === 'string')
    return value
  if (typeof value === 'number')
    return String(value)
  return fallback
}

function normalizeGoods(goods: any) {
  const itemId = toDisplayNumber(goods?.item_id, toDisplayNumber(goods?.id))
  const id = toDisplayNumber(goods?.id, itemId)
  const requiredLevel = toDisplayNumber(goods?.required_level, toDisplayNumber(goods?.requiredLevel))
  const unlocked = goods?.unlocked !== false && goods?.can_buy !== false
  return {
    ...goods,
    id,
    item_id: itemId,
    price: toDisplayNumber(goods?.price),
    unlocked,
    can_buy: unlocked,
    required_level: requiredLevel,
    user_level: toDisplayNumber(goods?.user_level),
    name: toDisplayText(goods?.name, `商品 ${id || itemId}`),
    desc: toDisplayText(goods?.desc),
    image: toDisplayText(goods?.image),
    purchase_route: toDisplayText(goods?.purchase_route, 'shop'),
    fertilizer_type: toDisplayText(goods?.fertilizer_type),
    currency: toDisplayText(goods?.currency, 'gold'),
  }
}

function currencyName(goods: any) {
  return goods?.currency === 'ticket' ? '点券' : '金豆豆'
}

function priceText(goods: any, quantity = 1) {
  return `${(Number(goods?.price) || 0) * quantity} ${currencyName(goods)}`
}

function buyActionText(goods: any) {
  if (goods?.purchase_route === 'fertilizer')
    return '购买化肥'
  return '购买'
}

function applyTabQuery() {
  const tab = String(route.query.tab || '').trim()
  const found = SHOP_TABS.find(item => item.key === tab)
  if (found)
    activeShopId.value = found.id
}

function updateTabQuery(shopId: number) {
  const found = SHOP_TABS.find(item => item.id === shopId)
  if (!found)
    return
  router.replace({ query: { ...route.query, tab: found.key } })
}

async function fetchGoods() {
  if (!currentAccountId.value)
    return
  loading.value = true
  try {
    const res = await api.get(`/api/shop/goods?shop_id=${activeShopId.value}`)
    if (res.data.ok && res.data.data) {
      goodsList.value = (res.data.data.goods_list || []).map(normalizeGoods)
      currentPage.value = 1
    }
  }
  catch (e: any) {
    toast.error(e.response?.data?.error || '获取商品列表失败')
  }
  finally {
    loading.value = false
  }
}

async function handleBuyClick(goods: any) {
  if (!canBuy.value) {
    toast.warning('账号未运行，仅可浏览商店数据')
    return
  }
  if (!goods.can_buy) {
    toast.warning(goods.required_level ? `等级不足，需要 Lv.${goods.required_level}` : '该商品尚未解锁')
    return
  }
  buyModal.value = {
    show: true,
    goods,
    quantity: 1,
    loading: false,
  }
}

async function executeBuy() {
  const { goods, quantity } = buyModal.value
  if (!goods || quantity <= 0)
    return

  buyModal.value.loading = true
  try {
    let res
    if (goods.purchase_route === 'fertilizer') {
      res = await api.post('/api/fertilizer/buy', {
        type: goods.fertilizer_type || 'organic',
        count: quantity,
      })
    }
    else {
      res = await api.post('/api/shop/buy', {
        goodsId: goods.id,
        count: quantity,
        price: goods.price,
      })
    }

    if (res.data.ok) {
      const bought = Number(res.data.bought ?? quantity) || quantity
      toast.success(`购买成功：${goods.name} x ${bought}`)
      buyModal.value.show = false
      if (currentAccountId.value)
        await statusStore.fetchStatus(currentAccountId.value)
      await fetchGoods()
    }
    else {
      toast.error(res.data.error || '购买失败')
    }
  }
  catch (e: any) {
    toast.error(e.response?.data?.error || '购买失败')
  }
  finally {
    buyModal.value.loading = false
  }
}

onMounted(() => {
  applyTabQuery()
  fetchGoods()
})

watch(() => route.query.tab, () => {
  applyTabQuery()
})

watch([currentAccountId, activeShopId], () => {
  updateTabQuery(activeShopId.value)
  fetchGoods()
})

watch(goodsList, () => {
  if (currentPage.value > totalPages.value)
    currentPage.value = totalPages.value
})
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          农场大商城
        </h1>
        <p class="text-sm text-gray-500">
          同步种子商店和道具商城，化肥购买走专用接口。
        </p>
      </div>

      <div v-if="currentAccountId" class="flex gap-3">
        <div class="flex items-center gap-2 rounded-xl border border-white/20 bg-white/40 px-4 py-2 shadow-sm backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/40">
          <div class="i-carbon-circle-dash text-lg text-amber-500" />
          <div class="flex flex-col">
            <span class="text-[10px] leading-none text-gray-400 font-bold">金豆豆</span>
            <span class="mt-0.5 text-sm font-bold">{{ userGold }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 rounded-xl border border-white/20 bg-white/40 px-4 py-2 shadow-sm backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/40">
          <div class="i-carbon-ticket text-lg text-sky-500" />
          <div class="flex flex-col">
            <span class="text-[10px] leading-none text-gray-400 font-bold">点券</span>
            <span class="mt-0.5 text-sm font-bold">{{ userTicket }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!currentAccountId" class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-md rounded-2xl border border-dashed border-gray-300 bg-white/30 p-8 text-center backdrop-blur-md dark:border-gray-700">
        请选择账号后查看商城。
      </div>
    </div>

    <div v-else class="flex flex-1 flex-col overflow-hidden">
      <div
        v-if="!canBuy"
        class="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <div class="i-carbon-warning mt-0.5 shrink-0 text-base" />
        <p>当前账号未运行，正在显示可浏览的商店数据；真实购买结果以账号运行态为准。</p>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="tab in SHOP_TABS"
          :key="tab.id"
          class="farm-3d-tab px-4 py-2"
          :class="{ 'is-active': activeShopId === tab.id }"
          @click="activeShopId = tab.id"
        >
          <div class="flex items-center gap-2">
            <div :class="[tab.icon, 'text-lg']" />
            <span>{{ tab.label }}</span>
          </div>
        </button>
      </div>

      <div v-if="goodsList.length > 0" class="mb-4 flex items-center justify-between text-xs text-gray-500">
        <div>{{ currentPage }}/{{ totalPages }} ({{ goodsList.length }} 个商品)</div>
        <div class="flex items-center gap-2">
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage <= 1" @click="currentPage = 1">首页</button>
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
          <button class="farm-3d-button farm-3d-button--mini px-3 py-1" :disabled="currentPage >= totalPages" @click="currentPage = totalPages">末页</button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-20">
          <div class="i-svg-spinners-90-ring-with-bg text-4xl text-emerald-500" />
        </div>

        <div v-else-if="goodsList.length === 0" class="rounded-2xl border border-white/20 bg-white/20 py-20 text-center dark:border-gray-700/30">
          当前商店没有可显示商品。
        </div>

        <div v-else class="grid grid-cols-2 gap-4 pb-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div
            v-for="goods in pagedGoodsList"
            :key="goods.id"
            class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-4 shadow-md backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-gray-700/30 dark:bg-gray-800/40"
          >
            <div v-if="!goods.unlocked" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/60 p-4 text-center backdrop-blur-[1px]">
              <div class="i-carbon-locked mb-2 text-2xl text-white" />
              <div class="text-xs text-white/90 font-bold">未解锁</div>
              <div v-if="goods.required_level" class="mt-1 text-[10px] text-white/70">需要等级 Lv.{{ goods.required_level }}</div>
            </div>

            <div>
              <div class="mb-3 h-24 w-full flex items-center justify-center overflow-hidden rounded-xl bg-white/30 dark:bg-gray-900/20">
                <img
                  v-if="goods.image && !imageErrors[goods.id]"
                  :src="goods.image"
                  :alt="goods.name"
                  class="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-110"
                  @error="imageErrors[goods.id] = true"
                >
                <div v-else class="text-3xl text-gray-400 font-extrabold uppercase">{{ goods.name.slice(0, 1) }}</div>
              </div>

              <h3 class="truncate text-sm font-bold" :title="goods.name">{{ goods.name }}</h3>
              <p class="mt-1 h-8 line-clamp-2 text-[11px] leading-snug text-gray-500" :title="goods.desc">{{ goods.desc }}</p>
            </div>

            <div class="mt-4 border-t border-gray-200/30 pt-3 dark:border-gray-700/30">
              <div class="mb-3 flex items-center justify-between text-xs font-bold">
                <span class="text-gray-400">单价</span>
                <span class="flex items-center gap-0.5 text-orange-500">
                  <div v-if="goods.currency === 'ticket'" class="i-carbon-ticket text-[10px]" />
                  <div v-else class="i-carbon-circle-dash text-[10px]" />
                  {{ priceText(goods) }}
                </span>
              </div>
              <button
                class="farm-3d-button farm-3d-button--mini w-full flex items-center justify-center gap-1.5 py-1.5"
                :disabled="!canBuy || !goods.can_buy"
                @click="handleBuyClick(goods)"
              >
                <div v-if="goods.can_buy" class="i-carbon-shopping-cart" />
                <div v-else class="i-carbon-locked" />
                <span>{{ goods.can_buy ? buyActionText(goods) : `需等级 ${goods.required_level}` }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="buyModal.show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="buyModal.show = false"
    >
      <div class="w-96 rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-900/95" @click.stop>
        <div class="mb-4 flex items-center justify-between border-b border-gray-200/50 pb-3 dark:border-gray-700/50">
          <h3 class="text-lg font-bold">购买商品</h3>
          <button class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" @click="buyModal.show = false">
            <div class="i-carbon-close text-xl" />
          </button>
        </div>

        <div v-if="buyModal.goods" class="space-y-4">
          <div class="flex gap-4">
            <div class="h-16 w-16 flex shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <img v-if="buyModal.goods.image && !imageErrors[buyModal.goods.id]" :src="buyModal.goods.image" class="max-h-full max-w-full object-contain">
              <div v-else class="text-xl font-bold">{{ buyModal.goods.name.slice(0, 1) }}</div>
            </div>
            <div>
              <h4 class="text-sm font-bold">{{ buyModal.goods.name }}</h4>
              <p class="mt-1 text-xs leading-normal text-gray-500">{{ buyModal.goods.desc }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-gray-200/50 pt-4 dark:border-gray-700/50">
            <span class="text-sm text-gray-500">数量</span>
            <div class="flex items-center gap-2">
              <button class="h-8 w-8 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300" @click="buyModal.quantity = Math.max(1, buyModal.quantity - 1)">-</button>
              <input v-model.number="buyModal.quantity" type="number" min="1" class="h-8 w-16 rounded-lg border bg-white text-center text-sm focus:outline-none dark:bg-gray-800">
              <button class="h-8 w-8 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300" @click="buyModal.quantity++">+</button>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-gray-200/50 pt-4 text-sm dark:border-gray-700/50">
            <span class="text-gray-500">支付总计</span>
            <span class="flex items-center gap-0.5 font-bold text-orange-500">
              <div v-if="buyModal.goods.currency === 'ticket'" class="i-carbon-ticket text-xs" />
              <div v-else class="i-carbon-circle-dash text-xs" />
              {{ priceText(buyModal.goods, buyModal.quantity) }}
            </span>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <button class="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800" @click="buyModal.show = false">取消</button>
            <button class="farm-3d-button farm-3d-button--orange flex items-center gap-1.5 px-6 py-2 text-sm" :disabled="buyModal.loading" @click="executeBuy">
              <div v-if="buyModal.loading" class="i-svg-spinners-90-ring-with-bg" />
              <span>确认购买</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
