<script setup lang="ts">
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="emit('close')"
  >
    <div class="bg-gray-800 border border-gray-600 rounded-lg p-5 w-96 shadow-xl">
      <h2 class="text-sm font-bold text-gray-200 mb-4">System Config</h2>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-gray-400 block mb-1">API Base URL</label>
          <input
            v-model="store.apiConfig.baseUrl"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">API Key</label>
          <input
            v-model="store.apiConfig.apiKey"
            type="password"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Model</label>
          <input
            v-model="store.apiConfig.model"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button
          class="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white"
          @click="emit('close')"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
