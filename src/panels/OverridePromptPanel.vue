<script setup lang="ts">
import { useEditorStore } from '../stores/editor';
import CollapsibleSection from '../components/CollapsibleSection.vue';
import MarkdownField from '../components/MarkdownField.vue';

const store = useEditorStore();
</script>

<template>
  <CollapsibleSection title="Override Prompt" v-if="store.cardJson">
    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-400 block mb-1">System Prompt</label>
        <MarkdownField v-model="store.cardJson.data.system_prompt" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Post-History Instructions</label>
        <MarkdownField v-model="store.cardJson.data.post_history_instructions" />
      </div>
    </div>
  </CollapsibleSection>
</template>
