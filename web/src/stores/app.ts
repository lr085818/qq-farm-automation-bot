import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import api from '@/api'

const THEME_KEY = 'ui_theme'

export type Theme = 'dark-orange'

interface ThemeGlass {
  bg: string
  strong: string
  dropdown: string
  soft: string
  border: string
  shadow: string
  blur: string
  saturate: string
  brightness: string
  text: string
  mutedText: string
  subtleText: string
  overlayStart: string
  overlayEnd: string
}

interface ThemePalette {
  name: string
  isDark: boolean
  bg: string
  text: string
  primary: string
  secondary: string
  gradient: string
  icon: string
  glass?: ThemeGlass
}

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(false)
  const currentTheme = ref<Theme>('dark-orange')

  const themes: Record<Theme, ThemePalette> = {
    // 橙色暖阳主题
    'dark-orange': {
      name: '暖阳橙',
      isDark: true,
      bg: '#292524',
      text: '#fef3c7',
      primary: '#f59e0b',
      secondary: '#d97706',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      icon: 'i-carbon-sun',
      glass: {
        bg: 'rgba(41, 34, 24, 0.18)',
        strong: 'rgba(41, 31, 18, 0.24)',
        dropdown: 'rgba(30, 22, 10, 0.90)',
        soft: 'rgba(251, 191, 36, 0.08)',
        border: 'rgba(251, 191, 36, 0.18)',
        shadow: '0 24px 60px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 248, 200, 0.12)',
        blur: '30px',
        saturate: '190%',
        brightness: '1.14',
        text: 'rgba(255, 247, 214, 0.96)',
        mutedText: 'rgba(254, 243, 199, 0.84)',
        subtleText: 'rgba(253, 230, 138, 0.74)',
        overlayStart: 'rgba(24, 18, 10, 0.02)',
        overlayEnd: 'rgba(24, 18, 10, 0.05)',
      },
    },
  }

  const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
  if (savedTheme !== 'dark-orange') {
    localStorage.setItem(THEME_KEY, 'dark-orange')
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  function openSidebar() {
    sidebarOpen.value = true
  }

  async function fetchTheme() {
    const token = String(localStorage.getItem('admin_token') || '').trim()
    if (!token)
      return

    // 从服务器获取主题设置（可选）
    try {
      const res = await api.get('/api/settings')
      if (res.data.ok && res.data.data.ui?.theme) {
        // 如果服务器有主题设置，可以选择使用
        // 但优先使用本地存储的主题
      }
    }
    catch {
      // 未登录时静默失败，使用本地缓存值
    }
  }

  function applyTheme(theme: Theme) {
    // Validate theme
    if (!themes[theme]) {
      theme = 'dark-orange'
    }

    const t = themes[theme]
    currentTheme.value = theme
    localStorage.setItem(THEME_KEY, theme)

    // Apply theme colors to CSS variables
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--theme-bg', t.bg)
      document.documentElement.style.setProperty('--theme-text', t.text)
      document.documentElement.style.setProperty('--theme-primary', t.primary)
      document.documentElement.style.setProperty('--theme-secondary', t.secondary)
      document.documentElement.style.setProperty('--theme-gradient', t.gradient)

      // Toggle dark class
      if (t.isDark) {
        document.documentElement.classList.add('dark')
      }
      else {
        document.documentElement.classList.remove('dark')
      }

      // Glassmorphism CSS variables — adapt to theme palette
      if (t.glass) {
        document.documentElement.style.setProperty('--glass-bg', t.glass.bg)
        document.documentElement.style.setProperty('--glass-bg-strong', t.glass.strong)
        document.documentElement.style.setProperty('--glass-bg-dropdown', t.glass.dropdown)
        document.documentElement.style.setProperty('--glass-bg-soft', t.glass.soft)
        document.documentElement.style.setProperty('--glass-border', t.glass.border)
        document.documentElement.style.setProperty('--glass-shadow', t.glass.shadow)
        document.documentElement.style.setProperty('--glass-blur', t.glass.blur)
        document.documentElement.style.setProperty('--glass-saturate', t.glass.saturate)
        document.documentElement.style.setProperty('--glass-brightness', t.glass.brightness)
        document.documentElement.style.setProperty('--glass-text', t.glass.text)
        document.documentElement.style.setProperty('--glass-muted-text', t.glass.mutedText)
        document.documentElement.style.setProperty('--glass-subtle-text', t.glass.subtleText)
        document.documentElement.style.setProperty('--bg-overlay-start', t.glass.overlayStart)
        document.documentElement.style.setProperty('--bg-overlay-end', t.glass.overlayEnd)
      }
    }
  }

  // Legacy toggleDark for backward compatibility
  function toggleDark() {
    applyTheme('dark-orange')
  }

  // Computed isDark based on currentTheme
  const isDark = computed(() => themes[currentTheme.value]?.isDark ?? false)

  // Watch theme changes and apply
  watch(currentTheme, (val) => {
    applyTheme(val)
  })

  // Initialize theme immediately (not in onMounted)
  applyTheme(currentTheme.value)

  return {
    sidebarOpen,
    isDark,
    currentTheme,
    themes,
    applyTheme,
    toggleDark,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    fetchTheme,
  }
})
