import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CharacterCardV2, CardRecord } from '../types'
import { db } from '../storage/db'

export const useEditorStore = defineStore('editor', () => {
  const activeCardId = ref<number | null>(null)
  const cardJson = ref<CharacterCardV2 | null>(null)
  const cards = ref<CardRecord[]>([])
  const pngBlob = ref<Blob | undefined>(undefined)

  const apiConfig = ref({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
  })

  const isActive = computed(() => activeCardId.value !== null)

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function toPlain<T>(val: T): T {
    return JSON.parse(JSON.stringify(val))
  }

  async function doSave() {
    const id = activeCardId.value
    const json = cardJson.value
    if (!id || id === -1 || !json) return
    const existing = await db.cards.get(id)
    if (!existing) return
    const plain = toPlain(json)
    await db.cards.update(id, {
      name: plain.data.name || 'Untitled',
      cardJson: plain,
      pngBlob: pngBlob.value,
      updatedAt: new Date().toISOString(),
    })
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      await doSave()
      await loadCards()
    }, 500)
  }

  async function flushSave() {
    if (!saveTimer) return
    clearTimeout(saveTimer)
    saveTimer = null
    await doSave()
    await loadCards()
  }

  async function setActiveCard(id: number, json: CharacterCardV2) {
    activeCardId.value = id
    cardJson.value = json
    const record = await db.cards.get(id)
    pngBlob.value = record?.pngBlob
  }

  function clearActiveCard() {
    activeCardId.value = null
    cardJson.value = null
    pngBlob.value = undefined
  }

  async function loadCards() {
    cards.value = await db.cards.orderBy('updatedAt').reverse().toArray()
  }

  function updatePng(blob: Blob | undefined) {
    pngBlob.value = blob
    scheduleSave()
  }

  async function addCard(
    cardJson_: CharacterCardV2,
    blob?: Blob
  ): Promise<number | undefined> {
    const now = new Date().toISOString()
    const plain = toPlain(cardJson_)
    const id = await db.cards.add({
      name: plain.data.name || 'Untitled',
      cardJson: plain,
      pngBlob: blob,
      createdAt: now,
      updatedAt: now,
    })
    if (blob) pngBlob.value = blob
    await loadCards()
    return id
  }

  async function getCard(id: number): Promise<CardRecord | undefined> {
    return db.cards.get(id)
  }

  async function deleteCard(id: number) {
    await db.cards.delete(id)
    if (activeCardId.value === id) {
      clearActiveCard()
    }
    await loadCards()
  }

  return {
    activeCardId,
    cardJson,
    cards,
    pngBlob,
    apiConfig,
    isActive,
    setActiveCard,
    clearActiveCard,
    scheduleSave,
    flushSave,
    loadCards,
    addCard,
    getCard,
    deleteCard,
    updatePng,
  }
})
