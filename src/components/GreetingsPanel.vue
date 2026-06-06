<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../stores/editor'

const emit = defineEmits<{
  startChat: [greeting: string]
}>()

const store = useEditorStore()

const greetings = computed({
  get: () => store.cardJson?.data.alternate_greetings ?? [],
  set: (val: string[]) => {
    if (store.cardJson) {
      store.cardJson.data.alternate_greetings = val
    }
  },
})

function updateGreeting(index: number, value: string) {
  const g = [...greetings.value]
  g[index] = value
  store.cardJson!.data.alternate_greetings = g
}

function addGreeting() {
  const g = [...greetings.value, '']
  store.cardJson!.data.alternate_greetings = g
}

function removeGreeting(index: number) {
  const g = greetings.value.filter((_, i) => i !== index)
  store.cardJson!.data.alternate_greetings = g
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 mb-2">
      <h2 class="text-sm font-bold text-gray-300">Greetings</h2>
      <button
        class="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="addGreeting"
      >
        + Add Greeting
      </button>
    </div>
    <div v-if="greetings.length === 0" class="text-xs text-gray-600 py-2">
      No alternate greetings. Add one, or use the First Message from the spec.
    </div>
    <div
      v-for="(greeting, index) in greetings"
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
            class="px-2 py-0.5 text-xs bg-gray-700 hover:bg-red-800 rounded"
            @click="removeGreeting(index)"
          >
            ✕
          </button>
        </div>
      </div>
      <textarea
        :value="greeting"
        @input="(e: any) => updateGreeting(index, e.target.value)"
        rows="3"
        class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"
      ></textarea>
    </div>
  </div>
</template>
