<script setup lang="ts">
import type { Theme } from '@/stores/app'
import { RouterView } from 'vue-router'
import ToastContainer from '@/components/ToastContainer.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

// 立即应用保存的主题（在组件挂载前）
const savedTheme = localStorage.getItem('ui_theme') as Theme
if (savedTheme && appStore.themes[savedTheme]) {
  appStore.applyTheme(savedTheme)
}
</script>

<template>
  <div class="app-bg-root h-screen w-screen overflow-hidden" :style="{ color: 'var(--theme-text)' }">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: 'DM Sans', sans-serif;
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
  background-image: linear-gradient(var(--bg-overlay-start), var(--bg-overlay-end)), url('/bg.webp');
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
</style>
