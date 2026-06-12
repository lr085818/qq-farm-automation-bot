import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import api from '@/api'

const THEME_KEY = 'ui_theme'
const USER_THEME_KEY = 'ui_theme_user_selected'
const BG_KEY = 'equipped_farm_bg'
const USER_BG_KEY = 'equipped_farm_bg_user_selected'

export type Theme = 'dark-orange' | 'glass-teal' | 'cyber-purple'

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
  bgImage?: string
  glass?: ThemeGlass
}

const backgroundImages: Record<string, string> = {
  '1': 'radial-gradient(circle at 50% 0%, #1e3a3a 0%, #0f172a 70%)',
  '2': 'linear-gradient(135deg, rgba(41, 34, 24, 0.9) 0%, rgba(28, 25, 23, 0.95) 100%)',
  '3': 'radial-gradient(circle at 50% 0%, #2e1065 0%, #030712 70%)',
}

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(false)
  const validThemes: Theme[] = ['dark-orange', 'glass-teal', 'cyber-purple']
  const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
  const hasUserSelectedTheme = localStorage.getItem(USER_THEME_KEY) === '1'
  const currentTheme = ref<Theme>(hasUserSelectedTheme && savedTheme && validThemes.includes(savedTheme) ? savedTheme : 'dark-orange')

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
      bgImage: 'linear-gradient(rgba(24, 18, 10, 0.02), rgba(24, 18, 10, 0.05)), url("/bg.webp"), linear-gradient(to bottom, #292524, #1c1917)',
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
    // 翡翠绿主题 (Gemini mockup style)
    'glass-teal': {
      name: '翡翠绿',
      isDark: true,
      bg: '#0a1212',
      text: '#e2f3f3',
      primary: '#10B981',
      secondary: '#059669',
      gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      icon: 'i-carbon-flash-filled',
      bgImage: 'radial-gradient(circle at 50% 0%, #1e3a3a 0%, #0f172a 70%)',
      glass: {
        bg: 'rgba(30, 41, 59, 0.55)',
        strong: 'rgba(15, 23, 42, 0.65)',
        dropdown: 'rgba(10, 15, 30, 0.95)',
        soft: 'rgba(16, 185, 129, 0.08)',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '0 24px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        blur: '20px',
        saturate: '190%',
        brightness: '1.0',
        text: 'rgba(226, 243, 243, 0.95)',
        mutedText: 'rgba(203, 229, 229, 0.8)',
        subtleText: 'rgba(150, 200, 200, 0.6)',
        overlayStart: 'rgba(10, 20, 20, 0.02)',
        overlayEnd: 'rgba(10, 20, 20, 0.05)',
      },
    },
    // 幻境紫主题 (Cyberpunk purple style)
    'cyber-purple': {
      name: '幻境紫',
      isDark: true,
      bg: '#0c0714',
      text: '#f3e8ff',
      primary: '#a855f7',
      secondary: '#7e22ce',
      gradient: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)',
      icon: 'i-carbon-moon',
      bgImage: 'radial-gradient(circle at 50% 0%, #2e1065 0%, #030712 70%)',
      glass: {
        bg: 'rgba(24, 18, 41, 0.50)',
        strong: 'rgba(15, 10, 28, 0.70)',
        dropdown: 'rgba(12, 8, 20, 0.95)',
        soft: 'rgba(168, 85, 247, 0.08)',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '0 24px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        blur: '20px',
        saturate: '180%',
        brightness: '1.0',
        text: 'rgba(243, 232, 255, 0.95)',
        mutedText: 'rgba(216, 180, 254, 0.8)',
        subtleText: 'rgba(192, 132, 252, 0.6)',
        overlayStart: 'rgba(20, 10, 30, 0.02)',
        overlayEnd: 'rgba(20, 10, 30, 0.05)',
      },
    },
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

    try {
      const res = await api.get('/api/settings')
      if (res.data.ok && res.data.data.ui?.theme) {
        // Option to sync with server theme settings
      }
    }
    catch {
      // Ignore
    }
  }

  function applyTheme(theme: Theme, persist = false) {
    if (!themes[theme]) {
      theme = 'dark-orange'
    }

    const t = themes[theme]
    currentTheme.value = theme
    if (persist) {
      localStorage.setItem(THEME_KEY, theme)
      localStorage.setItem(USER_THEME_KEY, '1')
    }

    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--theme-bg', t.bg)
      document.documentElement.style.setProperty('--theme-text', t.text)
      document.documentElement.style.setProperty('--theme-primary', t.primary)
      document.documentElement.style.setProperty('--theme-secondary', t.secondary)
      document.documentElement.style.setProperty('--theme-gradient', t.gradient)

      const selectedBg = localStorage.getItem(BG_KEY) || ''
      const hasUserSelectedBg = localStorage.getItem(USER_BG_KEY) === '1'
      const bgImage = hasUserSelectedBg && backgroundImages[selectedBg]
        ? backgroundImages[selectedBg]
        : t.bgImage

      if (bgImage) {
        document.documentElement.style.setProperty('--theme-bg-image', bgImage)
      }
      else {
        document.documentElement.style.removeProperty('--theme-bg-image')
      }

      if (t.isDark) {
        document.documentElement.classList.add('dark')
      }
      else {
        document.documentElement.classList.remove('dark')
      }

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

  function toggleDark() {
    applyTheme('glass-teal', true)
  }

  const isDark = computed(() => themes[currentTheme.value]?.isDark ?? false)

  watch(currentTheme, (val) => {
    applyTheme(val)
  })

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
