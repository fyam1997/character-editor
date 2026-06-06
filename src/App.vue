<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SystemConfig from './components/SystemConfig.vue'
import BaseSpecForm from './components/BaseSpecForm.vue'
import GreetingsPanel from './components/GreetingsPanel.vue'
import { useEditorStore } from './stores/editor'

const store = useEditorStore()
const showConfig = ref(false)
const chatGreeting = ref('')

function onStartChat(greeting: string) {
  chatGreeting.value = greeting
}
</script>

<template>
  <div class="h-screen flex text-sm bg-gray-950 text-gray-200">
    <Sidebar @open-config="showConfig = true" />
    <main class="flex-1 flex">
      <section class="flex-1 border-r border-gray-700 p-4 overflow-y-auto">
        <div v-if="!store.isActive" class="text-gray-500 text-center mt-20">
          Select or create a card to start editing
        </div>
        <div v-else class="space-y-8 max-w-2xl">
          <BaseSpecForm />
          <div class="border-t border-gray-700 pt-4">
            <GreetingsPanel @start-chat="onStartChat" />
          </div>
          <div class="text-xs text-gray-500 border-t border-gray-700 pt-4">
            Lore Book — coming next
          </div>
        </div>
      </section>
      <section class="flex-1 p-4 overflow-y-auto">
        <div v-if="!store.isActive" class="text-gray-500 text-center mt-20">
          Select a card and click ▶ on a greeting to start chatting
        </div>
        <div v-else-if="!chatGreeting" class="text-gray-500 text-center mt-20">
          Click ▶ on a greeting to start a chat session
        </div>
        <div v-else class="space-y-4">
          <p class="text-xs text-gray-500">Chat room — coming next</p>
          <p class="text-xs text-gray-400">Greeting: {{ chatGreeting?.slice(0, 50) }}...</p>
        </div>
      </section>
    </main>
    <SystemConfig v-if="showConfig" @close="showConfig = false" />
  </div>
</template>
