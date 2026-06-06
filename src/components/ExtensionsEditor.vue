<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()

const keys = ref<string[]>([])

function refreshKeys() {
  keys.value = Object.keys(store.cardJson?.data.extensions ?? {})
}

function setExtValue(key: string, raw: string) {
  if (!store.cardJson) return
  try {
    store.cardJson.data.extensions[key] = JSON.parse(raw)
  } catch {
    store.cardJson.data.extensions[key] = raw
  }
}

function getExtValue(key: string): string {
  const v = store.cardJson?.data.extensions[key]
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  return JSON.stringify(v, null, 2)
}

function addKey() {
  const k = prompt('Extension key:')
  if (k && store.cardJson) {
    store.cardJson.data.extensions[k] = ''
    refreshKeys()
  }
}

function removeKey(key: string) {
  if (store.cardJson) {
    delete store.cardJson.data.extensions[key]
    refreshKeys()
  }
}

refreshKeys()
</script>

<template>
  <div v-if="store.cardJson">
    <div class="flex items-center gap-2 mb-1">
      <label class="text-xs text-gray-400">Extensions</label>
      <button
        class="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="addKey"
      >
        + Add Key
      </button>
    </div>
    <div v-if="keys.length === 0" class="text-xs text-gray-600 py-2">
      No extensions
    </div>
    <div v-for="key in keys" :key="key" class="mb-2">
      <div class="flex items-center gap-1 mb-0.5">
        <span class="text-xs text-gray-400 font-mono">{{ key }}</span>
        <button
          class="text-xs text-gray-600 hover:text-red-400"
          @click="removeKey(key)"
        >
          ✕
        </button>
      </div>
      <textarea
        :value="getExtValue(key)"
        @input="(e: any) => setExtValue(key, e.target.value)"
        rows="2"
        class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"
      ></textarea>
    </div>
  </div>
</template>
