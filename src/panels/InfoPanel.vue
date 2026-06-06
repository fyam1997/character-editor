<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'

const store = useEditorStore()
const rawTags = ref('')

watch(() => store.cardJson?.data.tags, (t) => {
  rawTags.value = t?.join(', ') ?? ''
}, { immediate: true })

function commitTags() {
  if (!store.cardJson) return
  store.cardJson.data.tags = rawTags.value.split(',').map((s) => s.trim()).filter(Boolean)
}
</script>

<template>
  <CollapsibleSection title="Info" v-if="store.cardJson">
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
    <div class="mt-3">
      <label class="text-xs text-gray-400 block mb-1">Tags (comma-separated)</label>
      <input
        v-model="rawTags"
        @blur="commitTags"
        @keydown.enter="commitTags"
        placeholder="tag1, tag2, tag3"
        class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
      />
    </div>
    <div class="mt-3">
      <label class="text-xs text-gray-400 block mb-1">Creator Notes</label>
      <textarea v-model="store.cardJson.data.creator_notes" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"></textarea>
    </div>
  </CollapsibleSection>
</template>
