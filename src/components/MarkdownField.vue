<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editing = ref(false)
const buffer = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

function dialogueHtml(text: string): string {
  return text.replace(
    /(["](?:[^"\\]|\\.)*["]|["\u201c][^"\u201d]*["\u201d]|[\u300c][^\u300d]*[\u300d])/g,
    '<span class="dialogue">$1</span>'
  )
}

const rendered = computed(() => {
  if (!props.modelValue) return ''
  const text = dialogueHtml(props.modelValue)
  return marked(text, { breaks: true }) as string
})

function startEdit() {
  editing.value = true
  buffer.value = props.modelValue
  nextTick(() => textarea.value?.focus())
}

function commit() {
  editing.value = false
  emit('update:modelValue', buffer.value)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    editing.value = false
  }
}
</script>

<template>
  <div v-if="readonly" class="markdown-preview" v-html="rendered" />
  <div v-else>
    <div
      v-if="!editing"
      :class="[
        'min-h-[2em] px-2 py-1.5 text-xs bg-gray-800 rounded text-gray-200 cursor-text markdown-preview',
        !modelValue ? 'border border-gray-600' : ''
      ]"
      @click="startEdit"
    >
      <div v-if="!modelValue" class="text-gray-500">Click to edit...</div>
      <div v-else v-html="rendered" />
    </div>
    <textarea
      v-else
      ref="textarea"
      :value="buffer"
      @input="buffer = ($event.target as HTMLTextAreaElement).value"
      @blur="commit"
      @keydown="onKeydown"
      v-grow
      class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
    ></textarea>
  </div>
</template>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  font-size: inherit;
  font-weight: 700;
  margin: 0.5em 0 0.25em;
}
.markdown-preview :deep(p) {
  margin: 0.25em 0;
}
.markdown-preview :deep(ul) {
  padding-left: 1.5em;
  margin: 0.25em 0;
  list-style: disc;
}
.markdown-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0.25em 0;
  list-style: decimal;
}
.markdown-preview :deep(li) {
  margin: 0.125em 0;
}
.markdown-preview :deep(code) {
  background: rgb(55 65 81);
  padding: 0.125em 0.25em;
  border-radius: 0.25em;
  font-size: 0.9em;
}
.markdown-preview :deep(pre code) {
  display: block;
  padding: 0.5em;
  overflow-x: auto;
}
.markdown-preview :deep(a) {
  color: rgb(96 165 250);
  text-decoration: underline;
}
.markdown-preview :deep(blockquote) {
  border-left: 3px solid rgb(75 85 99);
  padding-left: 0.75em;
  margin: 0.25em 0;
  color: rgb(156 163 175);
}
.markdown-preview :deep(strong) {
  font-weight: 700;
}
.markdown-preview :deep(em) {
  font-style: italic;
  color: rgb(156 163 175);
}

.markdown-preview :deep(.dialogue) {
  color: rgb(134 239 172);
}
</style>
