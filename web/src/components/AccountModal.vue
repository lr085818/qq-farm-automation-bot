<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import api from '@/api'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{
  show: boolean
  editData?: any
}>()

const emit = defineEmits(['close', 'saved'])

const toast = useToastStore()

// 标签页：wx-微信扫码, manual-手动填码
const activeTab = ref<'wx' | 'manual'>('manual')
const loading = ref(false)
const errorMessage = ref('')

// 表单数据
const form = reactive({
  name: '',
  code: '',
  platform: 'qq' as 'qq' | 'wx',
  avatar: '',
})

// yx520微信扫码相关
const yxQrCode = ref('')
const yxStatusMessage = ref('准备就绪，正在获取二维码...')
const yxErrorMessage = ref('')
const yxIsLoading = ref(false)
const yxUuid = ref('')
const yxNickname = ref('')
const yxAvatar = ref('')
let yxPollTimer: any = null

async function getYxQRCode() {
  if (yxPollTimer) clearInterval(yxPollTimer)
  yxIsLoading.value = true
  yxErrorMessage.value = ''
  yxStatusMessage.value = '正在获取微信登录二维码...'
  yxQrCode.value = ''

  try {
    const res = await api.get('/api/wx-code-proxy?action=get_qr')
    const data = res.data
    if (data.code === 200 && data.data && data.data.qr_data) {
      yxQrCode.value = data.data.qr_data
      yxUuid.value = data.data.uuid
      yxStatusMessage.value = '请使用微信扫描二维码 (正在自动监听扫码状态)'
      yxIsLoading.value = false

      // 开始轮询扫码状态
      yxPollTimer = setInterval(() => checkYxLoginStatus(data.data.uuid), 2000)
    } else {
      yxErrorMessage.value = data.msg || '获取二维码失败'
      yxStatusMessage.value = '获取失败，请重试'
      yxIsLoading.value = false
    }
  } catch (e: any) {
    yxErrorMessage.value = '网络错误，获取二维码失败'
    yxStatusMessage.value = '请求失败'
    yxIsLoading.value = false
  }
}

async function checkYxLoginStatus(uuid: string) {
  try {
    const res = await api.get(`/api/wx-code-proxy?action=check_qr&uuid=${uuid}`)
    const data = res.data
    if (data.code === 200) {
      clearInterval(yxPollTimer)
      yxPollTimer = null
      yxNickname.value = data.data?.nickname || ''
      yxAvatar.value = data.data?.avatar || ''
      yxStatusMessage.value = '授权成功！正在获取授权码...'
      
      // 拉取最终的 Code
      await fetchYxFinalCode(data.data.wxid)
    } else if (data.code === 202) {
      yxStatusMessage.value = `状态: ${data.msg || '等待扫码'}`
    }
  } catch (e) {
    // 忽略轮询波动，静默重试
  }
}

async function fetchYxFinalCode(wxid: string) {
  try {
    const res = await api.get(`/api/wx-code-proxy?action=login&wxid=${wxid}`)
    const data = res.data
    if (data.code === 200 && data.data && data.data.wx_code) {
      const wxCode = data.data.wx_code
      
      // 自动填入并切换到手动填码 Tab
      form.code = wxCode
      form.platform = 'wx'
      if (!form.name && yxNickname.value)
        form.name = yxNickname.value
      form.avatar = yxAvatar.value
      activeTab.value = 'manual'
      toast.success('微信授权码已自动填入！')
    } else {
      yxErrorMessage.value = data.msg || '获取授权码失败，请重试'
      yxStatusMessage.value = '授权码拉取失败'
    }
  } catch (e: any) {
    yxErrorMessage.value = '拉取授权码失败'
    yxStatusMessage.value = '请求异常'
  }
}

function stopYxPoll() {
  if (yxPollTimer) {
    clearInterval(yxPollTimer)
    yxPollTimer = null
  }
}

// 微信二维码图片
const yxQrImageSrc = computed(() => {
  if (!yxQrCode.value)
    return ''
  if (yxQrCode.value.startsWith('data:image/'))
    return yxQrCode.value
  if (/^https?:\/\/api\.qrserver\.com\//.test(yxQrCode.value))
    return yxQrCode.value
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(yxQrCode.value)}`
})

// 添加账号
async function addAccount(data: any) {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.post('/api/accounts', data)
    if (res.data.ok) {
      emit('saved')
      close()
    }
    else {
      errorMessage.value = `保存失败: ${res.data.error}`
    }
  }
  catch (e: any) {
    errorMessage.value = `保存失败: ${e.response?.data?.error || e.message}`
  }
  finally {
    loading.value = false
  }
}

// 手动提交
async function submitManual() {
  errorMessage.value = ''
  if (!form.code) {
    errorMessage.value = '请输入Code'
    return
  }

  let code = form.code.trim()
  const match = code.match(/[?&]code=([^&]+)/i)
  if (match && match[1]) {
    code = decodeURIComponent(match[1])
    form.code = code
  }

  let payload: any = {}
  if (props.editData) {
    const onlyNameChanged = form.name !== props.editData.name
      && form.code === (props.editData.code || '')
      && form.platform === (props.editData.platform || 'qq')

    if (onlyNameChanged) {
      payload = { id: props.editData.id, name: form.name }
    }
    else {
      payload = {
        id: props.editData.id,
        name: form.name,
        code,
        platform: form.platform,
        loginType: 'manual',
        avatar: form.avatar,
      }
    }
  }
  else {
    payload = {
      name: form.name,
      code,
      platform: form.platform,
      loginType: 'manual',
      avatar: form.avatar,
    }
  }

  await addAccount(payload)
}

function close() {
  stopYxPoll()
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    if (props.editData) {
      activeTab.value = 'manual'
      form.name = props.editData.name || ''
      form.code = props.editData.code || ''
      form.platform = props.editData.platform || 'qq'
      form.avatar = props.editData.avatar || ''
    }
    else {
      activeTab.value = 'manual'
      form.name = ''
      form.code = ''
      form.platform = 'qq'
      form.avatar = ''
      yxNickname.value = ''
      yxAvatar.value = ''
    }
  }
  else {
    stopYxPoll()
  }
})

watch(activeTab, (tab) => {
  if (tab === 'wx') {
    getYxQRCode()
  } else {
    stopYxPoll()
  }
})
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="max-h-[90vh] max-w-md w-full overflow-hidden rounded-lg shadow-xl" :style="{ background: 'var(--theme-bg)' }">
      <!-- Header -->
      <div class="flex items-center justify-between border-b p-4" :style="{ borderColor: 'color-mix(in srgb, var(--theme-text) 10%, transparent)' }">
        <h3 class="text-lg font-semibold" :style="{ color: 'var(--theme-text)' }">
          {{ editData ? '编辑账号' : '添加账号' }}
        </h3>
        <BaseButton variant="ghost" class="!p-1" @click="close">
          <div class="i-carbon-close text-xl" :style="{ color: 'var(--theme-text)' }" />
        </BaseButton>
      </div>

      <div class="max-h-[calc(90vh-80px)] overflow-y-auto p-4">
        <!-- 错误信息 -->
        <div v-if="errorMessage" class="mb-4 rounded p-3 text-sm" :style="{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }">
          {{ errorMessage }}
        </div>

        <!-- Tabs -->
        <div class="mb-4 flex border-b" :style="{ borderColor: 'color-mix(in srgb, var(--theme-text) 10%, transparent)' }">
          <button
            class="flex-1 py-2 text-center text-sm font-medium transition-colors"
            :class="activeTab === 'manual' ? 'border-b-2' : 'opacity-60'"
            :style="{
              color: activeTab === 'manual' ? 'var(--theme-primary)' : 'var(--theme-text)',
              borderColor: 'var(--theme-primary)',
            }"
            @click="activeTab = 'manual'"
          >
            手动填码
          </button>
          <button
            class="flex-1 py-2 text-center text-sm font-medium transition-colors"
            :class="activeTab === 'wx' ? 'border-b-2' : 'opacity-60'"
            :style="{
              color: activeTab === 'wx' ? 'var(--theme-primary)' : 'var(--theme-text)',
              borderColor: 'var(--theme-primary)',
            }"
            @click="activeTab = 'wx'"
          >
            微信扫码
          </button>
        </div>

        <!-- 微信扫码 Tab -->
        <div v-if="activeTab === 'wx'" class="space-y-4">
          <div class="flex flex-col items-center justify-center py-4 space-y-4">
            <div
              v-if="yxQrImageSrc"
              class="border rounded-lg p-2"
              :style="{ borderColor: 'color-mix(in srgb, var(--theme-text) 20%, transparent)', background: '#fff' }"
            >
              <img :src="yxQrImageSrc" class="h-48 w-48">
            </div>
            <div
              v-else
              class="h-48 w-48 flex items-center justify-center rounded-lg"
              :style="{ background: 'color-mix(in srgb, var(--theme-bg) 90%, var(--theme-text))' }"
            >
              <div v-if="yxIsLoading" i-svg-spinners-90-ring-with-bg class="text-3xl" :style="{ color: 'var(--theme-primary)' }" />
              <span v-else class="text-sm" :style="{ color: 'var(--theme-text)' }">等待获取二维码</span>
            </div>

            <p class="text-center text-sm" :style="{ color: 'var(--theme-text)' }">
              {{ yxStatusMessage }}
            </p>

            <p v-if="yxErrorMessage" class="text-center text-sm text-red-600">
              {{ yxErrorMessage }}
            </p>

            <BaseButton variant="secondary" size="sm" :loading="yxIsLoading" @click="getYxQRCode">
              刷新二维码
            </BaseButton>
          </div>

          <div class="text-center text-xs opacity-60 px-4 leading-relaxed" :style="{ color: 'var(--theme-text)' }">
            使用微信扫描二维码授权，扫码成功后系统将自动解析填入授权码。
          </div>
        </div>

        <!-- 手动填码 Tab -->
        <div v-if="activeTab === 'manual'" class="space-y-4">
          <BaseInput
            v-model="form.name"
            label="账号备注（可选）"
            placeholder="留空默认账号"
          />

          <BaseTextarea
            v-model="form.code"
            label="Code"
            placeholder="请输入登录 Code"
            :rows="3"
          />

          <div v-if="form.platform === 'wx'" class="flex items-center gap-1 text-xs" :style="{ color: 'var(--theme-text)', opacity: 0.7 }">
            <div class="i-carbon-qr-code text-sm" />
            <span>微信区用户可切换至「微信扫码」标签页，通过手机扫码直接自动填入授权码。</span>
          </div>

          <div v-if="!editData" class="flex gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="form.platform"
                type="radio"
                value="qq"
                class="h-4 w-4"
                :style="{ accentColor: 'var(--theme-primary)' }"
              >
              <span class="text-sm" :style="{ color: 'var(--theme-text)' }">QQ小程序</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="form.platform"
                type="radio"
                value="wx"
                class="h-4 w-4"
                :style="{ accentColor: 'var(--theme-primary)' }"
              >
              <span class="text-sm" :style="{ color: 'var(--theme-text)' }">微信小程序</span>
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <BaseButton variant="outline" @click="close">
              取消
            </BaseButton>
            <BaseButton variant="primary" :loading="loading" @click="submitManual">
              {{ editData ? '保存' : '添加' }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
