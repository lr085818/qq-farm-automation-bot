<script setup lang="ts">
import type { Theme } from '@/stores/app'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import { useAppStore } from '@/stores/app'

import { onMounted } from 'vue'

const appStore = useAppStore()

// 立即应用保存的主题（在组件挂载前）
const savedTheme = localStorage.getItem('ui_theme') as Theme
const hasUserSelectedTheme = localStorage.getItem('ui_theme_user_selected') === '1'
if (hasUserSelectedTheme && savedTheme && appStore.themes[savedTheme]) {
  appStore.applyTheme(savedTheme)
}

onMounted(() => {
  const themeFallbackBg: Record<Theme, string> = {
    'dark-orange': '2',
    'glass-teal': '1',
    'cyber-purple': '3',
  }
  const fallbackBg = themeFallbackBg[appStore.currentTheme] || '2'
  const hasUserSelectedBg = localStorage.getItem('equipped_farm_bg_user_selected') === '1'
  const selectedBg = localStorage.getItem('equipped_farm_bg') || fallbackBg
  const bgMap: Record<string, string> = {
    '1': 'radial-gradient(circle at 50% 0%, #1e3a3a 0%, #0f172a 70%)',
    '2': 'linear-gradient(rgba(24, 18, 10, 0.02), rgba(24, 18, 10, 0.05)), url("/bg.webp"), linear-gradient(to bottom, #292524, #1c1917)',
    '3': 'radial-gradient(circle at 50% 0%, #2e1065 0%, #030712 70%)'
  }
  const gradient = hasUserSelectedBg
    ? (bgMap[selectedBg] ?? bgMap[fallbackBg] ?? bgMap['2'] ?? '')
    : (appStore.themes[appStore.currentTheme]?.bgImage ?? bgMap[fallbackBg] ?? bgMap['2'] ?? '')
  document.documentElement.style.setProperty('--theme-bg-image', gradient)
})
</script>

<template>
  <div class="app-bg-root h-screen w-screen overflow-hidden relative" :style="{ color: 'var(--theme-text)' }">
    <!-- Ambient background glows -->
    <div class="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--theme-primary)] opacity-[0.06] blur-[150px] pointer-events-none animate-pulse-slow z-0" />
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--theme-primary)] opacity-[0.03] blur-[120px] pointer-events-none animate-pulse-slow-reverse z-0" />

    <div class="relative z-10 h-full w-full">
      <RouterView />
    </div>
    <ToastContainer />
  </div>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: 'Maple Mono NF CN', 'Maple Mono NF', 'Maple Mono', monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Color theme variables */
:root {
  --theme-bg: #292524;
  --theme-text: #fef3c7;
  --theme-primary: #f59e0b;
  --theme-secondary: #d97706;
  --theme-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  /* Glassmorphism defaults (warm orange theme) */
  --glass-bg: rgba(41, 34, 24, 0.18);
  --glass-bg-strong: rgba(41, 31, 18, 0.24);
  --glass-bg-dropdown: rgba(30, 22, 10, 0.90);
  --glass-bg-soft: rgba(251, 191, 36, 0.08);
  --glass-border: rgba(251, 191, 36, 0.18);
  --glass-shadow: 0 24px 60px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 248, 200, 0.12);
  --glass-blur: 30px;
  --glass-saturate: 190%;
  --glass-brightness: 1.14;
  --glass-text: rgba(255, 247, 214, 0.96);
  --glass-muted-text: rgba(254, 243, 199, 0.84);
  --glass-subtle-text: rgba(253, 230, 138, 0.74);
  --bg-overlay-start: rgba(24, 18, 10, 0.02);
  --bg-overlay-end: rgba(24, 18, 10, 0.05);
}

/* ── Background image ─────────────────────────────────── */
.app-bg-root {
  background-color: var(--theme-bg);
  background-image: var(--theme-bg-image, linear-gradient(var(--bg-overlay-start), var(--bg-overlay-end)), url('/bg.webp'));
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* ── Glassmorphism card overrides ─────────────────────── */
.bg-white {
  background-color: var(--glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness)) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness)) !important;
  border-color: var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
}

.dark .bg-gray-800,
.dark .bg-gray-900 {
  background-color: var(--glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness)) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness)) !important;
  border-color: var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
}

.bg-gray-50 {
  background-color: var(--glass-bg-soft) !important;
}

.dark .bg-gray-50 {
  background-color: var(--glass-bg-soft) !important;
}

.dark .bg-gray-700 {
  background-color: rgba(30, 41, 59, 0.18) !important;
}

/* Dark mode button overrides */
.dark {
  --theme-button-sec-bg: linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(30, 41, 59, 0.5) 100%) !important;
  --theme-button-sec-text: var(--glass-text) !important;
  --theme-button-sec-text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4) !important;
}

/* Dropdowns — bg-white/95 and dark:bg-gray-900/95 both get solid dropdown background */
.\!bg-white,
.bg-white\/95,
.dark .bg-gray-900\/95 {
  background-color: var(--glass-bg-dropdown) !important;
  backdrop-filter: blur(20px) saturate(var(--glass-saturate)) !important;
  -webkit-backdrop-filter: blur(20px) saturate(var(--glass-saturate)) !important;
  border-color: var(--glass-border) !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.48), 0 2px 8px rgba(0, 0, 0, 0.24) !important;
}

.text-gray-700,
.text-gray-800,
.text-gray-900,
.dark .text-gray-100,
.dark .text-gray-200 {
  color: var(--glass-text) !important;
}

.text-gray-500,
.text-gray-600,
.dark .text-gray-300,
.dark .text-gray-400 {
  color: var(--glass-muted-text) !important;
}

.text-gray-400,
.dark .text-gray-500 {
  color: var(--glass-subtle-text) !important;
}

.app-bg-root,
.app-bg-root input,
.app-bg-root button,
.app-bg-root select,
.app-bg-root textarea {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Use CSS variables for theme colors */
.btn-primary {
  background: var(--theme-gradient);
  border-color: var(--theme-primary);
}

.btn-primary:hover {
  background: var(--theme-secondary);
}

.text-primary {
  color: var(--theme-primary);
}

.bg-primary {
  background-color: var(--theme-primary);
}

.border-primary {
  border-color: var(--theme-primary);
}

.bg-gradient-primary {
  background: var(--theme-gradient);
}

/* @supports fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .bg-white,
  .dark .bg-gray-800,
  .dark .bg-gray-900 {
    background-color: rgba(20, 15, 8, 0.90) !important;
  }

  .\!bg-white,
  .bg-white\/95,
  .dark .bg-gray-900\/95 {
    background-color: rgba(15, 10, 4, 0.96) !important;
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--theme-primary);
  border-radius: 4px;
  opacity: 0.5;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--theme-secondary);
  opacity: 0.8;
}

/* ── Ambient Glow Animations ────────────────────────── */
@keyframes pulse-slow {
  0%, 100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.05;
  }
  50% {
    transform: scale(1.1) translate(2%, 4%);
    opacity: 0.08;
  }
}

@keyframes pulse-slow-reverse {
  0%, 100% {
    transform: scale(1.1) translate(0, 0);
    opacity: 0.03;
  }
  50% {
    transform: scale(1) translate(-2%, -4%);
    opacity: 0.05;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 20s ease-in-out infinite;
}

.animate-pulse-slow-reverse {
  animation: pulse-slow-reverse 25s ease-in-out infinite;
}
</style>
