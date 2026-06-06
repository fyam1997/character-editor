<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editing = ref(false)
const buffer = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)

const rendered = computed(() => {
  if (!props.modelValue) return ''
  return marked(props.modelValue, { breaks: true }) as string
})

function startEdit() {
  editing.value = true
  buffer.value = props.modelValue
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
  <div>
    <div
      v-if="!editing"
      class="min-h-[2em] px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 cursor-text markdown-preview"
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
      class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
    ></textarea>
  </div>
</template>

<style scoped>
.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3,
.markdown-preview h4 {
  font-size: inherit;
  font-weight: 700;
  margin: 0.5em 0 0.25em;
}
.markdown-preview p {
  margin: 0.25em 0;
}
.markdown-preview ul,
.markdown-preview ol {
  padding-left: 1.5em;
  margin: 0.25em 0;
}
.markdown-preview li {
  list-style: disc;
}
.markdown-preview code {
  background: rgb(55 65 81);
  padding: 0.125em 0.25em;
  border-radius: 0.25em;
  font-size: 0.9em;
}
.markdown-preview pre code {
  display: block;
  padding: 0.5em;
  overflow-x: auto;
}
.markdown-preview a {
  color: rgb(96 165 250);
  text-decoration: underline;
}
.markdown-preview blockquote {
  border-left: 3px solid rgb(75 85 99);
  padding-left: 0.75em;
  margin: 0.25em 0;
  color: rgb(156 163 175);
}
.markdown-preview strong {
  font-weight: 700;
}
.markdown-preview em {
  font-style: italic;
}
</style>
