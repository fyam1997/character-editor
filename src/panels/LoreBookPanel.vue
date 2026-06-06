<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEditorStore } from '../stores/editor'
import type { CharacterBookEntry } from '../types'
import EntryCard from '../components/EntryCard.vue'
import CollapsibleSection from '../components/CollapsibleSection.vue'
import { useSortable } from '../utils/useSortable'

const store = useEditorStore()
const entryListRef = ref<HTMLElement | null>(null)

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

function addEntry() {
  if (!book.value) return
  const entry: CharacterBookEntry = {
    keys: [],
    content: '',
    extensions: {},
    enabled: true,
    insertion_order: 100,
  }
  book.value.entries.push(entry)
  entryKeys.value.push(nextEntryKey++)
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
}

useSortable(entryListRef, reorderEntries, { handle: '.drag-handle' })
</script>

<template>
  <CollapsibleSection title="Character Lore Book">
    <template #actions>
      <button
        class="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
        @click="addEntry"
      >
        + Add Entry
      </button>
    </template>
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
        <div class="flex items-end pb-1">
          <label class="flex items-center gap-1 text-xs text-gray-400">
            <input type="checkbox" :checked="book.recursive_scanning ?? false" @change="book.recursive_scanning = ($event.target as HTMLInputElement).checked || undefined" />
            Recursive Scanning
          </label>
        </div>
      </div>
      <div ref="entryListRef" class="space-y-2">
        <EntryCard
          v-for="(entry, index) in book.entries"
          :key="entryKeys[index]"
          :entry="entry"
          :index="index"
          :total="book.entries.length"
          @remove="removeEntry(index)"
          @move="moveEntry(index, $event)"
        />
      </div>
      <div v-if="book.entries.length === 0" class="text-xs text-gray-600 py-2">
        No lorebook entries. Add one to define character-specific knowledge.
      </div>
    </template>
  </CollapsibleSection>
</template>
