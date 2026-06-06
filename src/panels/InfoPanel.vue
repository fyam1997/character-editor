<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'

const store = useEditorStore()
const rawTags = ref('')

const previewUrl = computed(() => {
  if (!store.pngBlob) return ''
  return URL.createObjectURL(store.pngBlob)
})

watch(() => store.cardJson?.data.tags, (t) => {
  rawTags.value = t?.join(', ') ?? ''
}, { immediate: true })

function commitTags() {
  if (!store.cardJson) return
  store.cardJson.data.tags = rawTags.value.split(',').map((s) => s.trim()).filter(Boolean)
}

function pickImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/png'
  input.click()
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    store.updatePng(new Blob([await file.arrayBuffer()], { type: 'image/png' }))
  }
}
</script>

<template>
  <CollapsibleSection title="Info" v-if="store.cardJson">
    <div class="flex gap-4">
      <div
        class="w-24 h-24 shrink-0 border border-gray-700 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden bg-gray-900"
        @click="pickImage"
      >
        <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
        <span v-else class="text-2xl text-gray-600">+</span>
      </div>
      <div class="flex-1 min-w-0">
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
      </div>
    </div>
    <div class="mt-3">
      <label class="text-xs text-gray-400 block mb-1">Creator Notes</label>
      <textarea v-model="store.cardJson.data.creator_notes" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"></textarea>
    </div>
  </CollapsibleSection>
</template>
