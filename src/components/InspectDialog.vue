<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  payload: string
}>()

const emit = defineEmits<{
  close: []
}>()

const preEl = ref<HTMLElement | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('close')
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && props.visible && preEl.value) {
    e.preventDefault()
    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.selectNodeContents(preEl.value)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none"
      @click.self="emit('close')"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col select-text">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <h3 class="text-sm font-bold text-gray-200">Request Payload</h3>
          <button class="text-gray-500 hover:text-gray-300 text-lg leading-none" @click="emit('close')">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <pre ref="preEl" class="text-xs text-gray-300 whitespace-pre-wrap font-mono">{{ payload }}</pre>
        </div>
      </div>
    </div>
  </Teleport>
</template>
