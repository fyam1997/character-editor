<script setup lang="ts">
import { watch } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { cardDataSchema } from '../schemas/card'
import { useEditorStore } from '../stores/editor'
import { useCards } from '../storage/useCards'
import ExtensionsEditor from './ExtensionsEditor.vue'

const store = useEditorStore()
const { updateCard } = useCards()

const { values, resetForm } = useForm({
  validationSchema: toTypedSchema(cardDataSchema),
})

function syncToStore() {
  if (!store.cardJson) return
  store.cardJson.data = values as typeof store.cardJson.data
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (!store.cardJson || !store.activeCardId || store.activeCardId === -1) return
    syncToStore()
    updateCard(store.activeCardId, store.cardJson)
  }, 500)
}

watch(values, () => {
  syncToStore()
  scheduleSave()
}, { deep: true })

watch(() => store.cardJson, () => {
  scheduleSave()
}, { deep: true })

watch(() => store.cardJson, (json) => {
  if (json) {
    resetForm({ values: json.data })
  }
}, { immediate: true })

const { value: name } = useField<string>('name')
const { value: description } = useField<string>('description')
const { value: personality } = useField<string>('personality')
const { value: scenario } = useField<string>('scenario')
const { value: first_mes } = useField<string>('first_mes')
const { value: mes_example } = useField<string>('mes_example')
const { value: creator_notes } = useField<string>('creator_notes')
const { value: system_prompt } = useField<string>('system_prompt')
const { value: post_history_instructions } = useField<string>('post_history_instructions')
const { value: creator } = useField<string>('creator')
const { value: character_version } = useField<string>('character_version')
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-sm font-bold text-gray-300 border-b border-gray-700 pb-1">
      Character Base Spec
    </h2>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="text-xs text-gray-400 block mb-1">Name</label>
        <input v-model="name" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Creator</label>
        <input v-model="creator" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Version</label>
        <input v-model="character_version" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
      </div>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Description</label>
      <textarea v-model="description" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Personality</label>
      <textarea v-model="personality" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Scenario</label>
      <textarea v-model="scenario" rows="2" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">First Message</label>
      <textarea v-model="first_mes" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Example Messages</label>
      <textarea v-model="mes_example" rows="4" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Creator Notes</label>
      <textarea v-model="creator_notes" rows="2" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">System Prompt</label>
      <textarea v-model="system_prompt" rows="4" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Post-History Instructions</label>
      <textarea v-model="post_history_instructions" rows="3" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y font-mono"></textarea>
    </div>

    <div>
      <label class="text-xs text-gray-400 block mb-1">Tags</label>
      <input
        :value="(values as any)?.tags?.join(', ')"
        @input="(e: any) => { const t = (values as any); if (t) t.tags = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }"
        placeholder="tag1, tag2, tag3"
        class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
      />
    </div>

    <ExtensionsEditor />
  </div>
</template>
