<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  payload: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: string]
}>()

const editText = ref('')
const parseError = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    editText.value = props.payload
    parseError.value = ''
  }
})

function handleConfirm() {
  parseError.value = ''
  try {
    JSON.parse(editText.value)
    emit('confirm', editText.value)
  } catch {
    parseError.value = 'Invalid JSON'
  }
}
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
          <textarea
            v-model="editText"
            class="w-full h-full min-h-[300px] bg-gray-800 text-xs text-gray-300 font-mono border border-gray-700 rounded p-2 resize-none focus:outline-none focus:border-blue-500"
            spellcheck="false"
          />
        </div>
        <div v-if="parseError" class="px-4 pb-2 text-xs text-red-400">{{ parseError }}</div>
        <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 shrink-0">
          <button
            class="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
            @click="emit('close')"
          >Cancel</button>
          <button
            class="px-3 py-1 text-xs bg-blue-700 hover:bg-blue-600 rounded text-blue-100"
            @click="handleConfirm"
          >Confirm</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
