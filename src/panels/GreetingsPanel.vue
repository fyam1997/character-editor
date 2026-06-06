<script setup lang="ts">
import { watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'
import MarkdownField from '../components/MarkdownField.vue'

const emit = defineEmits<{
  startChat: [greeting: string]
}>()

const store = useEditorStore()

watch(() => store.cardJson, (json) => {
  if (!json) return
  const f = json.data.first_mes
  const g = json.data.alternate_greetings
  if (f && g.length === 0) {
    g.push(f)
  }
}, { immediate: true })

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
}

function removeGreeting(index: number) {
  if (!store.cardJson || store.cardJson.data.alternate_greetings.length <= 1) return
  store.cardJson.data.alternate_greetings.splice(index, 1)
  if (index === 0) {
    store.cardJson.data.first_mes = store.cardJson.data.alternate_greetings[0] ?? ''
  }
}
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
      v-for="(greeting, index) in store.cardJson?.data.alternate_greetings ?? []"
      :key="index"
      class="mb-2 border border-gray-700 rounded p-2"
    >
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs text-gray-500">Greeting {{ index + 1 }}</span>
        <div class="flex gap-1">
          <button
            class="px-2 py-0.5 text-xs bg-green-800 hover:bg-green-700 rounded text-green-200"
            @click="emit('startChat', greeting)"
          >
            ▶ Start Chat
          </button>
          <button
            class="px-2 py-0.5 text-xs bg-gray-700 rounded disabled:opacity-30"
            :class="(store.cardJson?.data.alternate_greetings.length ?? 0) > 1 ? 'hover:bg-red-800' : ''"
            :disabled="(store.cardJson?.data.alternate_greetings.length ?? 0) <= 1"
            @click="removeGreeting(index)"
          >
            ✕
          </button>
        </div>
      </div>
      <MarkdownField :model-value="greeting" @update:model-value="(v: string) => updateGreeting(index, v)" />
    </div>
  </CollapsibleSection>
</template>
