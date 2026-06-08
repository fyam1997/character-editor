<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import type { CharacterBookEntry } from '../types'
import EntryCard from '../components/EntryCard.vue'
import CollapsibleSection from '../components/CollapsibleSection.vue'
import ExtensionsTable from '../components/ExtensionsTable.vue'
import { useSortable } from '../utils/useSortable'

const store = useEditorStore()
const entryListRef = ref<HTMLElement | null>(null)

const emit = defineEmits<{
  generate: [field: 'lore', index: number, content: string]
}>()

const entryKeys = ref<number[]>([])
let nextEntryKey = 0

const book = computed(() => {
  if (!store.cardJson) return null
  if (!store.cardJson.data.character_book) {
    store.cardJson.data.character_book = {
      extensions: {},
      entries: [],
    }
  }
  return store.cardJson.data.character_book
})

function syncKeys() {
  const len = book.value?.entries.length ?? 0
  while (entryKeys.value.length < len) {
    entryKeys.value.push(nextEntryKey++)
  }
  if (entryKeys.value.length > len) {
    entryKeys.value.length = len
  }
}

watch(() => book.value?.entries.length, syncKeys, { immediate: true })

function addEntry(index: number) {
  if (!book.value) return
  const entry: CharacterBookEntry = {
    keys: [],
    content: '',
    extensions: {},
    enabled: true,
    insertion_order: 100,
  }
  book.value.entries.splice(index, 0, entry)
  entryKeys.value.splice(index, 0, nextEntryKey++)
}

function sortInsertionOrder() {
  if (!book.value) return
  book.value.entries.forEach((e, i) => {
    e.insertion_order = 100 - i
  })
}

function removeEntry(index: number) {
  if (!book.value) return
  book.value.entries.splice(index, 1)
  entryKeys.value.splice(index, 1)
}

function moveEntry(index: number, dir: -1 | 1) {
  if (!book.value) return
  const to = index + dir
  if (to < 0 || to >= book.value.entries.length) return
  const entries = book.value.entries
  ;[entries[index], entries[to]] = [entries[to], entries[index]]
  ;[entryKeys.value[index], entryKeys.value[to]] = [entryKeys.value[to], entryKeys.value[index]]
}

function reorderEntries(oldIndex: number, newIndex: number) {
  if (!book.value) return
  const entries = book.value.entries
  const item = entries.splice(oldIndex, 1)[0]
  entries.splice(newIndex, 0, item)
  const key = entryKeys.value.splice(oldIndex, 1)[0]
  entryKeys.value.splice(newIndex, 0, key)
  sortInsertionOrder()
}

useSortable(entryListRef, reorderEntries, { handle: '.drag-handle' })
</script>

<template>
  <CollapsibleSection title="Character Lore Book">
    <div v-if="!book" class="text-xs text-gray-600 py-2">No card selected</div>
    <template v-else>
      <div class="grid grid-cols-2 gap-2 mb-3 p-3 bg-gray-900 rounded border border-gray-700">
        <div>
          <label class="text-xs text-gray-400 block mb-0.5">Book Name</label>
          <input :value="book.name ?? ''" @input="book.name = ($event.target as HTMLInputElement).value || undefined" class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-0.5">Description</label>
          <input :value="book.description ?? ''" @input="book.description = ($event.target as HTMLInputElement).value || undefined" class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-0.5">Scan Depth</label>
          <input :value="book.scan_depth ?? ''" @input="book.scan_depth = Number(($event.target as HTMLInputElement).value) || undefined" type="number" class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-0.5">Token Budget</label>
          <input :value="book.token_budget ?? ''" @input="book.token_budget = Number(($event.target as HTMLInputElement).value) || undefined" type="number" class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200" />
        </div>
        <div class="flex justify-items-center pb-1">
          <label class="flex items-center gap-1 text-xs text-gray-400">
            <input type="checkbox" :checked="book.recursive_scanning ?? false" @change="book.recursive_scanning = ($event.target as HTMLInputElement).checked || undefined" />
            Recursive Scanning
          </label>
          <button
              class="px-2 py-0.5 ml-2 text-xs bg-gray-800 hover:bg-gray-700 rounded"
              @click="sortInsertionOrder"
          >
            Sort Insertion Order
          </button>

        </div>
      </div>
      <details class="mt-2 group">
        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-300 select-none">Book Extensions</summary>
        <div class="mt-1">
          <ExtensionsTable v-model="book.extensions" />
        </div>
      </details>
      <div class="flex items-center gap-2 py-1">
        <div class="flex-1 h-px bg-gray-800 ml-8"></div>
        <button
          class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full"
          title="Add entry here"
          @click="addEntry(0)"
        >+</button>
        <div class="flex-1 h-px bg-gray-800 mr-8"></div>
      </div>
      <div v-if="book.entries.length === 0" class="text-xs text-gray-600 py-2">
        No lorebook entries. Add one to define character-specific knowledge.
      </div>
      <div ref="entryListRef" class="relative">
        <TransitionGroup name="list">
          <div
            v-for="(entry, index) in book.entries"
            :key="entryKeys[index]"
          >
            <EntryCard
              :entry="entry"
              :index="index"
              :total="book.entries.length"
              @remove="removeEntry(index)"
              @move="moveEntry(index, $event)"
              @generate="(field, idx, content) => emit('generate', field, idx, content)"
            />
            <div class="flex items-center gap-2 pt-2 pb-2">
              <div class="flex-1 h-px bg-gray-800 ml-8"></div>
              <button
                class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full"
                title="Add entry here"
                @click="addEntry(index + 1)"
              >+</button>
              <div class="flex-1 h-px bg-gray-800 mr-8"></div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>
  </CollapsibleSection>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-leave-active {
  position: absolute;
  width: 100%;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
.list-move {
  transition: transform 0.25s ease;
}
</style>
