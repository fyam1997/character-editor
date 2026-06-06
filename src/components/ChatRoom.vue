<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { streamChat } from '../utils/api'
import { assembleApiMessages } from '../utils/prompt-assembly'
import type { ChatMessage, ChatSession } from '../types'
import { db } from '../storage/db'
import MarkdownField from './MarkdownField.vue'

const store = useEditorStore()
const input = ref('')
const sending = ref(false)
const abortController = ref<AbortController | null>(null)
const chatEl = ref<HTMLElement | null>(null)
const showSessions = ref(false)

const activeSessionName = computed(() => {
  const s = store.sessions.find((s) => s.id === store.activeSessionId)
  return s?.name ?? ''
})

const emptyInfo = { messages: [] as ChatMessage[], sessionStart: 0, sessionCount: 0 }
const assembledInfo = computed(() => {
  const sid = store.activeSessionId
  if (!sid || !store.cardJson) return emptyInfo
  const s = store.sessions.find((s) => s.id === sid)
  if (!s) return emptyInfo
  return assembleApiMessages(store.cardJson, store.systemPrompts, s.messages)
})

onMounted(() => store.loadSessionsForCard())

function selectAndClose(id: number) {
  store.selectSession(id)
  showSessions.value = false
}

watch(() => store.activeCardId, async () => {
  store.activeSessionId = null
  await store.loadSessionsForCard()
})

async function streamAssistantResponse(apiMessages: ChatMessage[]) {
  sending.value = true
  abortController.value = new AbortController()
  let assistantContent = ''

  try {
    const asstMsg: ChatMessage = { role: 'assistant', content: '' }
    await store.addMessage(asstMsg)

    for await (const chunk of streamChat(
      store.apiConfig.baseUrl,
      store.apiConfig.apiKey,
      store.apiConfig.model,
      apiMessages,
      abortController.value.signal
    )) {
      if (chunk.type === 'text' && chunk.content) {
        assistantContent += chunk.content
        await store.updateLastAssistant(assistantContent)
        await nextTick()
        scrollToBottom()
      } else if (chunk.type === 'error') {
        await store.updateLastAssistant(`Error: ${chunk.content}`)
        scrollToBottom()
      }
    }
  } finally {
    sending.value = false
    abortController.value = null
  }
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || sending.value) return

  input.value = ''
  const userMsg: ChatMessage = { role: 'user', content: text }
  await store.addMessage(userMsg)

  const session = store.sessions.find((s) => s.id === store.activeSessionId)
  if (!session) return

  const apiMessages = assembleApiMessages(store.cardJson, store.systemPrompts, session.messages).messages
  await streamAssistantResponse(apiMessages)
}

function isChatMsg(i: number): boolean {
  const info = assembledInfo.value
  return i >= info.sessionStart && i < info.sessionStart + info.sessionCount
}

function isAssistantMsg(i: number): boolean {
  const msg = assembledInfo.value.messages[i]
  return msg?.role === 'assistant'
}

async function deleteMessage(assembledIdx: number) {
  const sid = store.activeSessionId
  if (sid == null) return
  const session = await db.chatSessions.get(sid) as ChatSession | undefined
  if (!session) return
  const sessionIdx = assembledIdx - assembledInfo.value.sessionStart
  const firstSessionIdx = session.messages[0]?.role === 'system' ? 1 : 0
  const msgIdx = firstSessionIdx + sessionIdx
  if (msgIdx < 0 || msgIdx >= session.messages.length) return
  session.messages.splice(msgIdx, 1)
  session.updatedAt = new Date().toISOString()
  await db.chatSessions.put(session)
  const idx = store.sessions.findIndex((s) => s.id === sid)
  if (idx !== -1) store.sessions[idx] = session
}

async function regenerateMessage(assembledIdx: number) {
  const sid = store.activeSessionId
  if (sid == null || sending.value) return
  const session = await db.chatSessions.get(sid) as ChatSession | undefined
  if (!session) return
  const sessionIdx = assembledIdx - assembledInfo.value.sessionStart
  const firstSessionIdx = session.messages[0]?.role === 'system' ? 1 : 0
  const msgIdx = firstSessionIdx + sessionIdx
  if (msgIdx < 0 || msgIdx >= session.messages.length) return
  session.messages.splice(msgIdx)
  session.updatedAt = new Date().toISOString()
  await db.chatSessions.put(session)
  const idx = store.sessions.findIndex((s) => s.id === sid)
  if (idx !== -1) store.sessions[idx] = session
  const apiMessages = assembleApiMessages(store.cardJson, store.systemPrompts, session.messages).messages
  await streamAssistantResponse(apiMessages)
}

function cancelChat() {
  abortController.value?.abort()
  sending.value = false
}

function scrollToBottom() {
  nextTick(() => {
    if (chatEl.value) {
      chatEl.value.scrollTop = chatEl.value.scrollHeight
    }
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="relative">
      <div
        class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 cursor-pointer select-none"
        @click="showSessions = !showSessions"
      >
        <span class="flex-1 truncate">
          {{ activeSessionName || 'Select session' }}
        </span>
        <span class="text-gray-500">{{ showSessions ? '▲' : '▼' }}</span>
      </div>
      <div v-if="showSessions" class="absolute left-0 right-0 z-30 mt-1 border border-gray-700 rounded bg-gray-800 max-h-40 overflow-y-auto shadow-lg">
        <div
          v-for="s in store.sessions"
          :key="s.id"
          class="flex items-center gap-1 px-2 py-1 text-xs cursor-pointer hover:bg-gray-700"
          @click="selectAndClose(s.id!)"
        >
          <span class="w-4 text-green-400">{{ store.activeSessionId === s.id ? '✓' : '' }}</span>
          <span class="flex-1 truncate">{{ s.name }}</span>
          <button
            class="px-1 text-gray-500 hover:text-red-400"
            @click.stop="store.deleteSession(s.id!)"
          >✕</button>
        </div>
        <div v-if="store.sessions.length === 0" class="px-2 py-1 text-xs text-gray-500">
          No sessions yet
        </div>
      </div>
    </div>

    <div ref="chatEl" class="flex-1 overflow-y-auto mb-3 pr-1 flex flex-col">
      <template v-if="assembledInfo.messages.length > 0">
        <div
          v-for="(msg, i) in assembledInfo.messages"
          :key="i"
          class="text-xs border rounded px-3 py-2 mt-2"
          :class="{
            'border-gray-700 bg-gray-900 text-gray-400 border-l-2': msg.role === 'system' && !msg.name,
            'border-gray-700 bg-gray-900 text-gray-200 border-l-2 border-l-blue-500': msg.role === 'user',
            'border-gray-700 bg-gray-900 text-gray-200 border-l-2 border-l-green-500': msg.role === 'assistant',
            'border-gray-700 bg-gray-900 text-yellow-200 border-l-2 border-l-yellow-500': msg.name,
          }"
        >
          <div class="flex items-center justify-between mb-0.5">
            <span class="font-bold">
              <template v-if="msg.name">{{ msg.name }}</template>
              <template v-else-if="msg.role === 'system'">System</template>
              <template v-else-if="msg.role === 'user'">You</template>
              <template v-else>Assistant</template>
            </span>
            <span v-if="isChatMsg(i)" class="flex items-center gap-1">
              <button
                v-if="isAssistantMsg(i)"
                class="text-xs text-gray-500 hover:text-green-400"
                @click="regenerateMessage(i)"
              >↻</button>
              <button
                class="text-xs text-gray-500 hover:text-red-400"
                @click="deleteMessage(i)"
              >✕</button>
            </span>
          </div>
          <MarkdownField :model-value="msg.content" readonly />
        </div>
      </template>
      <div v-else class="flex-1 flex items-center justify-center text-xs text-gray-500">
        Select or start a session to begin chatting.
      </div>
    </div>

    <div class="flex gap-2">
      <input
        v-model="input"
        :disabled="sending || !store.activeSessionId"
        @keydown.enter.prevent="sendMessage"
        placeholder="Type a message..."
        class="flex-1 px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 disabled:opacity-50"
      />
      <button
        v-if="!sending"
        :disabled="!input.trim() || !store.activeSessionId"
        class="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 rounded disabled:opacity-50"
        @click="sendMessage"
      >Send</button>
      <button
        v-else
        class="px-3 py-1.5 text-xs bg-red-800 hover:bg-red-700 rounded"
        @click="cancelChat"
      >Stop</button>
    </div>
  </div>
</template>
