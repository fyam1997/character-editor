<script setup lang="ts">
import { computed } from 'vue';
import { useEditorStore } from '../stores/editor';
import CollapsibleSection from '../components/CollapsibleSection.vue';
import ExtensionsTable from '../components/ExtensionsTable.vue';

const store = useEditorStore();

const extensions = computed({
  get: () => store.cardJson?.data.extensions ?? {},
  set: val => {
    if (store.cardJson) {
      store.cardJson.data.extensions = val;
    }
  },
});
</script>

<template>
  <CollapsibleSection title="Extensions">
    <div v-if="!store.cardJson" class="text-xs text-gray-600 py-2">No card selected</div>
    <ExtensionsTable v-else v-model="extensions" />
  </CollapsibleSection>
</template>
