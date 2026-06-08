<script setup lang="ts">
import { ref, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SystemConfig from './components/SystemConfig.vue'
import GenerateDialog from './components/GenerateDialog.vue'
import InfoPanel from './panels/InfoPanel.vue'
import CharacterPanel from './panels/CharacterPanel.vue'
import OverridePromptPanel from './panels/OverridePromptPanel.vue'
import GreetingsPanel from './panels/GreetingsPanel.vue'
import LoreBookPanel from './panels/LoreBookPanel.vue'
import ExtensionsPanel from './panels/ExtensionsPanel.vue'
import ChatRoom from './components/ChatRoom.vue'
import { useEditorStore } from './stores/editor'
import { prepareExport, exportAsJson, exportAsPng, downloadBlob, createExportFilename } from './utils/card-io'
import type { GenerateField } from './utils/generate'

const store = useEditorStore()

interface GenerateConfig {
  field: GenerateField
  index?: number
  content: string
}

const showGenerate = ref(false)
const genConfig = ref<GenerateConfig | null>(null)

function openGenerate(config: GenerateConfig) {
  genConfig.value = config
  showGenerate.value = true
}

function closeGenerate() {
  showGenerate.value = false
  genConfig.value = null
}

function applyGenerateResult(value: string) {
  if (!genConfig.value || !store.cardJson) return
  const { field, index } = genConfig.value

  if (field === 'greeting' && index !== undefined) {
    store.cardJson.data.alternate_greetings[index] = value
    if (index === 0) {
      store.cardJson.data.first_mes = value
    }
  } else if (field === 'lore' && index !== undefined) {
    const entry = store.cardJson.data.character_book?.entries[index]
    if (entry) entry.content = value
  } else if (['description', 'personality', 'scenario', 'mes_example'].includes(field)) {
    (store.cardJson.data as Record<string, unknown>)[field] = value
  }

  store.scheduleSave()
  closeGenerate()
}

watch(() => store.cardJson?.data, (newVal, oldVal) => {
  if (newVal && oldVal && newVal === oldVal) {
    store.scheduleSave()
  }
}, { deep: true })

function onStartChat(greeting: string) {
  if (!greeting.trim()) return
  store.createSession(greeting)
}

async function handleExport(type: 'json' | 'png') {
  if (!store.cardJson) return
  const json = prepareExport(store.cardJson)
  const name = json.data.name || 'character'
  if (type === 'json') {
    const blob = exportAsJson(json)
    downloadBlob(blob, createExportFilename(name, 'json'))
  } else if (type === 'png') {
    if (store.pngBlob) {
      const pngBytes = await store.pngBlob.arrayBuffer()
      const blob = await exportAsPng(json, pngBytes)
      downloadBlob(blob, createExportFilename(name, 'png'))
    } else {
      alert('No PNG image to export. Import a PNG card first, or export as JSON.')
    }
  }
}
</script>

<template>
  <div class="h-screen flex text-sm bg-gray-950 text-gray-200">
    <Sidebar />
    <main class="flex-1 flex">
      <section class="flex-1 border-r border-gray-700 flex flex-col">
        <div v-if="!store.isActive" class="flex-1 flex items-center justify-center text-gray-500 text-sm p-4">
          Select or create a card to start editing
        </div>
        <template v-else>
          <div class="flex-1 overflow-y-auto">
            <div class="space-y-2 max-w-2xl mx-auto p-4 pb-2">
              <InfoPanel />
              <CharacterPanel @generate="(field, content) => openGenerate({ field, content })" />
              <OverridePromptPanel />
              <GreetingsPanel @start-chat="onStartChat" @generate="(field, index, content) => openGenerate({ field, index, content })" />
              <LoreBookPanel @generate="(field, index, content) => openGenerate({ field, index, content })" />
              <ExtensionsPanel />
            </div>
          </div>
          <div class="bg-gray-950 py-2 flex gap-2 border-t border-gray-700 text-xs px-4">
            <button
              class="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-center"
              @click="handleExport('json')"
            >Export JSON</button>
            <button
              class="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-center"
              @click="handleExport('png')"
            >Export PNG</button>
          </div>
        </template>
      </section>
      <section v-if="store.isActive" class="flex-1 flex flex-col">
        <div class="flex items-center px-4 py-2 border-b border-gray-700 bg-gray-900">
          <h2 class="text-sm font-bold text-gray-200">Chat room</h2>
        </div>
        <div class="flex flex-1 overflow-hidden">
          <div class="flex-1 p-4 overflow-y-auto flex flex-col">
            <ChatRoom />
          </div>
          <div class="w-72 border-l border-gray-700 p-3 overflow-y-auto">
            <SystemConfig />
          </div>
        </div>
      </section>
    </main>
  </div>
  <GenerateDialog
    :visible="showGenerate"
    :field="genConfig?.field ?? 'description'"
    :index="genConfig?.index"
    :content="genConfig?.content ?? ''"
    @close="closeGenerate"
    @result="applyGenerateResult"
  />
</template>
