<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{
  label?: string
  options?: { label: string, value: string | number, disabled?: boolean }[]
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'change', value: string | number): void
}>()

const model = defineModel<string | number>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  const selected = props.options?.find(opt => opt.value === model.value)
  return selected ? selected.label : (props.placeholder || '请选择')
})

function toggleDropdown() {
  if (props.disabled)
    return
  isOpen.value = !isOpen.value
}

function selectOption(value: string | number) {
  model.value = value
  isOpen.value = false
  emit('change', value)
}

function closeDropdown(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div ref="containerRef" class="relative flex flex-col gap-1.5" :class="{ 'z-[1000]': isOpen }">
    <label v-if="label" class="text-sm text-gray-700 font-medium dark:text-gray-300">
      {{ label }}
    </label>
    <div class="relative">
      <!-- Trigger -->
      <div
        class="w-full flex cursor-pointer items-center justify-between border border-gray-200 rounded-lg bg-white px-3 py-2 outline-none transition-all duration-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        :class="{
          'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800/50': disabled,
          'ring-2 ring-green-500/20 border-green-500 dark:focus:border-green-500': isOpen,
          'focus:border-green-500 focus:ring-2 focus:ring-green-500/20': !disabled,
        }"
        @click="toggleDropdown"
      >
        <span class="truncate">{{ selectedLabel }}</span>
        <div class="i-carbon-chevron-down text-lg text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
      </div>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          class="base-select-dropdown absolute left-0 right-0 top-full z-[1001] mt-2 max-h-60 overflow-auto border rounded-xl py-1 shadow-2xl"
        >
          <template v-if="options?.length">
            <div
              v-for="opt in options"
              :key="opt.value"
              class="cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
              :class="{
                'bg-green-50/50 text-green-600 dark:bg-green-900/20 dark:text-green-400': model === opt.value,
                'text-gray-400 cursor-not-allowed hover:bg-transparent dark:text-gray-500': opt.disabled,
                'text-gray-700 dark:text-gray-200': model !== opt.value && !opt.disabled,
              }"
              @click="!opt.disabled && selectOption(opt.value)"
            >
              <slot name="option" :option="opt" :selected="model === opt.value">
                {{ opt.label }}
              </slot>
            </div>
          </template>
          <div v-else class="px-3 py-2 text-center text-sm text-gray-400">
            暂无选项
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
<style scoped>
.base-select-dropdown {
  background-color: #120c05 !important;
  border-color: rgba(251, 191, 36, 0.34) !important;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.62), 0 8px 24px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 244, 190, 0.10) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

:global(html:not(.dark)) .base-select-dropdown {
  background-color: #ffffff !important;
  border-color: rgba(209, 213, 219, 0.96) !important;
  box-shadow: 0 20px 52px rgba(15, 23, 42, 0.24), 0 8px 18px rgba(15, 23, 42, 0.16) !important;
}
</style>
