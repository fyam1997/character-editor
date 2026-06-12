import { defineStore } from 'pinia';
import { ref, onMounted, onUnmounted } from 'vue';

interface DialogData {
  payload?: string;
  onConfirm?: (payload: string) => void;
  onClose?: () => void;
}

export const useDialogStackStore = defineStore('dialogStack', () => {
  const stack = ref<string[]>([]);
  const data = ref<Record<string, DialogData>>({});

  function show(name: string, extra?: DialogData) {
    if (!stack.value.includes(name)) {
      stack.value.push(name);
    }
    if (extra) {
      data.value[name] = { ...data.value[name], ...extra };
    }
  }

  function hide(name: string) {
    const idx = stack.value.indexOf(name);
    if (idx !== -1) stack.value.splice(idx, 1);
    delete data.value[name];
  }

  function isVisible(name: string): boolean {
    return stack.value.includes(name);
  }

  function getData(name: string): DialogData | undefined {
    return data.value[name];
  }

  function top(): string | undefined {
    return stack.value[stack.value.length - 1];
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      const name = top();
      if (name) {
        const d = data.value[name];
        d?.onClose?.();
        hide(name);
        e.stopImmediatePropagation();
      }
    }
  }

  let cleanup: (() => void) | null = null;

  function register() {
    if (cleanup) return;
    window.addEventListener('keydown', onKeydown);
    cleanup = () => window.removeEventListener('keydown', onKeydown);
  }

  function unregister() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  }

  onMounted(() => {
    if (!cleanup) {
      window.addEventListener('keydown', onKeydown);
      cleanup = () => window.removeEventListener('keydown', onKeydown);
    }
  });

  onUnmounted(() => {
    unregister();
  });

  return { stack, show, hide, isVisible, getData, top, register, unregister };
});
