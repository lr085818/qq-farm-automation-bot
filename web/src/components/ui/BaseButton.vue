<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'text'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const componentTag = computed(() => {
  if (props.to)
    return RouterLink
  if (props.href)
    return 'a'
  return 'button'
})

const baseClasses = 'base-button inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'base-button--primary text-white focus:ring-amber-500'
    case 'secondary':
      return 'base-button--secondary focus:ring-gray-500'
    case 'success':
      return 'base-button--success text-white focus:ring-green-500'
    case 'danger':
      return 'base-button--danger text-white focus:ring-red-500'
    case 'ghost':
      return 'base-button--ghost text-gray-600 dark:text-gray-400'
    case 'outline':
      return 'base-button--outline text-gray-700 focus:ring-gray-500 dark:text-gray-300'
    case 'text':
      return 'base-button--text hover:underline p-0 bg-transparent shadow-none hover:bg-transparent'
    default:
      return 'base-button--primary text-white focus:ring-amber-500'
  }
})

const sizeClasses = computed(() => {
  if (props.variant === 'text')
    return ''

  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm'
    case 'lg':
      return 'px-6 py-3 text-lg'
    default:
      return 'px-4 py-2 text-sm'
  }
})

const widthClasses = computed(() => props.block ? 'w-full' : '')

const buttonStyle = computed(() => {
  if (props.variant === 'text') {
    return { color: 'var(--theme-primary)' }
  }
  return {}
})
</script>

<template>
  <component
    :is="componentTag"
    :to="to"
    :href="href"
    :type="!to && !href ? (type || 'button') : undefined"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, widthClasses]"
    :style="buttonStyle"
    v-bind="$attrs"
    @click="!disabled && !loading && emit('click', $event)"
  >
    <div v-if="loading" class="i-svg-spinners-ring-resize mr-2 animate-spin" />
    <slot />
  </component>
</template>

<style scoped>
.base-button {
  border-radius: var(--theme-radius-lg, 18px);
  border: 3px solid var(--button-border, rgba(255, 255, 255, 0.22));
  border-bottom-color: var(--button-border-bottom, rgba(0, 0, 0, 0.28));
  border-bottom-width: 4px;
  background: var(--button-bg, var(--theme-gradient));
  color: var(--button-text, #fff);
  font-weight: 700;
  line-height: 1.2;
  text-shadow: var(--button-text-shadow, 0 1px 1px rgba(0, 0, 0, 0.18));
  box-shadow:
    0 4px 0 var(--button-shadow-hard, rgba(0, 0, 0, 0.22)),
    0 6px 16px var(--button-shadow-soft, rgba(0, 0, 0, 0.16));
  transform: translateY(0);
  transition:
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.15s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;
}

.base-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 0 var(--button-shadow-hard, rgba(0, 0, 0, 0.22)),
    0 8px 20px var(--button-shadow-soft-hover, rgba(0, 0, 0, 0.2));
}

.base-button:not(:disabled):active {
  transform: translateY(3px);
  border-bottom-width: 3px;
  box-shadow:
    0 1px 0 var(--button-shadow-hard, rgba(0, 0, 0, 0.22)),
    0 1px 4px var(--button-shadow-soft-active, rgba(0, 0, 0, 0.12));
}

.base-button:disabled {
  opacity: 0.62;
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.16),
    0 2px 6px rgba(0, 0, 0, 0.08);
  transform: none;
}

.base-button--primary {
  --button-bg: var(--theme-gradient);
  --button-border: rgba(255, 255, 255, 0.24);
  --button-border-bottom: color-mix(in srgb, var(--theme-primary) 62%, #000 38%);
  --button-shadow-hard: color-mix(in srgb, var(--theme-primary) 58%, #000 42%);
  --button-shadow-soft: color-mix(in srgb, var(--theme-primary) 34%, transparent);
  --button-shadow-soft-hover: color-mix(in srgb, var(--theme-primary) 42%, transparent);
}

.base-button--success {
  --button-bg: linear-gradient(135deg, #6dbf5b 0%, #4a8c3f 100%);
  --button-border: rgba(255, 255, 255, 0.22);
  --button-border-bottom: #3a6b2e;
  --button-shadow-hard: #3a6b2e;
  --button-shadow-soft: rgba(74, 140, 63, 0.30);
  --button-shadow-soft-hover: rgba(74, 140, 63, 0.38);
}

.base-button--danger {
  --button-bg: linear-gradient(135deg, #fb7185 0%, #ef4444 100%);
  --button-border: rgba(255, 255, 255, 0.22);
  --button-border-bottom: #b91c1c;
  --button-shadow-hard: #b91c1c;
  --button-shadow-soft: rgba(239, 68, 68, 0.28);
  --button-shadow-soft-hover: rgba(239, 68, 68, 0.36);
}

.base-button--secondary,
.base-button--outline {
  --button-bg: linear-gradient(135deg, rgba(255, 248, 230, 0.94), rgba(239, 232, 214, 0.86));
  --button-text: #2f3a26;
  --button-text-shadow: 0 1px 0 rgba(255, 255, 255, 0.58);
  --button-border: rgba(255, 255, 255, 0.20);
  --button-border-bottom: rgba(0, 0, 0, 0.24);
  --button-shadow-hard: rgba(0, 0, 0, 0.20);
  --button-shadow-soft: rgba(0, 0, 0, 0.12);
  --button-shadow-soft-hover: rgba(0, 0, 0, 0.16);
}

.base-button--ghost,
.base-button--text {
  border-color: transparent;
  border-bottom-color: transparent;
  border-bottom-width: 3px;
  background: transparent;
  box-shadow: none;
  text-shadow: none;
}

.base-button--ghost:not(:disabled):hover {
  background: color-mix(in srgb, var(--theme-primary) 12%, transparent);
  box-shadow: none;
}

.base-button--text:not(:disabled):hover,
.base-button--text:not(:disabled):active {
  transform: none;
  box-shadow: none;
}
</style>
