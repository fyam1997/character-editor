<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '../stores/editor';
import CollapsibleSection from '../components/CollapsibleSection.vue';

const store = useEditorStore();

const assetTypes = ['icon', 'background', 'emotion', 'user_icon'] as const;

const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico']);

function isImage(ext: string): boolean {
  return imageExts.has(ext.toLowerCase());
}

const validMainIcon = computed(() => {
  const assets = store.cardJson?.data.assets;
  if (!assets || assets.length === 0) return { valid: false, message: 'No main icon — add one asset with type "icon" and name "main"' };
  const mainIcons = assets.filter(a => a.type === 'icon' && a.name === 'main');
  if (mainIcons.length === 0) return { valid: false, message: 'No main icon — need exactly one asset with type "icon" and name "main"' };
  if (mainIcons.length > 1) return { valid: false, message: `Multiple main icons (${mainIcons.length}) — expected exactly one` };
  return { valid: true, message: '' };
});

function addAsset() {
  if (!store.cardJson) return;
  if (!store.cardJson.data.assets) {
    store.cardJson.data.assets = [];
  }
  store.cardJson.data.assets.push({
    type: 'icon',
    uri: '',
    name: '',
    ext: 'png',
  });
}

function removeAsset(index: number) {
  if (!store.cardJson?.data.assets) return;
  store.cardJson.data.assets.splice(index, 1);
  if (store.cardJson.data.assets.length === 0) {
    store.cardJson.data.assets = undefined;
  }
}

function pickFile(index: number) {
  if (!store.cardJson?.data.assets) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '*/*';
  input.click();
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const asset = store.cardJson!.data.assets![index];

    const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    asset.ext = ext;
    asset.name = file.name.replace(/\.[^.]+$/, '');

    const reader = new FileReader();
    reader.onload = () => {
      asset.uri = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
}
</script>

<template>
  <CollapsibleSection title="Assets" v-if="store.cardJson">
    <div class="space-y-3">
      <div
        v-if="!store.cardJson.data.assets || store.cardJson.data.assets.length === 0"
        class="text-xs text-gray-600 py-2"
      >
        No assets. Add a main icon to get started.
      </div>

      <div
        v-for="(asset, index) in store.cardJson.data.assets ?? []"
        :key="index"
        class="border border-gray-700 rounded p-2 space-y-2"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex-shrink-0 w-16 h-16 border border-gray-700 rounded overflow-hidden bg-gray-900 flex items-center justify-center cursor-pointer"
            @click="pickFile(index)"
          >
            <img
              v-if="asset.uri && isImage(asset.ext)"
              :src="asset.uri"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-xl text-gray-600">+</span>
          </div>

          <div class="flex-1 space-y-1.5">
            <div class="grid grid-cols-3 gap-1.5">
              <div>
                <label class="text-[10px] text-gray-500 block">Type</label>
                <select
                  v-model="asset.type"
                  class="w-full px-1.5 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
                >
                  <option
                    v-for="t in assetTypes"
                    :key="t"
                    :value="t"
                  >
                    {{ t }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-[10px] text-gray-500 block">Name</label>
                <input
                  v-model="asset.name"
                  placeholder="main"
                  class="w-full px-1.5 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
                />
              </div>
              <div>
                <label class="text-[10px] text-gray-500 block">Ext</label>
                <input
                  v-model="asset.ext"
                  placeholder="png"
                  class="w-full px-1.5 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
                />
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <div class="flex-1 min-w-0">
                <label class="text-[10px] text-gray-500 block">URI</label>
                <div
                  class="px-1.5 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-gray-400 truncate"
                  :title="asset.uri || 'Click preview to upload'"
                >
                  {{ asset.uri ? (asset.uri.startsWith('data:') ? asset.uri.substring(0, 50) + '...' : asset.uri) : '(empty)' }}
                </div>
              </div>
              <button
                class="flex-shrink-0 mt-4 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
                @click="pickFile(index)"
              >
                Upload
              </button>
              <button
                class="flex-shrink-0 mt-4 text-xs text-gray-500 hover:text-red-400"
                @click="removeAsset(index)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!validMainIcon.valid"
        class="text-[10px] text-yellow-400 py-1"
      >
        ⚠ {{ validMainIcon.message }}
      </div>

      <button
        class="w-full py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
        @click="addAsset"
      >
        + Add Asset
      </button>
    </div>
  </CollapsibleSection>
</template>
