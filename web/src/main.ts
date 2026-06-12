import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { useAppStore } from '@/stores/app'
import { useToastStore } from '@/stores/toast'
import App from './App.vue'
import router from './router'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Apply theme immediately before app mounts
const THEME_KEY = 'ui_theme'
const USER_THEME_KEY = 'ui_theme_user_selected'
const savedTheme = localStorage.getItem(USER_THEME_KEY) === '1'
  ? (localStorage.getItem(THEME_KEY) || 'dark-orange')
  : 'dark-orange'
const themes: Record<string, { isDark: boolean, bg: string, text: string, primary: string, secondary: string, gradient: string }> = {
  'dark-orange': { isDark: true, bg: '#292524', text: '#fef3c7', primary: '#f59e0b', secondary: '#d97706', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
}

const theme = themes[savedTheme] || themes['dark-orange']
if (theme) {
  document.documentElement.style.setProperty('--theme-bg', theme.bg)
  document.documentElement.style.setProperty('--theme-text', theme.text)
  document.documentElement.style.setProperty('--theme-primary', theme.primary)
  document.documentElement.style.setProperty('--theme-secondary', theme.secondary)
  document.documentElement.style.setProperty('--theme-gradient', theme.gradient)
  document.documentElement.style.setProperty('--glass-bg', 'rgba(41, 34, 24, 0.18)')
  document.documentElement.style.setProperty('--glass-bg-strong', 'rgba(41, 31, 18, 0.24)')
  document.documentElement.style.setProperty('--glass-bg-dropdown', 'rgba(30, 22, 10, 0.90)')
  document.documentElement.style.setProperty('--glass-bg-soft', 'rgba(251, 191, 36, 0.08)')
  document.documentElement.style.setProperty('--glass-border', 'rgba(251, 191, 36, 0.18)')
  document.documentElement.style.setProperty('--glass-shadow', '0 24px 60px rgba(245, 158, 11, 0.2)')
  document.documentElement.style.setProperty('--glass-blur', '30px')
  document.documentElement.style.setProperty('--glass-saturate', '190%')
  document.documentElement.style.setProperty('--glass-brightness', '1.14')
  document.documentElement.style.setProperty('--glass-text', 'rgba(255, 247, 214, 0.96)')
  document.documentElement.style.setProperty('--glass-muted-text', 'rgba(254, 243, 199, 0.84)')
  document.documentElement.style.setProperty('--glass-subtle-text', 'rgba(253, 230, 138, 0.74)')
  document.documentElement.style.setProperty('--bg-overlay-start', 'rgba(24, 18, 10, 0.02)')
  document.documentElement.style.setProperty('--bg-overlay-end', 'rgba(24, 18, 10, 0.05)')
  if (theme.isDark) {
    document.documentElement.classList.add('dark')
  }
  else {
    document.documentElement.classList.remove('dark')
  }
}

// Global Error Handling
const toast = useToastStore()

app.config.errorHandler = (err: any, _instance, info) => {
  console.error('全局 Vue 错误:', err, info)
  const message = err.message || String(err)
  if (message.includes('ResizeObserver loop'))
    return
  toast.error(`应用错误: ${message}`)
}

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  if (reason && typeof reason === 'object' && 'isAxiosError' in reason)
    return

  console.error('Unhandled Rejection:', reason)
  const message = reason?.message || String(reason)
  toast.error(`异步错误: ${message}`)
})

window.onerror = (message, _source, _lineno, _colno, error) => {
  console.error('Global Error:', message, error)
  if (String(message).includes('Script error'))
    return
  toast.error(`系统错误: ${message}`)
}

// Apply theme from localStorage immediately, then sync from server if authed
const appStore = useAppStore()
appStore.fetchTheme()

app.mount('#app')
