<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ExtensionsJsonModal from './ExtensionsJsonModal.vue'

const props = defineProps<{
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

interface ExtensionRow {
  id: number
  key: string
  type: 'string' | 'number' | 'boolean' | 'json'
  value: unknown
}

let nextId = 0

const rows = ref<ExtensionRow[]>([])
const jsonRowId = ref<number | null>(null)
const jsonBuffer = ref('')
let selfChange = false

const jsonRow = computed(() => rows.value.find(r => r.id === jsonRowId.value))

function classify(v: unknown): 'string' | 'number' | 'boolean' | 'json' {
  if (typeof v === 'string') return 'string'
  if (typeof v === 'number') return 'number'
  if (typeof v === 'boolean') return 'boolean'
  return 'json'
}

function toRows(record: Record<string, unknown>): ExtensionRow[] {
  return Object.entries(record).map(([key, value]) => ({
    id: nextId++,
    key,
    type: classify(value),
    value,
  }))
}

function fromRows(rows: ExtensionRow[]): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const row of rows) {
    if (!row.key) continue
    if (row.type === 'json') {
      if (typeof row.value === 'string') {
        try {
          record[row.key] = JSON.parse(row.value)
        } catch {
          record[row.key] = row.value
        }
      } else {
        record[row.key] = row.value
      }
    } else {
      record[row.key] = row.value
    }
  }
  return record
}

function syncRows() {
  rows.value = toRows(props.modelValue)
}

watch(() => props.modelValue, () => {
  if (selfChange) {
    selfChange = false
    return
  }
  syncRows()
}, { deep: true, immediate: true })

function emitValue() {
  selfChange = true
  emit('update:modelValue', fromRows(rows.value))
}

function emitIfKeyed(row: ExtensionRow) {
  if (row.key) emitValue()
}

function addRow() {
  rows.value.push({
    id: nextId++,
    key: '',
    type: 'string',
    value: '',
  })
}

function removeRow(id: number) {
  const idx = rows.value.findIndex(r => r.id === id)
  if (idx !== -1) {
    rows.value.splice(idx, 1)
    emitValue()
  }
}

function openJsonEditor(row: ExtensionRow) {
  const raw = row.value
  jsonBuffer.value = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
  jsonRowId.value = row.id
}

function saveJson(json: string) {
  const row = rows.value.find(r => r.id === jsonRowId.value)
  if (row) {
    row.value = json
    emitIfKeyed(row)
  }
  jsonRowId.value = null
}

function closeJson() {
  jsonRowId.value = null
}

function onTypeChange(row: ExtensionRow) {
  if (row.type === 'string') row.value = typeof row.value === 'string' ? row.value : String(row.value ?? '')
  else if (row.type === 'number') row.value = Number(row.value) || 0
  else if (row.type === 'boolean') row.value = row.value === true || row.value === 'true' || false
  else if (row.type === 'json') {
    try {
      row.value = JSON.stringify(row.value, null, 2)
    } catch {
      row.value = '{}'
    }
  }
}
</script>

<template>
  <div>
    <div v-if="rows.length === 0" class="text-xs text-gray-600 py-2">No extensions</div>
    <div v-else class="space-y-1">
      <div v-for="row in rows" :key="row.id" class="flex items-center gap-1">
        <input
          :value="row.key"
          @input="row.key = ($event.target as HTMLInputElement).value; emitIfKeyed(row)"
          placeholder="key"
          class="w-32 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 font-mono"
        />
        <select
          :value="row.type"
          @change="row.type = ($event.target as HTMLSelectElement).value as ExtensionRow['type']; onTypeChange(row); emitIfKeyed(row)"
          class="w-20 px-1 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="json">JSON</option>
        </select>
        <template v-if="row.type === 'string'">
          <input
            :value="row.value as string"
            @input="row.value = ($event.target as HTMLInputElement).value; emitIfKeyed(row)"
            class="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 font-mono"
          />
        </template>
        <template v-else-if="row.type === 'number'">
          <input
            :value="row.value as number"
            @input="row.value = Number(($event.target as HTMLInputElement).value) || 0; emitIfKeyed(row)"
            type="number"
            class="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 font-mono"
          />
        </template>
        <template v-else-if="row.type === 'boolean'">
          <label class="flex items-center gap-1 text-xs text-gray-400 flex-1">
            <input
              type="checkbox"
              :checked="row.value === true || row.value === 'true'"
              @change="row.value = ($event.target as HTMLInputElement).checked; emitIfKeyed(row)"
            />
            {{ row.value === true || row.value === 'true' ? 'true' : 'false' }}
          </label>
        </template>
        <template v-else>
          <button
            class="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-400 hover:text-gray-200 text-left font-mono truncate"
            @click="openJsonEditor(row)"
          >
            {{ typeof row.value === 'string' ? row.value.slice(0, 60) : JSON.stringify(row.value).slice(0, 60) }}
          </button>
        </template>
        <button
          class="px-1.5 py-1 text-xs text-gray-500 hover:text-red-400"
          @click="removeRow(row.id)"
        >✕</button>
      </div>
    </div>
    <button
      class="mt-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 rounded"
      @click="addRow"
    >+ Add Extension</button>

    <ExtensionsJsonModal
      :visible="jsonRowId !== null"
      :value="jsonBuffer"
      :title="jsonRow?.key ?? ''"
      @close="closeJson"
      @save="saveJson"
    />
  </div>
</template>
