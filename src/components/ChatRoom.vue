<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useEditorStore } from '../stores/editor'
import { streamChat } from '../utils/api'
import type { ChatMessage } from '../types'

const props = defineProps<{
  greeting: string
}>()

const store = useEditorStore()

const messages = ref<ChatMessage[]>([])
const input = ref('')
const sending = ref(false)
const abortController = ref<AbortController | null>(null)
const chatEl = ref<HTMLElement | null>(null)

function buildSystemMessage(): string {
  const json = store.cardJson
  if (!json) return ''
  return JSON.stringify(json, null, 2)
}

function startChat() {
  messages.value = [
    { role: 'system', content: buildSystemMessage() },
    { role: 'assistant', content: props.greeting },
  ]
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || sending.value || !store.cardJson) return

  input.value = ''
  messages.value.push({ role: 'user', content: text })
  sending.value = true

  const apiMessages = messages.value.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: m.content,
  }))

  abortController.value = new AbortController()
  let assistantMsg = ''

  try {
    for await (const chunk of streamChat(
      store.apiConfig.baseUrl,
      store.apiConfig.apiKey,
      store.apiConfig.model,
      apiMessages,
      abortController.value.signal
    )) {
      if (chunk.type === 'text' && chunk.content) {
        assistantMsg += chunk.content
        const prev = assistantMsg.slice(0, -chunk.content.length)
        const idx = messages.value.findIndex(
          (m) => m.role === 'assistant' && m.content === prev
        )
        if (idx >= 0) {
          messages.value[idx].content = assistantMsg
        } else {
          messages.value.push({ role: 'assistant', content: assistantMsg })
        }
      } else if (chunk.type === 'error') {
        messages.value.push({ role: 'assistant', content: `Error: ${chunk.content}` })
      }
      await nextTick()
      scrollToBottom()
    }
  } finally {
    sending.value = false
    abortController.value = null
  }
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

function clearChat() {
  messages.value = []
}

watch(() => props.greeting, () => {
  startChat()
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
      <h2 class="text-sm font-bold text-gray-300">Chat</h2>
      <button
        v-if="messages.length > 0"
        class="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="clearChat"
      >
        Clear
      </button>
    </div>

    <div
      ref="chatEl"
      class="flex-1 overflow-y-auto space-y-3 mb-3 pr-1"
    >
      <div v-if="messages.length === 0" class="text-xs text-gray-500 text-center mt-10">
        Chat will start when you click ▶ on a greeting.
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="text-xs"
        :class="{
          'text-gray-400': msg.role === 'system',
          'text-gray-200': msg.role === 'user',
          'text-green-300': msg.role === 'assistant',
        }"
      >
        <div class="font-bold mb-0.5">
          {{ msg.role === 'system' ? 'System' : msg.role === 'user' ? 'You' : 'Assistant' }}
        </div>
        <div class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
      </div>
    </div>

    <div class="flex gap-2">
      <input
        v-model="input"
        :disabled="sending || messages.length === 0"
        @keydown.enter.prevent="sendMessage"
        placeholder="Type a message..."
        class="flex-1 px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 disabled:opacity-50"
      />
      <button
        v-if="!sending"
        :disabled="!input.trim() || messages.length === 0"
        class="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 rounded disabled:opacity-50"
        @click="sendMessage"
      >
        Send
      </button>
      <button
        v-else
        class="px-3 py-1.5 text-xs bg-red-800 hover:bg-red-700 rounded"
        @click="cancelChat"
      >
        Stop
      </button>
    </div>
  </div>
</template>
