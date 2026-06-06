<script setup lang="ts">
import { ref, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SystemConfig from './components/SystemConfig.vue'
import InfoPanel from './panels/InfoPanel.vue'
import CharacterPanel from './panels/CharacterPanel.vue'
import OverridePromptPanel from './panels/OverridePromptPanel.vue'
import GreetingsPanel from './panels/GreetingsPanel.vue'
import LoreBookPanel from './panels/LoreBookPanel.vue'
import ChatRoom from './components/ChatRoom.vue'
import { useEditorStore } from './stores/editor'
import { embedJsonInPng } from './utils/png'
import type { CharacterCardV2 } from './types'

const store = useEditorStore()
const chatGreeting = ref('')

watch(() => store.cardJson?.data, (newVal, oldVal) => {
  if (newVal && oldVal && newVal === oldVal) {
    store.scheduleSave()
  }
}, { deep: true })

function onStartChat(greeting: string) {
  if (!greeting.trim()) return
  chatGreeting.value = greeting
}

function prepareExport(): CharacterCardV2 | null {
  if (!store.cardJson) return null
  const plain: CharacterCardV2 = JSON.parse(JSON.stringify(store.cardJson))
  const greetings = plain.data.alternate_greetings
  plain.data.first_mes = greetings[0] ?? ''
  plain.data.alternate_greetings = greetings.slice(1)
  return plain
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function handleExport(type: 'json' | 'png') {
  const json = prepareExport()
  if (!json) return
  const name = json.data.name || 'character'
  if (type === 'json') {
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${name}.json`)
  } else if (type === 'png') {
    if (store.pngBlob) {
      const pngBytes = await store.pngBlob.arrayBuffer()
      const blob = embedJsonInPng(pngBytes, json)
      downloadBlob(blob, `${name}.png`)
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
              <CharacterPanel />
              <OverridePromptPanel />
              <GreetingsPanel @start-chat="onStartChat" />
              <LoreBookPanel />
            </div>
          </div>
          <div class="bg-gray-950 py-2 flex gap-2 border-t border-gray-700 text-xs px-4">
            <button
              class="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-center"
              @click="handleExport('json')"
            >Export JSON</button>
            <button
              class="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-center"
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
            <ChatRoom :greeting="chatGreeting" />
          </div>
          <div class="w-72 border-l border-gray-700 p-3 overflow-y-auto bg-gray-900/50">
            <SystemConfig />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
