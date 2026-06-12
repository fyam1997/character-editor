<script setup lang="ts">
import { ref, watch } from 'vue';
import type { CharacterBookEntry } from '../types';
import MarkdownField from './MarkdownField.vue';
import ExtensionsTable from './ExtensionsTable.vue';

const props = defineProps<{
  entry: CharacterBookEntry;
  index: number;
  total: number;
}>();

const emit = defineEmits<{
  remove: [];
  move: [dir: -1 | 1];
  generate: [field: 'lore', index: number, content: string];
}>();

const showAdvanced = ref(false);
const rawKeys = ref('');
const rawSecKeys = ref('');

watch(
  () => props.entry.keys,
  k => {
    rawKeys.value = k?.join(', ') ?? '';
  },
  { immediate: true },
);

watch(
  () => props.entry.secondary_keys,
  k => {
    rawSecKeys.value = k?.join(', ') ?? '';
  },
  { immediate: true },
);

function commitKeys() {
  (props.entry as CharacterBookEntry).keys = rawKeys.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function commitSecKeys() {
  (props.entry as CharacterBookEntry).secondary_keys = rawSecKeys.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function update<K extends keyof CharacterBookEntry>(key: K, value: CharacterBookEntry[K]) {
  (props.entry as CharacterBookEntry)[key] = value;
}
</script>

<template>
  <div class="border border-gray-700 rounded">
    <div class="flex items-center gap-1 px-3 py-1.5 bg-gray-800">
      <span
        class="drag-handle cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 select-none"
        >⠿</span
      >
      <span class="text-xs text-gray-300 ml-2 truncate flex-1">
        {{ entry.name ?? entry.comment ?? '' }}
      </span>
      <label class="flex items-center gap-1 text-xs text-gray-400 ml-auto mr-2">
        <input
          type="checkbox"
          :checked="entry.enabled"
          @change="update('enabled', ($event.target as HTMLInputElement).checked)"
        />
        On
      </label>
      <button
        class="text-xs text-gray-500 hover:text-blue-400"
        @click="showAdvanced = !showAdvanced"
      >
        {{ showAdvanced ? 'Basic' : 'Advanced' }}
      </button>
      <button class="text-xs text-gray-500 hover:text-red-400 ml-1" @click="emit('remove')">
        ✕
      </button>
    </div>
    <div class="p-3 space-y-2">
      <div>
        <label class="text-xs text-gray-400 block mb-0.5">Keys (comma-separated)</label>
        <input
          v-model="rawKeys"
          @blur="commitKeys"
          @keydown.enter="commitKeys"
          class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
        />
      </div>
      <div>
        <div class="flex items-center justify-between mb-0.5">
          <label class="text-xs text-gray-400">Content</label>
          <button
            class="px-1.5 py-0.5 text-xs rounded text-yellow-300 hover:bg-yellow-900/40"
            title="Generate"
            @click="emit('generate', 'lore', props.index, entry.content)"
          >
            ✨
          </button>
        </div>
        <MarkdownField
          :model-value="entry.content"
          @update:model-value="(v: string) => update('content', v)"
        />
      </div>

      <template v-if="showAdvanced">
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-gray-400 block mb-0.5">Name</label>
            <input
              :value="entry.name ?? ''"
              @input="update('name', ($event.target as HTMLInputElement).value || undefined)"
              class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400 block mb-0.5">ID</label>
            <input
              :value="entry.id ?? ''"
              @input="update('id', Number(($event.target as HTMLInputElement).value) || undefined)"
              type="number"
              class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400 block mb-0.5">Priority</label>
            <input
              :value="entry.priority ?? ''"
              @input="
                update('priority', Number(($event.target as HTMLInputElement).value) || undefined)
              "
              type="number"
              class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-0.5">Comment</label>
          <input
            :value="entry.comment ?? ''"
            @input="update('comment', ($event.target as HTMLInputElement).value || undefined)"
            class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="text-xs text-gray-400 block mb-0.5">Insertion Order</label>
            <input
              :value="entry.insertion_order"
              @input="
                update('insertion_order', Number(($event.target as HTMLInputElement).value) || 100)
              "
              type="number"
              class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
          <div class="flex items-end pb-1">
            <label class="flex items-center gap-1 text-xs text-gray-400">
              <input
                type="checkbox"
                :checked="entry.case_sensitive ?? false"
                @change="update('case_sensitive', ($event.target as HTMLInputElement).checked)"
              />
              Case Sensitive
            </label>
          </div>
          <div class="flex items-end pb-1">
            <label class="flex items-center gap-1 text-xs text-gray-400">
              <input
                type="checkbox"
                :checked="entry.constant ?? false"
                @change="update('constant', ($event.target as HTMLInputElement).checked)"
              />
              Constant
            </label>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-gray-400 block mb-0.5">Position</label>
            <select
              :value="entry.position ?? ''"
              @change="
                update(
                  'position',
                  (($event.target as HTMLSelectElement).value as 'before_char' | 'after_char') ||
                    undefined,
                )
              "
              class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            >
              <option value="">Default</option>
              <option value="before_char">Before Character</option>
              <option value="after_char">After Character</option>
            </select>
          </div>
          <div class="flex items-end pb-1">
            <label class="flex items-center gap-1 text-xs text-gray-400">
              <input
                type="checkbox"
                :checked="entry.selective ?? false"
                @change="update('selective', ($event.target as HTMLInputElement).checked)"
              />
              Selective
            </label>
          </div>
        </div>
        <div v-if="entry.selective">
          <label class="text-xs text-gray-400 block mb-0.5">Secondary Keys (comma-separated)</label>
          <input
            v-model="rawSecKeys"
            @blur="commitSecKeys"
            @keydown.enter="commitSecKeys"
            class="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <details class="mt-2 group">
          <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-300 select-none">
            Entry Extensions
          </summary>
          <div class="mt-1">
            <ExtensionsTable v-model="entry.extensions" />
          </div>
        </details>
      </template>
    </div>
  </div>
</template>
