<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'
import MarkdownField from '../components/MarkdownField.vue'

const store = useEditorStore()
const rawTags = ref('')
const showPreview = ref(false)

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
    <div class="grid grid-cols-3 gap-4">
      <div class="flex flex-col gap-1">
        <div
          class="flex-1 border border-gray-700 rounded-lg overflow-hidden bg-gray-900 cursor-pointer flex items-center justify-center"
          @click="previewUrl ? (showPreview = true) : pickImage()"
        >
          <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
          <span v-else class="text-2xl text-gray-600">+</span>
        </div>
        <button
          class="w-full py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
          @click="pickImage"
        >Upload</button>
      </div>
      <div class="col-span-2 flex flex-col gap-3">
        <div>
          <label class="text-xs text-gray-400 block mb-1">Name</label>
          <input v-model="store.cardJson.data.name" class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
        </div>
        <div class="grid grid-cols-2 gap-3">
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
          <label class="text-xs text-gray-400 block mb-1">Tags (comma-separated)</label>
          <input
            v-model="rawTags"
            @blur="commitTags"
            @keydown.enter="commitTags"
            placeholder="tag1, tag2, tag3"
            class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Creator Notes</label>
          <MarkdownField v-model="store.cardJson.data.creator_notes" />
        </div>
      </div>
    </div>
  </CollapsibleSection>

  <Teleport to="body">
    <div
      v-if="showPreview && previewUrl"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
      @click.self="showPreview = false"
    >
      <img :src="previewUrl" class="max-w-full max-h-full object-contain rounded-lg" @click="showPreview = false" />
    </div>
  </Teleport>
</template>
