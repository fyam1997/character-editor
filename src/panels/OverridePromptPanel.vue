<script setup lang="ts">
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'

const store = useEditorStore()
</script>

<template>
  <CollapsibleSection title="Override Prompt" v-if="store.cardJson">
    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-400 block mb-1">System Prompt</label>
        <textarea v-model="store.cardJson.data.system_prompt" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 font-mono"></textarea>
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Post-History Instructions</label>
        <textarea v-model="store.cardJson.data.post_history_instructions" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200 font-mono"></textarea>
      </div>
    </div>
  </CollapsibleSection>
</template>
