<script setup lang="ts">
import { watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useCards } from '../storage/useCards'
import ExtensionsEditor from './ExtensionsEditor.vue'
const store = useEditorStore()
const { updateCard } = useCards()

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (!store.cardJson || !store.activeCardId || store.activeCardId === -1) return
    updateCard(store.activeCardId, store.cardJson)
  }, 500)
}

watch(() => store.cardJson, () => {
  scheduleSave()
}, { deep: true })
</script>

<template>
  <div class="space-y-4" v-if="store.cardJson">
    <h2 class="text-sm font-bold text-gray-300 border-b border-gray-700 pb-1">
      Character Base Spec
    </h2>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs text-gray-400 block mb-1">Name</label>
        <input v-model="store.cardJson.data.name" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Creator</label>
        <input v-model="store.cardJson.data.creator" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Version</label>
        <input v-model="store.cardJson.data.character_version" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
      </div>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Description</label>
      <textarea v-model="store.cardJson.data.description" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Personality</label>
      <textarea v-model="store.cardJson.data.personality" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Scenario</label>
      <textarea v-model="store.cardJson.data.scenario" rows="2" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">First Message</label>
      <textarea v-model="store.cardJson.data.first_mes" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Example Messages</label>
      <textarea v-model="store.cardJson.data.mes_example" rows="4" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Creator Notes</label>
      <textarea v-model="store.cardJson.data.creator_notes" rows="2" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">System Prompt</label>
      <textarea v-model="store.cardJson.data.system_prompt" rows="4" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Post-History Instructions</label>
      <textarea v-model="store.cardJson.data.post_history_instructions" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Tags</label>
      <input
        :value="store.cardJson.data.tags?.join(', ')"
        @input="(e: any) => { store.cardJson!.data.tags = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }"
        placeholder="tag1, tag2, tag3"
        class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
      />
    </div>

    <ExtensionsEditor />
  </div>
</template>
