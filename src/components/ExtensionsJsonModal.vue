<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  value: string;
  title: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [value: string];
}>();

const buffer = ref('');
const error = ref('');

watch(
  () => props.visible,
  v => {
    if (v) {
      buffer.value = props.value;
      error.value = '';
    }
  },
);

function validate() {
  try {
    JSON.parse(buffer.value);
    error.value = '';
    return true;
  } catch (e) {
    error.value = `Invalid JSON: ${(e as Error).message}`;
    return false;
  }
}

function handleSave() {
  if (!validate()) return;
  emit('save', buffer.value);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('close');
  }
}

function handleBgClick() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="handleBgClick"
    >
      <div
        class="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col"
        @keydown="handleKeydown"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
          <h3 class="text-sm font-bold text-gray-200">Edit JSON: {{ title }}</h3>
          <button
            class="text-gray-500 hover:text-gray-300 text-lg leading-none"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <textarea
            v-model="buffer"
            class="w-full min-h-[200px] px-3 py-2 text-xs font-mono bg-gray-800 border border-gray-600 rounded text-gray-200 resize-y"
            spellcheck="false"
          />
          <div v-if="error" class="text-xs text-red-400 bg-red-900/30 px-3 py-2 rounded">
            {{ error }}
          </div>
        </div>
        <div
          class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 shrink-0"
        >
          <button
            class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-600 rounded text-blue-100"
            @click="handleSave"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
