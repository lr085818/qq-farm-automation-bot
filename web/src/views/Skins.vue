<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useStatusStore } from '@/stores/status'
import { useToastStore } from '@/stores/toast'
import { useStorage } from '@vueuse/core'

const accountStore = useAccountStore()
const statusStore = useStatusStore()
const toast = useToastStore()
const { currentAccountId, currentAccount } = storeToRefs(accountStore)
const { status } = storeToRefs(statusStore)

const activeTab = ref<'frames' | 'backgrounds'>('frames')
const previewFrameId = ref<number>(Number(localStorage.getItem('equipped_avatar_frame')) || 0)
const previewBgId = ref<number>(Number(localStorage.getItem('equipped_farm_bg')) || 2)

const equippedFrame = useStorage('equipped_avatar_frame', '0')
const equippedBg = useStorage('equipped_farm_bg', '2')

const frames = [
  { id: 0, name: '原装无框', desc: '系统默认头像展示效果', color: 'border-transparent shadow-none', style: 'solid', rarity: 'common' },
  { id: 2101, name: '经典内测头像框', desc: '参与农场内测的专属荣誉勋章', color: 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] animate-pulse', style: 'double', rarity: 'rare' },
  { id: 2102, name: '黄金至尊头像框', desc: '金光闪闪彰显农场主至尊财富', color: 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.7)]', style: 'groove', rarity: 'epic' },
  { id: 2103, name: 'SVIP璀璨头像框', desc: '高贵璀璨，尊享SVIP极致风范', color: 'border-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-[spin_6s_linear_infinite]', style: 'dashed', rarity: 'legendary' },
  { id: 2104, name: '踏春游园头像框', desc: '春意盎然，踏青郊游的青草香气', color: 'border-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]', style: 'ridge', rarity: 'rare' },
]

const backgrounds = [
  { id: 1, name: '经典草原', desc: '绿意葱茏，最纯粹原始的农场风貌', gradient: 'radial-gradient(circle at 50% 0%, #1e3a3a 0%, #0f172a 70%)', class: 'from-emerald-950 to-slate-900' },
  { id: 2, name: '暖阳麦田', desc: '金黄丰收，午后阳光洒满金色麦田', gradient: 'linear-gradient(rgba(24, 18, 10, 0.02), rgba(24, 18, 10, 0.05)), url("/bg.webp"), linear-gradient(to bottom, #292524, #1c1917)', class: 'from-amber-950 to-stone-900' },
  { id: 3, name: '幻境极光', desc: '浩瀚星空下划过绚烂静谧的欧若拉', gradient: 'radial-gradient(circle at 50% 0%, #2e1065 0%, #030712 70%)', class: 'from-purple-950 to-neutral-950' },
]

function getRarityBadge(rarity: string) {
  switch (rarity) {
    case 'legendary': return 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
    case 'epic': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    case 'rare': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/20'
  }
}

function getRarityLabel(rarity: string) {
  switch (rarity) {
    case 'legendary': return '传说'
    case 'epic': return '史诗'
    case 'rare': return '稀有'
    default: return '普通'
  }
}

function handleEquipFrame(id: number) {
  equippedFrame.value = String(id)
  previewFrameId.value = id
  toast.success('头像框更换成功！可在左侧边栏查看效果')
}

function handleEquipBg(id: number) {
  equippedBg.value = String(id)
  previewBgId.value = id
  localStorage.setItem('equipped_farm_bg_user_selected', '1')
  toast.success('背景装扮更换成功！')
  
  // Dynamically update default background style if matched
  const selected = backgrounds.find(b => b.id === id)
  if (selected && typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--theme-bg-image', selected.gradient)
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight">
        装扮商城与头像框
      </h1>
      <p class="text-sm text-gray-500">
        选购尊贵头像框和背景装扮，点亮你的个性化农场外观
      </p>
    </div>

    <div v-if="!currentAccountId" class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-md border border-dashed border-gray-300 rounded-2xl bg-white/30 p-8 text-center backdrop-blur-md dark:border-gray-700">
        <div class="i-carbon-user-avatar text-5xl mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-bold">未选择账号</h3>
        <p class="mt-2 text-sm text-gray-500">
          请在左侧侧边栏添加或选择一个QQ/微信托管账号以继续。
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex flex-1 flex-col md:flex-row gap-6 overflow-hidden">
      <!-- Live Preview Left Column -->
      <div class="w-full md:w-80 shrink-0 flex flex-col gap-6">
        <div class="border border-white/20 rounded-2xl bg-white/40 p-6 shadow-xl backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40 flex flex-col items-center text-center">
          <h3 class="text-sm font-bold text-gray-400 mb-6">实时装扮预览</h3>

          <!-- Avatar Preview Container -->
          <div class="relative h-36 w-36 flex items-center justify-center mb-6">
            <!-- QQ Avatar -->
            <div class="h-28 w-28 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md dark:bg-gray-700 dark:border-gray-800">
              <img
                :src="`https://q1.qlogo.cn/g?b=qq&nk=${currentAccount?.uin}&s=100`"
                class="h-full w-full object-cover"
                @error="(e) => (e.target as HTMLImageElement).src = '/avatar.jpg?v=2'"
              >
            </div>
            <!-- Frame Overlay -->
            <div
              v-if="previewFrameId > 0"
              class="absolute inset-0 border-[10px] rounded-full pointer-events-none"
              :class="frames.find(f => f.id === previewFrameId)?.color"
              :style="{ borderStyle: frames.find(f => f.id === previewFrameId)?.style }"
            />
          </div>

          <!-- User Details -->
          <h4 class="text-lg font-bold">{{ status?.status?.name || currentAccount?.nick || '未同步' }}</h4>
          <p class="text-xs text-gray-400 font-mono mt-1">UIN: {{ currentAccount?.uin }}</p>

          <!-- Level Progress -->
          <div class="w-full mt-4 bg-gray-100/50 dark:bg-gray-700/30 rounded-xl p-3">
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="text-gray-400">等级: {{ status?.status?.level || 0 }}</span>
              <span class="text-gray-400">经验值: {{ status?.status?.exp || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Help Info -->
        <div class="border border-white/20 rounded-2xl bg-white/40 p-5 text-xs text-gray-500 backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40">
          <div class="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 mb-2">
            <div class="i-carbon-idea" />
            <span>装扮穿戴规则</span>
          </div>
          <p class="leading-normal">
            头像框仅在本地控制台以及侧边栏进行展示，使您的系统界面更加酷炫。更换背景装扮将立即改变系统面板的玻璃拟物毛玻璃效果，可随时进行个性化切换。
          </p>
        </div>
      </div>

      <!-- Right Column Tabs -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Tabs -->
        <div class="mb-4 flex space-x-2 shrink-0">
          <button
            class="farm-3d-tab px-4 py-2"
            :class="{ 'is-active': activeTab === 'frames' }"
            @click="activeTab = 'frames'"
          >
            <div class="flex items-center space-x-2">
              <div class="i-carbon-user-avatar text-lg" />
              <span>头像框</span>
            </div>
          </button>
          <button
            class="farm-3d-tab px-4 py-2"
            :class="{ 'is-active': activeTab === 'backgrounds' }"
            @click="activeTab = 'backgrounds'"
          >
            <div class="flex items-center space-x-2">
              <div class="i-carbon-image text-lg" />
              <span>背景装扮</span>
            </div>
          </button>
        </div>

        <!-- Tab contents -->
        <div class="flex-1 overflow-y-auto">
          <!-- FRAMES TAB -->
          <div v-if="activeTab === 'frames'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="frame in frames"
              :key="frame.id"
              class="border border-white/20 rounded-2xl bg-white/40 p-4 shadow-md backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40 flex items-center justify-between gap-4"
            >
              <!-- Small Preview -->
              <div class="relative h-16 w-16 shrink-0 flex items-center justify-center">
                <div class="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                  <img
                    :src="`https://q1.qlogo.cn/g?b=qq&nk=${currentAccount?.uin}&s=100`"
                    class="h-full w-full object-cover"
                    @error="(e) => (e.target as HTMLImageElement).src = '/avatar.jpg?v=2'"
                  >
                </div>
                <div
                  v-if="frame.id > 0"
                  class="absolute inset-0 border-4 rounded-full pointer-events-none"
                  :class="frame.color"
                  :style="{ borderStyle: frame.style }"
                />
              </div>

              <!-- Meta info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="font-bold text-sm truncate">{{ frame.name }}</h4>
                  <span
                    v-if="frame.id > 0"
                    class="rounded-full px-1.5 py-0.2 text-[9px] font-bold leading-tight"
                    :class="getRarityBadge(frame.rarity)"
                  >
                    {{ getRarityLabel(frame.rarity) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1 leading-normal">{{ frame.desc }}</p>
              </div>

              <!-- Action button -->
              <button
                class="farm-3d-button farm-3d-button--mini px-4 py-1.5"
                :class="equippedFrame === String(frame.id) ? 'farm-3d-button--green' : ''"
                @click="handleEquipFrame(frame.id)"
              >
                {{ equippedFrame === String(frame.id) ? '已穿戴' : '穿戴' }}
              </button>
            </div>
          </div>

          <!-- BACKGROUNDS TAB -->
          <div v-else-if="activeTab === 'backgrounds'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="bg in backgrounds"
              :key="bg.id"
              class="border border-white/20 rounded-2xl bg-white/40 p-4 shadow-md backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/40 flex items-center justify-between gap-4"
            >
              <!-- Color/Gradient circle preview -->
              <div class="h-12 w-12 shrink-0 rounded-xl shadow-inner border border-white/20" :style="{ background: bg.gradient }" />

              <!-- Meta info -->
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm">{{ bg.name }}</h4>
                <p class="text-xs text-gray-500 mt-1 leading-normal">{{ bg.desc }}</p>
              </div>

              <!-- Action button -->
              <button
                class="farm-3d-button farm-3d-button--mini px-4 py-1.5"
                :class="equippedBg === String(bg.id) ? 'farm-3d-button--green' : ''"
                @click="handleEquipBg(bg.id)"
              >
                {{ equippedBg === String(bg.id) ? '已应用' : '应用' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
