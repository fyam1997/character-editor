<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useEditorStore } from '../stores/editor';
import CollapsibleSection from '../components/CollapsibleSection.vue';
import MarkdownField from '../components/MarkdownField.vue';

const store = useEditorStore();
const rawTags = ref('');
const showPreview = ref(false);
const selectedLang = ref('en');
const newLangCode = ref('');
const showAddLang = ref(false);

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
];

const availableLangs = computed(() => {
  if (!store.cardJson?.data.creator_notes_multilingual) return [];
  return Object.keys(store.cardJson.data.creator_notes_multilingual);
});

function addLanguage() {
  if (!store.cardJson || !newLangCode.value.trim()) return;
  if (!store.cardJson.data.creator_notes_multilingual) {
    store.cardJson.data.creator_notes_multilingual = {};
  }
  store.cardJson.data.creator_notes_multilingual[newLangCode.value.trim()] = '';
  selectedLang.value = newLangCode.value.trim();
  newLangCode.value = '';
  showAddLang.value = false;
}

function removeLanguage(lang: string) {
  if (!store.cardJson?.data.creator_notes_multilingual) return;
  delete store.cardJson.data.creator_notes_multilingual[lang];
  if (selectedLang.value === lang) {
    const keys = Object.keys(store.cardJson.data.creator_notes_multilingual);
    selectedLang.value = keys[0] ?? 'en';
  }
}

function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

function openUrl(url: string) {
  window.open(url, '_blank');
}

const previewUrl = computed(() => {
  if (!store.pngBlob) return '';
  return URL.createObjectURL(store.pngBlob);
});

watch(
  () => store.cardJson?.data.tags,
  t => {
    rawTags.value = t?.join(', ') ?? '';
  },
  { immediate: true },
);

function commitTags() {
  if (!store.cardJson) return;
  store.cardJson.data.tags = rawTags.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function pickImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png';
  input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    store.updatePng(new Blob([await file.arrayBuffer()], { type: 'image/png' }));
  };
}
</script>

<template>
  <CollapsibleSection title="Info" v-if="store.cardJson">
    <div class="grid grid-cols-3 gap-4">
      <div class="flex flex-col gap-1">
        <div
          class="flex-1 border border-gray-700 rounded-lg overflow-hidden bg-gray-900 cursor-pointer flex items-center justify-center"
          @click="previewUrl ? (showPreview = true) : pickImage()"
        >
          <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
          <span v-else class="text-2xl text-gray-600">+</span>
        </div>
        <button
          class="w-full py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
          @click="pickImage"
        >
          Upload
        </button>
      </div>
      <div class="col-span-2 flex flex-col gap-3">
        <div>
          <label class="text-xs text-gray-400 block mb-1">Name</label>
          <input
            v-model="store.cardJson.data.name"
            class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-400 block mb-1">Creator</label>
            <input
              v-model="store.cardJson.data.creator"
              class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
          <div>
            <label class="text-xs text-gray-400 block mb-1">Version</label>
            <input
              v-model="store.cardJson.data.character_version"
              class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
            />
          </div>
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Nickname</label>
          <input
            v-model="store.cardJson.data.nickname"
            placeholder="Optional"
            class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Tags (comma-separated)</label>
          <input
            v-model="rawTags"
            @blur="commitTags"
            @keydown.enter="commitTags"
            placeholder="tag1, tag2, tag3"
            class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs text-gray-400">Creator Notes</label>
            <div v-if="availableLangs.length === 0" class="flex items-center gap-1">
              <select
                v-model="selectedLang"
                class="px-1 py-0.5 text-[10px] bg-gray-800 border border-gray-600 rounded text-gray-300"
              >
                <option v-for="opt in languageOptions" :key="opt.code" :value="opt.code">
                  {{ opt.label }}
                </option>
              </select>
              <button
                class="text-[10px] px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                @click="addLanguage"
              >
                Add
              </button>
            </div>
          </div>
          <template v-if="availableLangs.length > 0">
            <div class="flex items-center gap-1 mb-1 flex-wrap">
              <button
                v-for="lang in availableLangs"
                :key="lang"
                class="text-[10px] px-1.5 py-0.5 rounded"
                :class="selectedLang === lang ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                @click="selectedLang = lang"
              >
                {{ lang }}
              </button>
              <button
                class="text-[10px] px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                @click="showAddLang = !showAddLang"
              >
                +
              </button>
            </div>
            <div v-if="showAddLang" class="flex items-center gap-1 mb-1">
              <input
                v-model="newLangCode"
                placeholder="lang code (e.g. fr)"
                class="flex-1 px-1.5 py-0.5 text-[10px] bg-gray-800 border border-gray-600 rounded text-gray-200"
                @keydown.enter="addLanguage"
              />
              <button
                class="text-[10px] px-1.5 py-0.5 bg-green-800 hover:bg-green-700 rounded text-green-200"
                @click="addLanguage"
              >
                ✓
              </button>
            </div>
            <div class="flex items-center gap-1 mb-1">
              <MarkdownField
                v-if="store.cardJson?.data.creator_notes_multilingual?.[selectedLang] !== undefined"
                :model-value="store.cardJson.data.creator_notes_multilingual[selectedLang] ?? ''"
                @update:model-value="(v: string) => { if (store.cardJson?.data.creator_notes_multilingual) store.cardJson.data.creator_notes_multilingual[selectedLang] = v; }"
              />
              <MarkdownField
                v-else
                :model-value="''"
                @update:model-value="(v: string) => { if (!store.cardJson) return; if (!store.cardJson.data.creator_notes_multilingual) store.cardJson.data.creator_notes_multilingual = {}; store.cardJson.data.creator_notes_multilingual[selectedLang] = v; }"
              />
              <button
                class="text-[10px] px-1 py-0.5 text-gray-500 hover:text-red-400 self-start mt-1"
                title="Remove language"
                @click="removeLanguage(selectedLang)"
              >
                ✕
              </button>
            </div>
          </template>
          <MarkdownField
            v-else
            v-model="store.cardJson.data.creator_notes"
          />
        </div>
        <div v-if="store.cardJson?.data.source?.length">
          <label class="text-xs text-gray-400 block mb-1">Source</label>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(item, i) in store.cardJson.data.source"
              :key="i"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-gray-800 border border-gray-700 rounded cursor-pointer hover:bg-gray-700"
              :class="{ 'text-blue-400 underline': isUrl(item) }"
              @click="isUrl(item) && openUrl(item)"
            >
              {{ item }}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <label class="text-gray-400 block mb-0.5">Created</label>
            <div class="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-300">
              {{ store.cardJson.data.creation_date ? new Date(store.cardJson.data.creation_date * 1000).toLocaleString() : 'Not set' }}
            </div>
          </div>
          <div>
            <label class="text-gray-400 block mb-0.5">Modified</label>
            <div class="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-300">
              {{ store.cardJson.data.modification_date ? new Date(store.cardJson.data.modification_date * 1000).toLocaleString() : 'Not set' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </CollapsibleSection>

  <Teleport to="body">
    <div
      v-if="showPreview && previewUrl"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
      @click.self="showPreview = false"
    >
      <img
        :src="previewUrl"
        class="max-w-full max-h-full object-contain rounded-lg"
        @click="showPreview = false"
      />
    </div>
  </Teleport>
</template>
