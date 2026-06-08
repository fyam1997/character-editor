<script setup lang="ts">
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from './CollapsibleSection.vue'

const store = useEditorStore()

function autoResize(el: Event) {
  const ta = el.target as HTMLTextAreaElement
  ta.style.height = 'auto'
  ta.style.height = ta.scrollHeight + 'px'
}

const vAutoResize = {
  mounted: (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  },
}
</script>

<template>
  <div class="space-y-3">
    <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
      <input type="checkbox" v-model="store.inspectRequest" />
      Inspect Request
    </label>
    <CollapsibleSection title="AI API Config" :defaultOpen="true">
      <div class="space-y-2">
        <div>
          <label class="text-xs text-gray-400 block mb-1">API Key</label>
          <input
            v-model="store.apiConfig.apiKey"
            type="password"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Base URL</label>
          <input
            v-model="store.apiConfig.baseUrl"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Model</label>
          <input
            v-model="store.apiConfig.model"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200"
          />
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="System Prompts" :defaultOpen="true">
      <div class="space-y-2">
        <div>
          <label class="text-xs text-gray-400 block mb-1">Main Prompt</label>
          <textarea
            v-model="store.systemPrompts.mainPrompt"
            v-auto-resize
            @input="autoResize"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 resize-none overflow-hidden"
          ></textarea>
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Auxiliary Prompt</label>
          <textarea
            v-model="store.systemPrompts.auxiliaryPrompt"
            v-auto-resize
            @input="autoResize"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 resize-none overflow-hidden"
          ></textarea>
        </div>
        <div>
          <label class="text-xs text-gray-400 block mb-1">Post-History Prompt</label>
          <textarea
            v-model="store.systemPrompts.postHistoryPrompt"
            v-auto-resize
            @input="autoResize"
            class="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 resize-none overflow-hidden"
          ></textarea>
        </div>
      </div>
    </CollapsibleSection>
  </div>
</template>
