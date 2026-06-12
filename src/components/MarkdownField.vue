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
const textarea = ref<HTMLTextAreaElement | null>(null)
const contentEl = ref<HTMLElement | null>(null)
const initialized = ref(false)

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

function startEdit(event: MouseEvent) {
  let clickPos = -1

  if (contentEl.value) {
    try {
      let range: Range | null = document.caretRangeFromPoint(event.clientX, event.clientY)
      if (!range) {
        const pos = document.caretPositionFromPoint(event.clientX, event.clientY)
        if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true) }
      }
      if (range && contentEl.value.contains(range.startContainer)) {
        const blockTags = new Set(['P','H1','H2','H3','H4','H5','H6','LI','BLOCKQUOTE','PRE','DIV','HR','TD','TH'])
        const target = range.startContainer
        const targetOff = range.startOffset

        let row = 0
        let col = 0
        let inNewBlock = true
        let afterBr = false

        const walker = document.createTreeWalker(contentEl.value, NodeFilter.SHOW_ALL)
        let node: Node | null = walker.currentNode
        while (node) {
          if (node === contentEl.value) { node = walker.nextNode(); continue }
          const isTarget = node === target
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = (node as Element).tagName
            if (tag === 'BR') { row++; col = 0; afterBr = true }
            else if (blockTags.has(tag)) { inNewBlock = true; col = 0; afterBr = false }
          }
          if (node.nodeType === Node.TEXT_NODE) {
            const text = (node as Text).data
            if (text.trim() === '') { node = walker.nextNode(); continue }
            const parts = text.split('\n')
            let effectiveLines = parts.length
            if (effectiveLines > 1 && parts[effectiveLines - 1] === '') effectiveLines--

            if (isTarget) {
              let remaining = targetOff
              let lineIdx = 0
              while (lineIdx < effectiveLines && remaining > parts[lineIdx].length) {
                remaining -= parts[lineIdx].length + 1
                lineIdx++
              }
              row += lineIdx
              col = remaining
            } else if (inNewBlock && effectiveLines > 0 && parts.slice(0, effectiveLines).some(p => p.length > 0)) {
              row += effectiveLines
              col = parts[effectiveLines - 1].length
              inNewBlock = false; afterBr = false
            } else if (afterBr) {
              row += effectiveLines - 1
              col = parts[effectiveLines - 1].length
              afterBr = false
            } else if (effectiveLines > 1) {
              row += effectiveLines - 1
              col = parts[effectiveLines - 1].length
            } else {
              col += text.length
            }
          }
          if (isTarget) break
          node = walker.nextNode()
        }

        const sourceLines = props.modelValue.split('\n')
        const visibleToSource: number[] = []
        for (let i = 0; i < sourceLines.length; i++) {
          const l = sourceLines[i]
          if (/^```/.test(l) || /^\s*$/.test(l)) continue
          if (/^(?:[-*_]\s*){3,}$/.test(l.trim())) continue
          visibleToSource.push(i)
        }
        const targetRow = visibleToSource[row] ?? Math.min(row, sourceLines.length - 1)
        const sourceLine = sourceLines[targetRow] || ''

        const prefixMatch = sourceLine.match(/^(\s*#{1,6}\s+|\s*[-*]\s+|\s*\d+\.\s+|\s*>\s?)/)
        const prefixLen = prefixMatch ? prefixMatch[0].length : 0
        const adjustedCol = col + prefixLen

        let pos = 0
        for (let i = 0; i < targetRow; i++) {
          pos += sourceLines[i].length + 1
        }
        pos += Math.min(adjustedCol, sourceLine.length)
        clickPos = Math.min(pos, props.modelValue.length)
      }
    } catch { /* fall through */ }
  }

  editing.value = true
  nextTick(() => {
    const el = textarea.value
    if (!el) return
    if (!initialized.value) {
      el.value = props.modelValue
      initialized.value = true
    }
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
    el.focus()
    if (clickPos >= 0) {
      el.setSelectionRange(clickPos, clickPos)
    }
  })
}

function commit() {
  editing.value = false
  const el = textarea.value
  if (el) {
    emit('update:modelValue', el.value)
  }
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
      v-show="!editing"
      :class="[
        'min-h-[2em] px-2 py-1.5 text-xs bg-gray-800 rounded text-gray-200 cursor-text markdown-preview',
        !modelValue ? 'border border-gray-600' : ''
      ]"
      @click="startEdit"
    >
      <div v-if="!modelValue" class="text-gray-500">Click to edit...</div>
      <div v-else ref="contentEl" v-html="rendered" />
    </div>
    <textarea
      v-show="editing"
      ref="textarea"
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
  color: rgb(209 213 219);
}

.markdown-preview :deep(.dialogue) {
  color: rgb(134 239 172);
}
</style>
