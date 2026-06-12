<script setup lang="ts">
import { ref, watch } from 'vue';
import { useEditorStore } from '../stores/editor';
import CollapsibleSection from '../components/CollapsibleSection.vue';
import MarkdownField from '../components/MarkdownField.vue';
import { useSortable } from '../utils/useSortable';

const emit = defineEmits<{
  startChat: [greeting: string];
  generate: [field: 'greeting', index: number, content: string];
}>();

const store = useEditorStore();
const greetingListRef = ref<HTMLElement | null>(null);

const greetingKeys = ref<number[]>([]);
let nextKey = 0;

watch(
  () => store.cardJson,
  json => {
    if (!json) return;
    const f = json.data.first_mes;
    const g = json.data.alternate_greetings;
    if (f && g.length === 0) {
      g.push(f);
    }
    syncKeys();
  },
  { immediate: true },
);

function syncKeys() {
  const len = store.cardJson?.data.alternate_greetings.length ?? 0;
  while (greetingKeys.value.length < len) {
    greetingKeys.value.push(nextKey++);
  }
  if (greetingKeys.value.length > len) {
    greetingKeys.value.length = len;
  }
}

function reorderGreetings(oldIndex: number, newIndex: number) {
  if (!store.cardJson) return;
  const arr = store.cardJson.data.alternate_greetings;
  const item = arr.splice(oldIndex, 1)[0];
  arr.splice(newIndex, 0, item);
  const key = greetingKeys.value.splice(oldIndex, 1)[0];
  greetingKeys.value.splice(newIndex, 0, key);
  store.cardJson.data.first_mes = arr[0] ?? '';
}

function updateGreeting(index: number, value: string) {
  if (!store.cardJson) return;
  store.cardJson.data.alternate_greetings[index] = value;
  if (index === 0) {
    store.cardJson.data.first_mes = value;
  }
}

function addGreeting(index: number) {
  if (!store.cardJson) return;
  store.cardJson.data.alternate_greetings.splice(index, 0, '');
  greetingKeys.value.splice(index, 0, nextKey++);
}

function removeGreeting(index: number) {
  if (!store.cardJson || store.cardJson.data.alternate_greetings.length <= 1) return;
  store.cardJson.data.alternate_greetings.splice(index, 1);
  greetingKeys.value.splice(index, 1);
  if (index === 0) {
    store.cardJson.data.first_mes = store.cardJson.data.alternate_greetings[0] ?? '';
  }
}

useSortable(greetingListRef, reorderGreetings, { handle: '.drag-handle' });
</script>

<template>
  <CollapsibleSection title="Greetings">
    <div class="flex items-center gap-2 py-1">
      <div class="flex-1 h-px bg-gray-800 ml-8"></div>
      <button
        class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full"
        title="Add greeting here"
        @click="addGreeting(0)"
      >
        +
      </button>
      <div class="flex-1 h-px bg-gray-800 mr-8"></div>
    </div>
    <div
      v-if="!store.cardJson || store.cardJson.data.alternate_greetings.length === 0"
      class="text-xs text-gray-600 py-2"
    >
      No greetings yet.
    </div>
    <div ref="greetingListRef" class="relative">
      <TransitionGroup name="list">
        <div
          v-for="(greeting, index) in store.cardJson?.data.alternate_greetings ?? []"
          :key="greetingKeys[index]"
        >
          <div class="border border-gray-700 rounded p-2">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1">
                <span
                  class="drag-handle cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 select-none"
                  >⠿</span
                >
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="px-1.5 py-0.5 text-xs rounded text-yellow-300 hover:bg-yellow-900/40"
                  title="Generate"
                  @click.stop="emit('generate', 'greeting', index, greeting)"
                >
                  ✨
                </button>
                <button
                  class="px-2 py-0.5 text-xs rounded text-green-200"
                  :class="
                    (greeting ?? '').trim()
                      ? 'bg-green-800 hover:bg-green-700'
                      : 'bg-green-900 opacity-50 cursor-default'
                  "
                  :disabled="!(greeting ?? '').trim()"
                  @click="emit('startChat', greeting)"
                >
                  ▶ Start Chat
                </button>
                <button
                  class="text-xs text-gray-500 hover:text-red-400 disabled:opacity-0"
                  :disabled="(store.cardJson?.data.alternate_greetings.length ?? 0) <= 1"
                  @click="removeGreeting(index)"
                >
                  ✕
                </button>
              </div>
            </div>
            <MarkdownField
              :model-value="greeting"
              @update:model-value="(v: string) => updateGreeting(index, v)"
            />
          </div>
          <div class="flex items-center gap-2 pt-2 pb-2">
            <div class="flex-1 h-px bg-gray-800 ml-8"></div>
            <button
              class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-full"
              title="Add greeting here"
              @click="addGreeting(index + 1)"
            >
              +
            </button>
            <div class="flex-1 h-px bg-gray-800 mr-8"></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
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
