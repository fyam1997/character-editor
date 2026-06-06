import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CharacterCardV2 } from '../types'

export const useEditorStore = defineStore('editor', () => {
  const activeCardId = ref<number | null>(null)
  const cardJson = ref<CharacterCardV2 | null>(null)

  const apiConfig = ref({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
  })

  const isActive = computed(() => activeCardId.value !== null)

  function setActiveCard(id: number, json: CharacterCardV2) {
    activeCardId.value = id
    cardJson.value = json
  }

  function clearActiveCard() {
    activeCardId.value = null
    cardJson.value = null
  }

  return {
    activeCardId,
    cardJson,
    apiConfig,
    isActive,
    setActiveCard,
    clearActiveCard,
  }
})
