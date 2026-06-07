<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { streamChat } from '../utils/api'
import { assembleGeneratePrompt, getDefaultPrompt, loadPromptMemory, savePromptMemory, clearPromptMemory } from '../utils/generate'
import type { GenerateField, GenerateMode } from '../utils/generate'
import MarkdownField from './MarkdownField.vue'

const props = defineProps<{
  visible: boolean
  field: GenerateField
  index?: number
  content: string
}>()

const emit = defineEmits<{
  close: []
  result: [value: string]
}>()

const store = useEditorStore()

const FIELD_LABELS: Record<GenerateField, string> = {
  description: 'Description',
  personality: 'Personality',
  scenario: 'Scenario',
  mes_example: 'Example Chat',
  greeting: 'Greeting',
  lore: 'Lore Entry',
}

const mode = computed<GenerateMode>(() => props.content.trim() ? 'polish' : 'generate')
const modeLabel = computed(() => mode.value === 'generate' ? 'Generate' : 'Improve')
const fieldLabel = computed(() => {
  if (props.field === 'lore' && props.index !== undefined) {
    const entry = store.cardJson?.data.character_book?.entries[props.index]
    const name = entry?.name || entry?.keys?.join(', ') || `Entry ${(props.index ?? 0) + 1}`
    return `Lore: ${name}`
  }
  return FIELD_LABELS[props.field]
})

const greetingSelections = ref<boolean[]>([])
const loreSelections = ref<boolean[]>([])
const userPrompt = ref('')
const theme = ref('')
const resultText = ref('')
const generating = ref(false)
const error = ref('')
const done = ref(false)

const greetings = computed(() => store.cardJson?.data.alternate_greetings ?? [])
const loreEntries = computed(() => store.cardJson?.data.character_book?.entries ?? [])

const showResultReview = computed(() => resultText.value.trim() !== '' && !generating.value && done.value)
const hasCharContext = computed(() => {
  const d = store.cardJson?.data
  return !!(d?.description || d?.personality || d?.scenario || d?.mes_example)
})

function randomPick(n: number, max: number): number[] {
  const indices = Array.from({ length: max }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, Math.min(n, max))
}

function initSelections() {
  const gLen = greetings.value.length
  greetingSelections.value = Array.from({ length: gLen }, () => false)
  for (const idx of randomPick(3, gLen)) {
    greetingSelections.value[idx] = true
  }

  const lLen = loreEntries.value.length
  loreSelections.value = Array.from({ length: lLen }, () => false)
  for (const idx of randomPick(3, lLen)) {
    loreSelections.value[idx] = true
  }
}

function memoryKey(prefix: string): string {
  return `${prefix}:${props.field}:${mode.value}`
}

function initPrompt() {
  const savedPrompt = loadPromptMemory(props.field, mode.value)
  if (savedPrompt) {
    userPrompt.value = savedPrompt
  } else {
    let keys: string | undefined
    if (props.field === 'lore' && props.index !== undefined) {
      const entry = store.cardJson?.data.character_book?.entries[props.index]
      if (entry) keys = entry.keys?.join(', ') || undefined
    }
    userPrompt.value = getDefaultPrompt(props.field, mode.value, keys)
  }

  try {
    const savedTheme = localStorage.getItem(memoryKey('generateTheme'))
    theme.value = savedTheme ?? ''
  } catch { theme.value = '' }

  resultText.value = ''
  error.value = ''
  generating.value = false
  done.value = false
}

watch(() => props.visible, (v) => {
  if (v) {
    initSelections()
    initPrompt()
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible && !generating.value) {
    handleClose()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function handleReset() {
  let keys: string | undefined
  if (props.field === 'lore' && props.index !== undefined) {
    const entry = store.cardJson?.data.character_book?.entries[props.index]
    if (entry) keys = entry.keys?.join(', ') || undefined
  }
  userPrompt.value = getDefaultPrompt(props.field, mode.value, keys)
  clearPromptMemory(props.field, mode.value)
}

async function handleGenerate() {
  if (!store.cardJson) return

  savePromptMemory(props.field, mode.value, userPrompt.value)
  try { localStorage.setItem(memoryKey('generateTheme'), theme.value) } catch {}

  generating.value = true
  error.value = ''
  resultText.value = ''
  done.value = false

  const selectedGreetings: number[] = []
  for (let i = 0; i < greetingSelections.value.length; i++) {
    if (greetingSelections.value[i]) selectedGreetings.push(i)
  }

  const selectedLore: number[] = []
  for (let i = 0; i < loreSelections.value.length; i++) {
    if (loreSelections.value[i]) selectedLore.push(i)
  }

  const messages = assembleGeneratePrompt(
    store.cardJson,
    mode.value,
    props.content,
    selectedGreetings,
    selectedLore,
    userPrompt.value,
    theme.value,
  )

  try {
    const gen = streamChat(
      store.apiConfig.baseUrl,
      store.apiConfig.apiKey,
      store.apiConfig.model,
      messages,
    )

    for await (const chunk of gen) {
      if (chunk.type === 'text' && chunk.content) {
        resultText.value += chunk.content
      } else if (chunk.type === 'error') {
        error.value = chunk.content ?? 'Unknown error'
        generating.value = false
        return
      } else if (chunk.type === 'done') {
        done.value = true
      }
    }
  } catch (e) {
    error.value = `Request failed: ${(e as Error)?.message ?? e}`
  }

  generating.value = false
}

function handleConfirm() {
  if (resultText.value.trim()) {
    emit('result', resultText.value)
  }
}

function handleDiscard() {
  resultText.value = ''
  done.value = false
  error.value = ''
}

function handleClose() {
  if (generating.value) return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <h3 class="text-sm font-bold text-gray-200">{{ modeLabel }} {{ fieldLabel }}</h3>
          <button class="text-gray-500 hover:text-gray-300 text-lg leading-none" @click="handleClose">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="hasCharContext" class="space-y-1 bg-gray-800 rounded">
            <label class="text-xs text-gray-400 block mb-2">Character Context</label>
            <div v-if="store.cardJson?.data.description" class="text-xs text-gray-300 flex gap-2">
              <span class="font-medium shrink-0">Description</span>
              <span class="truncate text-gray-500">— {{ store.cardJson.data.description.slice(0, 80) }}</span>
            </div>
            <div v-if="store.cardJson?.data.personality" class="text-xs text-gray-300 flex gap-2">
              <span class="font-medium shrink-0">Personality</span>
              <span class="truncate text-gray-500">— {{ store.cardJson.data.personality.slice(0, 80) }}</span>
            </div>
            <div v-if="store.cardJson?.data.scenario" class="text-xs text-gray-300 flex gap-2">
              <span class="font-medium shrink-0">Scenario</span>
              <span class="truncate text-gray-500">— {{ store.cardJson.data.scenario.slice(0, 80) }}</span>
            </div>
            <div v-if="store.cardJson?.data.mes_example" class="text-xs text-gray-300 flex gap-2">
              <span class="font-medium shrink-0">Example Chat</span>
              <span class="truncate text-gray-500">— {{ store.cardJson.data.mes_example.slice(0, 80) }}</span>
            </div>
          </div>

          <div v-if="greetings.length > 0">
            <label class="text-xs text-gray-400 block mb-2">Greetings</label>
            <div class="space-y-1 overflow-hidden">
              <label v-for="(g, i) in greetings" :key="i" class="flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" v-model="greetingSelections[i]" />
                <span class="truncate">{{ g.slice(0, 80) }}</span>
              </label>
            </div>
          </div>

          <div v-if="loreEntries.length > 0">
            <label class="text-xs text-gray-400 block mb-2">Lore Entries</label>
            <div class="space-y-1 overflow-y-auto">
              <label v-for="(e, i) in loreEntries" :key="i" class="flex items-center gap-2 text-xs text-gray-300">
                <input type="checkbox" v-model="loreSelections[i]" />
                <span>{{ e.name || e.comment || e.keys?.join(', ') || `Entry ${i + 1}` }}</span>
                <span v-if="e.content" class="truncate text-gray-500">— {{ e.content.slice(0, 50) }}</span>
              </label>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs text-gray-400">Prompt</label>
              <button class="text-xs text-gray-500 hover:text-gray-300" @click="handleReset">↺ Reset</button>
            </div>
            <MarkdownField
              :model-value="userPrompt"
              :disabled="generating"
            />
          </div>

          <div>
            <label class="text-xs text-gray-400 block mb-1">Theme</label>
            <MarkdownField
              :model-value="theme"
              :disabled="generating"
            />
          </div>

          <button
            class="w-full px-3 py-1.5 text-xs rounded disabled:opacity-50"
            :class="generating ? 'bg-blue-900 text-blue-300 cursor-wait' : 'bg-blue-700 hover:bg-blue-600 text-blue-100'"
            :disabled="generating"
            @click="handleGenerate"
          >{{ generating ? 'Generating...' : 'Generate' }}</button>

          <div v-if="resultText" class="relative">
            <label class="text-xs text-gray-400 block mb-2">Result</label>
            <MarkdownField
              :model-value="resultText"
              :disabled="generating"
              :readonly="generating"
            />
          </div>

          <div v-if="error" class="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded">{{ error }}</div>

          <div v-if="resultText" class="w-full flex items-center gap-2">
            <button
              class="flex-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
              @click="handleDiscard"
              :disabled="generating"
            >Discard</button>
            <button
              v-if="showResultReview"
              class="flex-1 px-3 py-1.5 text-xs rounded bg-green-700 hover:bg-green-600 text-green-100"
              @click="handleConfirm"
            >Confirm</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
