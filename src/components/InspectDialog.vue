<script setup lang="ts">
defineProps<{
  visible: boolean
  payload: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <h3 class="text-sm font-bold text-gray-200">Request Payload</h3>
          <button class="text-gray-500 hover:text-gray-300 text-lg leading-none" @click="emit('close')">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <pre class="text-xs text-gray-300 whitespace-pre-wrap font-mono">{{ payload }}</pre>
        </div>
      </div>
    </div>
  </Teleport>
</template>
