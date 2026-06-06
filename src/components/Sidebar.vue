<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { isPng, extractJsonFromPng, embedJsonInPng } from '../utils/png'
import type { CharacterCardV2 } from '../types'

const emit = defineEmits<{
  openConfig: []
}>()

const store = useEditorStore()

onMounted(() => store.loadCards())

async function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.png,.json'
  input.click()
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    let json: CharacterCardV2
    let pngBlob: Blob | undefined
    if (isPng(buf)) {
      const extracted = extractJsonFromPng(buf)
      json = extracted.json as CharacterCardV2
      pngBlob = new Blob([buf], { type: 'image/png' })
    } else {
      json = JSON.parse(new TextDecoder().decode(buf)) as CharacterCardV2
    }
    if (json.spec !== 'chara_card_v2') {
      alert('Only V2 character cards are supported')
      return
    }
    const id = await store.addCard(json, pngBlob)
    store.setActiveCard(id!, json)
  }
}

async function selectCard(id: number) {
  await store.flushSave()
  const record = await store.getCard(id)
  if (record) {
    store.setActiveCard(id, record.cardJson)
  }
}

async function removeCard(id: number) {
  await store.deleteCard(id)
}

function prepareExport(): CharacterCardV2 | null {
  if (!store.cardJson) return null
  const plain: CharacterCardV2 = JSON.parse(JSON.stringify(store.cardJson))
  const greetings = plain.data.alternate_greetings
  plain.data.first_mes = greetings[0] ?? ''
  plain.data.alternate_greetings = greetings.slice(1)
  return plain
}

async function handleExport(type: 'json' | 'png') {
  const json = prepareExport()
  if (!json) return
  const record = store.cards.find((c) => c.id === store.activeCardId)
  const name = json.data.name || 'character'
  if (type === 'json') {
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${name}.json`)
  } else if (type === 'png') {
    if (record?.pngBlob) {
      const pngBytes = await record.pngBlob.arrayBuffer()
      const blob = embedJsonInPng(pngBytes, json)
      downloadBlob(blob, `${name}.png`)
    } else {
      alert('No PNG image to export. Import a PNG card first, or export as JSON.')
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function newCard() {
  const empty: CharacterCardV2 = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  }
  const id = await store.addCard(empty)
  if (id != null) {
    store.setActiveCard(id, empty)
  }
}
</script>

<template>
  <aside class="w-56 bg-gray-900 border-r border-gray-700 flex flex-col h-screen">
    <div class="p-3 border-b border-gray-700 flex items-center gap-1">
      <span class="text-lg">🎭</span>
      <span class="font-bold text-gray-200 text-xs">Character Editor</span>
    </div>
    <div class="p-2 border-b border-gray-700 flex gap-1">
      <button
        class="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="newCard"
      >
        New
      </button>
      <button
        class="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="handleImport"
      >
        Import
      </button>
      <button
        v-if="store.isActive"
        class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="handleExport('json')"
      >
        JSON
      </button>
      <button
        v-if="store.isActive"
        class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="handleExport('png')"
      >
        PNG
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-for="card in store.cards"
        :key="card.id"
        class="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-xs mb-0.5"
        :class="
          store.activeCardId === card.id
            ? 'bg-blue-700 text-white'
            : 'text-gray-300 hover:bg-gray-800'
        "
        @click="selectCard(card.id!)"
      >
        <span class="truncate flex-1">{{ card.name || 'Untitled' }}</span>
        <button
          class="text-gray-500 hover:text-red-400 text-xs"
          @click.stop="removeCard(card.id!)"
        >
          ✕
        </button>
      </div>
      <div v-if="store.cards.length === 0" class="text-xs text-gray-500 text-center py-4">
        No cards yet
      </div>
    </div>
    <div class="p-2 border-t border-gray-700">
      <button
        class="w-full px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-left"
        @click="emit('openConfig')"
      >
        ⚙ System Config
      </button>
    </div>
  </aside>
</template>
