<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
  defaultOpen?: boolean
  borderless?: boolean
}>()

const open = ref(true)

const headerClass = computed(() => {
  if (props.borderless) {
    return open.value
      ? 'border border-gray-700 rounded-t-lg border-b-0 border-t-0'
      : 'border border-gray-700 rounded-lg border-t-0'
  }
  return open.value
    ? 'border border-gray-700 rounded-t-lg border-b-0'
    : 'border border-gray-700 rounded-lg'
})
</script>

<template>
  <div>
    <div
      :class="['sticky top-0 z-20 flex items-center gap-2 py-2 px-3 cursor-pointer select-none', headerClass]"
      @click="open = !open"
    >
      <span class="text-xs text-gray-500 transition-transform duration-200" :class="open ? 'rotate-0' : '-rotate-90'">▼</span>
      <h2 class="text-sm font-bold text-gray-300">{{ title }}</h2>
      <div class="ml-auto" @click.stop>
        <slot name="actions" />
      </div>
    </div>
    <Transition name="collapse">
      <div v-if="open" class="border border-gray-700 rounded-b-lg border-t-0 px-3 py-3">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-enter-active {
  transition: opacity 0.2s ease;
}
.collapse-leave-active {
  transition: opacity 0.15s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

.sticky {
  will-change: transform;
  background: rgb(3 7 18);
}
</style>
