import { ref } from 'vue'
import type { CardRecord, CharacterCardV2 } from '../types'
import { db } from './db'

export function useCards() {
  const cards = ref<CardRecord[]>([])
  const loading = ref(false)

  async function loadCards() {
    loading.value = true
    cards.value = await db.cards.orderBy('updatedAt').reverse().toArray()
    loading.value = false
  }

  async function getCard(id: number): Promise<CardRecord | undefined> {
    return db.cards.get(id)
  }

  async function addCard(
    cardJson: CharacterCardV2,
    pngBlob?: Blob
  ): Promise<number | undefined> {
    const now = new Date().toISOString()
    const id = await db.cards.add({
      name: cardJson.data.name || 'Untitled',
      cardJson,
      pngBlob,
      createdAt: now,
      updatedAt: now,
    })
    await loadCards()
    return id
  }

  async function updateCard(
    id: number,
    cardJson: CharacterCardV2,
    pngBlob?: Blob
  ) {
    const existing = await db.cards.get(id)
    if (!existing) return
    await db.cards.update(id, {
      name: cardJson.data.name || 'Untitled',
      cardJson,
      pngBlob: pngBlob ?? existing.pngBlob,
      updatedAt: new Date().toISOString(),
    })
    await loadCards()
  }

  async function deleteCard(id: number) {
    await db.cards.delete(id)
    await loadCards()
  }

  return { cards, loading, loadCards, getCard, addCard, updateCard, deleteCard }
}
