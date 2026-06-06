<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'
import MarkdownField from '../components/MarkdownField.vue'
import { useSortable } from '../utils/useSortable'

const emit = defineEmits<{
  startChat: [greeting: string]
}>()

const store = useEditorStore()
const greetingListRef = ref<HTMLElement | null>(null)

const greetingKeys = ref<number[]>([])
let nextKey = 0

watch(() => store.cardJson, (json) => {
  if (!json) return
  const f = json.data.first_mes
  const g = json.data.alternate_greetings
  if (f && g.length === 0) {
    g.push(f)
  }
  syncKeys()
}, { immediate: true })

function syncKeys() {
  const len = store.cardJson?.data.alternate_greetings.length ?? 0
  while (greetingKeys.value.length < len) {
    greetingKeys.value.push(nextKey++)
  }
  if (greetingKeys.value.length > len) {
    greetingKeys.value.length = len
  }
}

function reorderGreetings(oldIndex: number, newIndex: number) {
  if (!store.cardJson) return
  const arr = store.cardJson.data.alternate_greetings
  const item = arr.splice(oldIndex, 1)[0]
  arr.splice(newIndex, 0, item)
  const key = greetingKeys.value.splice(oldIndex, 1)[0]
  greetingKeys.value.splice(newIndex, 0, key)
  store.cardJson.data.first_mes = arr[0] ?? ''
}

function updateGreeting(index: number, value: string) {
  if (!store.cardJson) return
  store.cardJson.data.alternate_greetings[index] = value
  if (index === 0) {
    store.cardJson.data.first_mes = value
  }
}

function addGreeting() {
  if (!store.cardJson) return
  store.cardJson.data.alternate_greetings.push('')
  greetingKeys.value.push(nextKey++)
}

function removeGreeting(index: number) {
  if (!store.cardJson || store.cardJson.data.alternate_greetings.length <= 1) return
  store.cardJson.data.alternate_greetings.splice(index, 1)
  greetingKeys.value.splice(index, 1)
  if (index === 0) {
    store.cardJson.data.first_mes = store.cardJson.data.alternate_greetings[0] ?? ''
  }
}

useSortable(greetingListRef, reorderGreetings, { handle: '.drag-handle' })
</script>

<template>
  <CollapsibleSection title="Greetings">
    <template #actions>
      <button
        class="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="addGreeting"
      >
        + Add Greeting
      </button>
    </template>
    <div v-if="!store.cardJson || store.cardJson.data.alternate_greetings.length === 0" class="text-xs text-gray-600 py-2">
      No greetings yet.
    </div>
    <div
      ref="greetingListRef"
      class="space-y-2"
    >
      <div
        v-for="(greeting, index) in store.cardJson?.data.alternate_greetings ?? []"
        :key="greetingKeys[index]"
        class="border border-gray-700 rounded p-2"
      >
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1">
            <span class="drag-handle cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 select-none">⠿</span>
            <span class="text-xs text-gray-500">Greeting {{ index + 1 }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-0.5 text-xs rounded text-green-200"
              :class="greeting.trim() ? 'bg-green-800 hover:bg-green-700' : 'bg-green-900 opacity-50 cursor-default'"
              :disabled="!greeting.trim()"
              @click="emit('startChat', greeting)"
            >
              ▶ Start Chat
            </button>
            <button
              class="text-xs text-gray-500 hover:text-red-400 disabled:opacity-0"
              :disabled="(store.cardJson?.data.alternate_greetings.length ?? 0) <= 1"
              @click="removeGreeting(index)"
            >✕</button>
          </div>
        </div>
        <MarkdownField :model-value="greeting" @update:model-value="(v: string) => updateGreeting(index, v)" />
      </div>
    </div>
  </CollapsibleSection>
</template>
