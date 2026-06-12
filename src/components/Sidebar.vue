<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { importCard } from '../utils/card-io'
import type { CharacterCardV2 } from '../types'

const store = useEditorStore()

const appVersion = __APP_VERSION__

onMounted(async () => {
  await store.loadCards()
  if (store.reopenLastSession) {
    const lastId = store.getLastActiveCardId()
    if (lastId != null) {
      const card = store.cards.find(c => c.id === lastId)
      if (card) {
        await store.setActiveCard(lastId, card.cardJson)
      }
    }
  }
})

async function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.png,.json'
  input.click()
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const { json, pngBlob } = importCard(buf)
      const id = await store.addCard(json, pngBlob)
      await store.setActiveCard(id!, json)
    } catch (e) {
      alert((e as Error)?.message ?? 'Import failed')
    }
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
    <div class="p-3 border-b border-gray-700">
      <div class="flex items-center gap-1">
        <span class="text-lg">🎭</span>
        <span class="font-bold text-gray-200 text-xs">Character Editor</span>
      </div>
      <div class="text-[10px] text-gray-500 mt-0.5">v{{ appVersion }}</div>
    </div>
    <div class="p-2 border-b border-gray-700 flex gap-1">
      <button
        class="flex-1 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
        @click="newCard"
      >
        New
      </button>
      <button
        class="flex-1 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
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
