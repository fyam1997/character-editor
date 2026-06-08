import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { CharacterCardV2, CardRecord, ChatSession, ChatMessage } from '../types'
import { db } from '../storage/db'

function loadApiConfig() {
  try {
    const saved = localStorage.getItem('apiConfig')
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

export const useEditorStore = defineStore('editor', () => {
  const activeCardId = ref<number | null>(null)
  const cardJson = ref<CharacterCardV2 | null>(null)
  const cards = ref<CardRecord[]>([])
  const pngBlob = ref<Blob | undefined>(undefined)

  const saved = loadApiConfig()
  const apiConfig = ref(saved ?? {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
  })

  watch(apiConfig, (v) => {
    localStorage.setItem('apiConfig', JSON.stringify(v))
  }, { deep: true })

  function loadSystemPrompts() {
    try {
      const saved = localStorage.getItem('systemPrompts')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  }

  const savedPrompts = loadSystemPrompts()
  const systemPrompts = ref(savedPrompts ?? {
    startChatPrompt: '',
    mainPrompt: '',
    auxiliaryPrompt: '',
    postHistoryPrompt: '',
  })

  watch(systemPrompts, (v) => {
    localStorage.setItem('systemPrompts', JSON.stringify(v))
  }, { deep: true })

  const inspectRequest = ref(localStorage.getItem('inspectRequest') === 'true')
  watch(inspectRequest, (v) => {
    localStorage.setItem('inspectRequest', String(v))
  })

  const mockInspect = ref(localStorage.getItem('mockInspect') === 'true')
  watch(mockInspect, (v) => {
    localStorage.setItem('mockInspect', String(v))
  })

  function loadMockInspectText(): string {
    try {
      const saved = localStorage.getItem('mockInspectText')
      if (saved) return saved
    } catch {}
    return 'Hello there! I am a mock AI response, streaming word by word to simulate a real API call. You can configure this text to test your streaming UI without hitting any external service.'
  }

  const mockInspectText = ref(loadMockInspectText())
  watch(mockInspectText, (v) => {
    localStorage.setItem('mockInspectText', v)
  })

  const isActive = computed(() => activeCardId.value !== null)

  // chat sessions
  const sessions = ref<ChatSession[]>([])
  const activeSessionId = ref<number | null>(null)

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
    await db.chatSessions.where('cardId').equals(id).delete()
    if (activeCardId.value === id) {
      clearActiveCard()
    }
    await loadCards()
    await loadSessionsForCard()
  }

  // --- chat sessions ---

  async function loadSessionsForCard() {
    const cardId = activeCardId.value
    if (!cardId) {
      sessions.value = []
      return
    }
    sessions.value = await db.chatSessions
      .where('cardId').equals(cardId)
      .reverse()
      .sortBy('updatedAt')
  }

  async function createSession(greeting: string) {
    const cardId = activeCardId.value
    if (!cardId) return
    const now = new Date().toISOString()
    const id = await db.chatSessions.add({
      cardId,
      name: new Date().toLocaleString(),
      createdAt: now,
      updatedAt: now,
      messages: [
        { role: 'assistant' as const, content: greeting },
      ],
    })
    await loadSessionsForCard()
    activeSessionId.value = id ?? null
  }

  async function selectSession(id: number) {
    activeSessionId.value = id
  }

  async function deleteSession(id: number) {
    await db.chatSessions.delete(id)
    if (activeSessionId.value === id) {
      activeSessionId.value = null
    }
    await loadSessionsForCard()
  }

  async function addMessage(msg: ChatMessage) {
    const sid = activeSessionId.value
    if (sid == null) return
    const session = await db.chatSessions.get(sid) as ChatSession | undefined
    if (!session) return
    session.messages.push(msg)
    session.updatedAt = new Date().toISOString()
    await db.chatSessions.put(session)
    const idx = sessions.value.findIndex((s) => s.id === sid)
    if (idx !== -1) sessions.value[idx] = session
  }

  async function updateLastAssistant(content: string) {
    const sid = activeSessionId.value
    if (sid == null) return
    const session = await db.chatSessions.get(sid) as ChatSession | undefined
    if (!session || session.messages.length === 0) return
    const last = session.messages[session.messages.length - 1]
    if (last.role === 'assistant') {
      last.content = content
      session.updatedAt = new Date().toISOString()
      await db.chatSessions.put(session)
      const idx = sessions.value.findIndex((s) => s.id === sid)
      if (idx !== -1) sessions.value[idx] = session
    }
  }

  const activeMessages = computed<ChatMessage[]>(() => {
    const session = sessions.value.find((s) => s.id === activeSessionId.value)
    return session?.messages ?? []
  })

  return {
    activeCardId,
    cardJson,
    cards,
    pngBlob,
    apiConfig,
    systemPrompts,
    inspectRequest,
    mockInspect,
    mockInspectText,
    isActive,
    sessions,
    activeSessionId,
    setActiveCard,
    clearActiveCard,
    scheduleSave,
    flushSave,
    loadCards,
    addCard,
    getCard,
    deleteCard,
    updatePng,
    loadSessionsForCard,
    createSession,
    selectSession,
    deleteSession,
    addMessage,
    updateLastAssistant,
    activeMessages,
  }
})
