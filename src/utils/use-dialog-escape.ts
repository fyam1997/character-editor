import { watch, onMounted, onUnmounted } from 'vue';
import { useDialogStack } from './dialog-stack';

export function useDialogEscape(name: string, visible: () => boolean, onClose: () => void) {
  const { activate, deactivate, isTop } = useDialogStack(name);

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible() && isTop()) {
      onClose();
      e.stopImmediatePropagation();
    }
  }

  watch(
    visible,
    v => {
      if (v) activate();
      else deactivate();
    },
    { immediate: true },
  );

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    deactivate();
  });
}
