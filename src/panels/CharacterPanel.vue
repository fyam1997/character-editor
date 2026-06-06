<script setup lang="ts">
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'
import MarkdownField from '../components/MarkdownField.vue'

const store = useEditorStore()
</script>

<template>
  <CollapsibleSection title="Character" v-if="store.cardJson">
    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-400 block mb-1">Description</label>
        <MarkdownField v-model="store.cardJson.data.description" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Personality</label>
        <MarkdownField v-model="store.cardJson.data.personality" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Scenario</label>
        <MarkdownField v-model="store.cardJson.data.scenario" />
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Example Chat</label>
        <MarkdownField v-model="store.cardJson.data.mes_example" />
      </div>
    </div>
  </CollapsibleSection>
</template>
