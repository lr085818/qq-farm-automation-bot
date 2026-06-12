<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import api from '@/api'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const cardCode = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const showPasswordStrength = ref(false)
const lockoutRemaining = ref(0)
const rateLimitRemaining = ref(0)

const cardClaimEnabled = ref(false)
const cardClaimLoading = ref(false)
const showClaimModal = ref(false)
const claimModalContent = ref({
  success: true,
  title: '',
  message: '',
  cardCode: '',
  days: 0
})

const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { score: 0, level: '', valid: false }
  
  let score = 0
  
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  
  let typeCount = 0
  if (/[a-z]/.test(pwd)) typeCount++
  if (/[A-Z]/.test(pwd)) typeCount++
  if (/[0-9]/.test(pwd)) typeCount++
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(pwd)) typeCount++
  
  if (typeCount >= 2) score += 2
  
  if (typeCount >= 3) score++
  if (typeCount >= 4) score++
  
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', '111111']
  if (commonPasswords.some(p => pwd.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2)
  }
  
  const level = score <= 2 ? '弱' : score <= 4 ? '中' : score <= 6 ? '强' : '非常强'
  const color = score <= 2 ? '#ef5350' : score <= 4 ? '#ffa726' : score <= 6 ? '#66bb6a' : '#43a047'
  const valid = pwd.length >= 6 && typeCount >= 2
  
  return { score, level, color, valid }
})

const usernameValid = computed(() => {
  const name = username.value
  if (!name) return { valid: false, message: '' }
  if (name.length < 3) return { valid: false, message: '用户名至少3位' }
  if (name.length > 32) return { valid: false, message: '用户名最多32位' }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return { valid: false, message: '只能包含字母、数字、下划线' }
  return { valid: true, message: '' }
})

watch(password, () => {
  if (!isLogin.value && password.value) {
    showPasswordStrength.value = true
  }
})

function validateForm(): boolean {
  if (!username.value) {
    error.value = '请输入用户名'
    return false
  }
  
  if (!usernameValid.value.valid) {
    error.value = usernameValid.value.message
    return false
  }
  
  if (!password.value) {
    error.value = '请输入密码'
    return false
  }
  
  if (!isLogin.value) {
    if (password.value.length < 6) {
      error.value = '密码长度至少6位'
      return false
    }
    
    if (!passwordStrength.value.valid) {
      error.value = '密码强度不足：需包含大写字母、小写字母、数字、特殊符号中的至少两种'
      return false
    }
    
    if (!cardCode.value) {
      error.value = '请输入卡密'
      return false
    }
  }
  
  return true
}

async function handleSubmit() {
  if (!validateForm()) return
  
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (isLogin.value) {
      const result = await userStore.login(username.value, password.value)
      if (result.ok) {
        if (result.data?.mustChangePassword) {
          success.value = '登录成功！请修改默认密码以确保账户安全'
        }
        setTimeout(() => {
          const pendingCode = sessionStorage.getItem('pending_add_code')
          const pendingPlatform = sessionStorage.getItem('pending_add_platform') || 'qq'
          if (pendingCode) {
            window.location.href = `/?code=${encodeURIComponent(pendingCode)}&platform=${encodeURIComponent(pendingPlatform)}`
          } else {
            window.location.href = '/'
          }
        }, 500)
      }
      else {
        if (result.errorType === 'rate_limit') {
          error.value = result.error || '请求过于频繁，请稍后重试'
          if (result.remainingMs) {
            rateLimitRemaining.value = Math.ceil(result.remainingMs / 1000)
          }
        } else if (result.errorType === 'locked') {
          error.value = result.error || '账户已被锁定'
          if (result.remainingMs) {
            lockoutRemaining.value = Math.ceil(result.remainingMs / 1000 / 60)
          }
        } else {
          error.value = result.error || '登录失败'
        }
      }
    }
    else {
      const result = await userStore.register(username.value, password.value, cardCode.value)
      if (result.ok) {
        success.value = '注册成功，请登录'
        isLogin.value = true
        cardCode.value = ''
        password.value = ''
      }
      else {
        error.value = result.error || '注册失败'
      }
    }
  }
  catch (e: any) {
    const data = e.response?.data
    if (data?.errorType === 'rate_limit') {
      error.value = data.error || '请求过于频繁'
      if (data.remainingMs) {
        rateLimitRemaining.value = Math.ceil(data.remainingMs / 1000)
      }
    } else if (data?.errorType === 'locked') {
      error.value = data.error || '账户已被锁定'
      if (data.remainingMs) {
        lockoutRemaining.value = Math.ceil(data.remainingMs / 1000 / 60)
      }
    } else {
      error.value = data?.error || e.message || '操作异常'
    }
  }
  finally {
    loading.value = false
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
  success.value = ''
  showPasswordStrength.value = false
  lockoutRemaining.value = 0
  rateLimitRemaining.value = 0
}

async function checkCardClaimStatus() {
  try {
    const res = await api.get('/api/card-claim/status')
    if (res.data.ok) {
      cardClaimEnabled.value = res.data.enabled === true
    }
  }
  catch (e) {
    console.error('检查卡密领取状态失败:', e)
  }
}

async function claimFreeCard() {
  if (cardClaimLoading.value)
    return
  
  cardClaimLoading.value = true
  error.value = ''
  
  try {
    const res = await api.post('/api/card-claim/claim')
    
    if (res.data.ok) {
      cardCode.value = res.data.cardCode
      claimModalContent.value = {
        success: true,
        title: '领取成功',
        message: `成功领取 ${res.data.days} 天卡密！`,
        cardCode: res.data.cardCode,
        days: res.data.days
      }
      showClaimModal.value = true
    }
    else {
      claimModalContent.value = {
        success: false,
        title: '领取失败',
        message: res.data.error || '领取失败，请稍后重试',
        cardCode: '',
        days: 0
      }
      showClaimModal.value = true
    }
  }
  catch (e: any) {
    const data = e.response?.data
    claimModalContent.value = {
      success: false,
      title: '领取失败',
      message: data?.error || e.message || '领取失败',
      cardCode: '',
      days: 0
    }
    showClaimModal.value = true
  }
  finally {
    cardClaimLoading.value = false
  }
}

function closeClaimModal() {
  showClaimModal.value = false
}

onMounted(() => {
  checkCardClaimStatus()
})
</script>

<template>
  <div class="login-container">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.12)_0%,transparent_50%)] pointer-events-none" />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.08)_0%,transparent_50%)] pointer-events-none" />

    <div class="my-auto max-w-sm w-full mx-auto space-y-6 z-10 px-4">
      <!-- Logo 区域 -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 shadow-lg shadow-yellow-500/20 mx-auto transition-transform hover:scale-105">
          <div class="i-carbon-crop-growth text-slate-950 text-3xl font-bold" />
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
          QQ农场智能托管平台
        </h1>
        <p class="text-[10px] tracking-wider text-amber-400 uppercase font-extrabold">
          FarmPilot Pro 智能托管
        </p>
        <p class="text-xs font-semibold text-emerald-300/95 drop-shadow-sm">
          「 让农场自动运转，收益悄然生长 」
        </p>
      </div>

      <!-- 表单卡片区域 -->
      <div class="glass-panel p-6 rounded-2xl space-y-4">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300 pl-1 flex items-center gap-1.5">
              <div class="i-carbon-user text-sm" />
              用户名
            </label>
            <BaseInput
              id="username"
              v-model="username"
              type="text"
              placeholder="请输入用户名 (3-32位)"
              required
            />
            <p v-if="username && !usernameValid.valid" class="text-[10px] text-red-400 pl-1 mt-1">
              {{ usernameValid.message }}
            </p>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-300 pl-1 flex items-center gap-1.5">
              <div class="i-carbon-locked text-sm" />
              密码
            </label>
            <BaseInput
              id="password"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              required
            />
            <div v-if="showPasswordStrength && password" class="flex items-center gap-2 mt-1 px-1">
              <div class="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-300" 
                  :style="{ width: Math.min(passwordStrength.score * 12.5, 100) + '%', backgroundColor: passwordStrength.color }"
                />
              </div>
              <span class="text-[10px] font-semibold" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.level }}
              </span>
            </div>
          </div>

          <div v-if="!isLogin" class="space-y-1">
            <label class="text-xs font-semibold text-slate-300 pl-1 flex items-center gap-1.5">
              <div class="i-carbon-tag text-sm" />
              注册卡密
            </label>
            
            <div v-if="cardClaimEnabled" class="mb-2">
              <button
                type="button"
                class="w-full py-2 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                :disabled="cardClaimLoading"
                @click="claimFreeCard"
              >
                <div v-if="cardClaimLoading" class="i-svg-spinners-90-ring-with-bg text-sm" />
                <div v-else class="flex items-center gap-1">
                  <div class="i-carbon-gift text-sm" />
                  <span>🎁 免费获取试用卡密</span>
                </div>
              </button>
            </div>
            
            <BaseInput
              id="cardCode"
              v-model="cardCode"
              type="text"
              placeholder="请输入注册卡密"
              :required="!isLogin"
            />
          </div>

          <!-- 消息反馈区 -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
            <div class="i-carbon-warning text-sm shrink-0 mt-0.5" />
            <div>
              {{ error }}
              <span v-if="lockoutRemaining > 0" class="block text-[10px] mt-0.5 opacity-80">
                ({{ lockoutRemaining }} 分钟后解锁)
              </span>
              <span v-if="rateLimitRemaining > 0" class="block text-[10px] mt-0.5 opacity-80">
                ({{ rateLimitRemaining }} 秒后可重试)
              </span>
            </div>
          </div>

          <div v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2">
            <div class="i-carbon-checkmark-outline text-sm shrink-0 mt-0.5" />
            <div>{{ success }}</div>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            block
            :loading="loading"
            class="w-full mt-2 font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            <span v-if="!loading" class="flex items-center justify-center gap-1.5">
              <span>{{ isLogin ? '进入控制台' : '注册新账号' }}</span>
              <div class="i-carbon-arrow-right text-sm" />
            </span>
          </BaseButton>
        </form>

        <div class="text-center pt-2">
          <button
            type="button"
            class="text-xs font-semibold text-emerald-400/95 hover:text-emerald-300 underline underline-offset-4 transition-colors bg-transparent border-none cursor-pointer"
            @click="toggleMode"
          >
            {{ isLogin ? '🌱 没有账号？一键注册' : '🌿 已有账号？返回登录' }}
          </button>
        </div>
      </div>

      <!-- 底部版权与版本信息 -->
      <div class="text-center space-y-1.5 pt-4 text-[10px] font-mono">
        <div class="text-slate-400/70 tracking-wider">
          FarmPilot Engine &copy; 2026 Core Tech.
        </div>
      </div>
    </div>

    <!-- 卡密领取结果弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showClaimModal"
          class="claim-modal-overlay"
          @click.self="closeClaimModal"
        >
          <div class="claim-modal">
            <div class="claim-modal-header">
              <span class="claim-modal-icon">{{ claimModalContent.success ? '🎉' : '⚠️' }}</span>
              <h3 class="claim-modal-title">
                {{ claimModalContent.title }}
              </h3>
            </div>
            <div class="claim-modal-body">
              <p class="claim-modal-message">
                {{ claimModalContent.message }}
              </p>
              <div v-if="claimModalContent.success && claimModalContent.cardCode" class="claim-modal-card-info">
                <div class="card-code-label">
                  卡密已自动填入
                </div>
                <div class="card-code-value">
                  {{ claimModalContent.cardCode }}
                </div>
              </div>
            </div>
            <div class="claim-modal-footer">
              <button class="claim-modal-btn" @click="closeClaimModal">
                {{ claimModalContent.success ? '开始注册' : '我知道了' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: var(--theme-bg-image, linear-gradient(rgba(24, 18, 10, 0.02), rgba(24, 18, 10, 0.05)), url('/bg.webp'), linear-gradient(to bottom, #292524, #1c1917));
  background-size: cover;
  position: relative;
  overflow: hidden;
}

.glass-panel {
  background: rgba(30, 41, 59, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

/* Modal styles */
.claim-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.claim-modal {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  color: #f8fafc;
}

.claim-modal-header {
  text-align: center;
  padding: 24px 20px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.claim-modal-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 8px;
}

.claim-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
  margin: 0;
}

.claim-modal-body {
  padding: 20px;
  text-align: center;
}

.claim-modal-message {
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0 0 16px;
  line-height: 1.5;
}

.claim-modal-card-info {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.card-code-label {
  font-size: 0.75rem;
  color: #10b981;
  margin-bottom: 8px;
}

.card-code-value {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-all;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.claim-modal-footer {
  padding: 0 20px 20px;
}

.claim-modal-btn {
  width: 100%;
  padding: 12px;
  background: var(--theme-gradient);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.claim-modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.claim-modal-btn:active {
  transform: translateY(0);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .claim-modal,
.modal-leave-to .claim-modal {
  transform: translateY(-20px) scale(0.95);
}
</style>
