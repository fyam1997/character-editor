<script setup lang="ts">
import { useDialogStackStore } from '../stores/dialog-stack';
import InspectDialog from './InspectDialog.vue';

const stack = useDialogStackStore();
</script>

<template>
  <InspectDialog
    :visible="stack.isVisible('inspect')"
    :payload="stack.getData('inspect')?.payload ?? ''"
    @close="stack.hide('inspect')"
    @confirm="(p) => stack.getData('inspect')?.onConfirm?.(p)"
  />
</template>
