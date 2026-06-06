<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  title: string
  defaultOpen?: boolean
  borderless?: boolean
}>()

const key = `panel:${props.title}`
const saved = localStorage.getItem(key)
const open = ref(saved === null ? true : saved === 'true')
const body = ref<HTMLElement | null>(null)
const animating = ref(false)

onMounted(() => {
  if (!open.value && body.value) {
    body.value.style.height = '0px'
  }
})

function toggle() {
  if (animating.value) return
  const el = body.value
  if (!el) return
  animating.value = true

  if (open.value) {
    const h = el.scrollHeight
    el.style.height = h + 'px'
    el.offsetHeight
    el.style.height = '0px'
  } else {
    el.style.height = '0px'
    el.offsetHeight
    el.style.height = el.scrollHeight + 'px'
  }
  open.value = !open.value
  localStorage.setItem(key, String(open.value))
}

function end() {
  const el = body.value
  if (!el) return
  if (open.value) {
    el.style.height = ''
  } else {
    el.style.height = '0px'
  }
  animating.value = false
}

const headerClass = computed(() => {
  if (props.borderless) {
    return open.value
      ? 'border border-gray-700 rounded-t-lg border-b-0 border-t-0'
      : 'border border-gray-700 rounded-lg border-t-0'
  }
  return open.value
    ? 'border border-gray-700 rounded-t-lg border-b-0'
    : 'border border-gray-700 rounded-lg'
})
</script>

<template>
  <div>
    <div
      :class="['sticky top-0 z-20 flex items-center gap-2 py-2 px-3 cursor-pointer select-none', headerClass]"
      @click="toggle"
    >
      <span class="text-xs text-gray-500 transition-transform duration-200" :class="open ? 'rotate-0' : '-rotate-90'">▼</span>
      <h2 class="text-sm font-bold text-gray-300">{{ title }}</h2>
      <div class="ml-auto" @click.stop>
        <slot name="actions" />
      </div>
    </div>
    <div
      ref="body"
      class="border border-gray-700 rounded-b-lg border-t-0 overflow-hidden"
      :class="{ 'border-transparent': !open && !animating }"
      style="transition: height 0.3s ease"
      @transitionend="end"
    >
      <div class="px-3 py-3">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sticky {
  will-change: transform;
  background: rgb(3 7 18);
}
</style>
