<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { isPng, extractJsonFromPng } from '../utils/png'
import type { CharacterCardV2 } from '../types'

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
      pngBlob = new Blob([buf], { type: 'image/png' })
      if (extracted.json) {
        json = extracted.json as CharacterCardV2
      } else {
        const bytes = new Uint8Array(buf)
        const iend = locateIEND(bytes)
        if (iend === -1) { alert('Invalid PNG'); return }
        json = JSON.parse(new TextDecoder().decode(bytes.slice(iend))) as CharacterCardV2
      }
    } else {
      json = JSON.parse(new TextDecoder().decode(buf)) as CharacterCardV2
    }
    if (json.spec !== 'chara_card_v2') {
      const root = json as Record<string, unknown>
      const src = (root.data as Record<string, unknown>) ?? root
      if (src.name !== undefined || src.description !== undefined) {
        json = {
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
            ...(src as Record<string, unknown>),
          } as CharacterCardV2['data'],
        }
      } else {
        alert('Unrecognized card format')
        return
      }
    }
    const id = await store.addCard(json, pngBlob)
    await store.setActiveCard(id!, json)
  }
}

async function selectCard(id: number) {
  await store.flushSave()
  const record = await store.getCard(id)
  if (record) {
    await store.setActiveCard(id, record.cardJson)
  }
}

async function removeCard(id: number) {
  await store.deleteCard(id)
}

function locateIEND(buf: Uint8Array): number {
  for (let i = 8; i <= buf.length - 12; i++) {
    const len = (buf[i] << 24) | (buf[i + 1] << 16) | (buf[i + 2] << 8) | buf[i + 3]
    if (
      buf[i + 4] === 73 && buf[i + 5] === 69 && buf[i + 6] === 78 && buf[i + 7] === 68
    ) {
      return i + 4 + 4 + len + 4
    }
  }
  return -1
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
      alternate_greetings: [''],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  }
  const id = await store.addCard(empty)
  if (id != null) {
    await store.setActiveCard(id, empty)
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
    </div>
    <div class="flex-1 overflow-y-auto p-2" style="scrollbar-gutter: auto">
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
  </aside>
</template>
