<script setup lang="ts">
import { useEditorStore } from '../stores/editor'
import CollapsibleSection from '../components/CollapsibleSection.vue'

const store = useEditorStore()
</script>

<template>
  <CollapsibleSection title="Character" v-if="store.cardJson">
    <div class="space-y-3">
      <div>
        <label class="text-xs text-gray-400 block mb-1">Description</label>
        <textarea v-model="store.cardJson.data.description" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"></textarea>
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Personality</label>
        <textarea v-model="store.cardJson.data.personality" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"></textarea>
      </div>
      <div>
        <label class="text-xs text-gray-400 block mb-1">Scenario</label>
        <textarea v-model="store.cardJson.data.scenario" v-grow class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"></textarea>
      </div>
    </div>
  </CollapsibleSection>
</template>
