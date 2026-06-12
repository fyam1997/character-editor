import { ref } from 'vue';

const topDialog = ref<string | null>(null);

export function useDialogStack(name: string) {
  function activate() {
    topDialog.value = name;
  }

  function deactivate() {
    if (topDialog.value === name) {
      topDialog.value = null;
    }
  }

  function isTop(): boolean {
    return topDialog.value === name;
  }

  return { activate, deactivate, isTop };
}
