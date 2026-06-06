<script setup lang="ts">
import { ref, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import SystemConfig from './components/SystemConfig.vue'
import InfoPanel from './panels/InfoPanel.vue'
import CharacterPanel from './panels/CharacterPanel.vue'
import OverridePromptPanel from './panels/OverridePromptPanel.vue'
import GreetingsPanel from './panels/GreetingsPanel.vue'
import LoreBookPanel from './panels/LoreBookPanel.vue'
import ChatRoom from './components/ChatRoom.vue'
import { useEditorStore } from './stores/editor'

const store = useEditorStore()
const showConfig = ref(false)
const chatGreeting = ref('')

watch(() => store.cardJson?.data, (newVal, oldVal) => {
  if (newVal && oldVal && newVal === oldVal) {
    store.scheduleSave()
  }
}, { deep: true })

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
        <div v-else class="space-y-2 max-w-2xl">
          <InfoPanel />
          <CharacterPanel />
          <OverridePromptPanel />
          <GreetingsPanel @start-chat="onStartChat" />
          <LoreBookPanel />
        </div>
      </section>
      <section class="flex-1 p-4 overflow-y-auto flex flex-col">
        <div v-if="!store.isActive" class="text-gray-500 text-center mt-20">
          Select a card and click ▶ on a greeting to start chatting
        </div>
        <div v-else-if="!chatGreeting" class="text-gray-500 text-center mt-20">
          Click ▶ on a greeting to start a chat session
        </div>
        <ChatRoom v-else :greeting="chatGreeting" />
      </section>
    </main>
    <SystemConfig v-if="showConfig" @close="showConfig = false" />
  </div>
</template>
