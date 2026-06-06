<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SystemConfig from './components/SystemConfig.vue'
import { useEditorStore } from './stores/editor'

const store = useEditorStore()
const showConfig = ref(false)
</script>

<template>
  <div class="h-screen flex text-sm bg-gray-950 text-gray-200">
    <Sidebar @open-config="showConfig = true" />
    <main class="flex-1 flex">
      <section class="flex-1 border-r border-gray-700 p-4 overflow-y-auto">
        <div v-if="!store.isActive" class="text-gray-500 text-center mt-20">
          Select or create a card to start editing
        </div>
        <div v-else class="space-y-6 max-w-2xl">
          <p class="text-xs text-gray-500">Spec editor — coming next</p>
        </div>
      </section>
      <section class="flex-1 p-4 overflow-y-auto">
        <div v-if="!store.isActive" class="text-gray-500 text-center mt-20">
          Select a card and click ▶ on a greeting to start chatting
        </div>
        <div v-else class="space-y-4">
          <p class="text-xs text-gray-500">Chat room — coming next</p>
        </div>
      </section>
    </main>
    <SystemConfig v-if="showConfig" @close="showConfig = false" />
  </div>
</template>
