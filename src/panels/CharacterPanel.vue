<script setup lang="ts">
import { useEditorStore } from '../stores/editor';
import CollapsibleSection from '../components/CollapsibleSection.vue';
import MarkdownField from '../components/MarkdownField.vue';

const store = useEditorStore();

const emit = defineEmits<{
  generate: [field: 'description' | 'personality' | 'scenario' | 'mes_example', content: string];
}>();
</script>

<template>
  <CollapsibleSection title="Character" v-if="store.cardJson">
    <div class="space-y-3">
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-400">Description</label>
          <button
            class="px-1.5 py-0.5 text-xs rounded text-yellow-300 hover:bg-yellow-900/40"
            title="Generate"
            @click="emit('generate', 'description', store.cardJson?.data.description ?? '')"
          >
            ✨
          </button>
        </div>
        <MarkdownField v-model="store.cardJson.data.description" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-400">Personality</label>
          <button
            class="px-1.5 py-0.5 text-xs rounded text-yellow-300 hover:bg-yellow-900/40"
            title="Generate"
            @click="emit('generate', 'personality', store.cardJson?.data.personality ?? '')"
          >
            ✨
          </button>
        </div>
        <MarkdownField v-model="store.cardJson.data.personality" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-400">Scenario</label>
          <button
            class="px-1.5 py-0.5 text-xs rounded text-yellow-300 hover:bg-yellow-900/40"
            title="Generate"
            @click="emit('generate', 'scenario', store.cardJson?.data.scenario ?? '')"
          >
            ✨
          </button>
        </div>
        <MarkdownField v-model="store.cardJson.data.scenario" />
      </div>
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs text-gray-400">Example Chat</label>
          <button
            class="px-1.5 py-0.5 text-xs rounded text-yellow-300 hover:bg-yellow-900/40"
            title="Generate"
            @click="emit('generate', 'mes_example', store.cardJson?.data.mes_example ?? '')"
          >
            ✨
          </button>
        </div>
        <MarkdownField v-model="store.cardJson.data.mes_example" />
      </div>
    </div>
  </CollapsibleSection>
</template>
