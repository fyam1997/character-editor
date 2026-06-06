<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { streamChat } from '../utils/api'
import type { ChatMessage } from '../types'
import { db } from '../storage/db'

const props = defineProps<{
  greeting: string
}>()

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

onMounted(() => store.loadSessionsForCard())

function selectAndClose(id: number) {
  store.selectSession(id)
  showSessions.value = false
}

watch(() => store.activeCardId, async () => {
  store.activeSessionId = null
  await store.loadSessionsForCard()
})

watch(() => props.greeting, async () => {
  if (!props.greeting.trim()) return
  await store.loadSessionsForCard()
  const existing = store.sessions.find(
    (s) => s.messages[1]?.content === props.greeting
  )
  if (existing && existing.id != null) {
    await store.selectSession(existing.id)
  } else {
    await store.createSession(props.greeting)
  }
  scrollToBottom()
})

async function sendMessage() {
  const text = input.value.trim()
  if (!text || sending.value) return

  input.value = ''
  const userMsg: ChatMessage = { role: 'user', content: text }
  await store.addMessage(userMsg)
  sending.value = true

  const session = store.sessions.find((s) => s.id === store.activeSessionId)
  if (!session) { sending.value = false; return }

  const apiMessages = session.messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.content,
  }))

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

async function deleteMessage(index: number) {
  const sid = store.activeSessionId
  if (sid == null) return
  const session = store.sessions.find((s) => s.id === sid)
  if (!session) return
  session.messages.splice(index, 1)
  session.updatedAt = new Date().toISOString()
  await db.chatSessions.put(session)
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

    <div ref="chatEl" class="flex-1 overflow-y-auto mb-3 pr-1 flex flex-col" :class="{ 'space-y-3': store.activeMessages.length > 0 }">
      <template v-if="store.activeMessages.length > 0">
        <div
          v-for="(msg, i) in store.activeMessages"
          :key="i"
          class="text-xs border rounded px-3 py-2 mt-2"
          :class="{
            'border-gray-700 bg-gray-900 text-gray-400 border-l-2': msg.role === 'system',
            'border-gray-700 bg-gray-900 text-gray-200 border-l-2 border-l-blue-500': msg.role === 'user',
            'border-gray-700 bg-gray-900 text-green-300 border-l-2 border-l-green-500': msg.role === 'assistant',
          }"
        >
          <div class="flex items-center justify-between mb-0.5">
            <span class="font-bold">
              {{ msg.role === 'system' ? 'System' : msg.role === 'user' ? 'You' : 'Assistant' }}
            </span>
            <button
              class="text-xs text-gray-500 hover:text-red-400"
              @click="deleteMessage(i)"
            >✕</button>
          </div>
          <div class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
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
