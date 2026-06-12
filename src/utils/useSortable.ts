import { onMounted, onUnmounted, type Ref } from 'vue';
import Sortable from 'sortablejs';

export function useSortable(
  el: Ref<HTMLElement | null>,
  onReorder: (oldIndex: number, newIndex: number) => void,
  options?: Sortable.Options,
) {
  let instance: Sortable | null = null;

  function init() {
    if (!el.value) return;
    instance = Sortable.create(el.value, {
      animation: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      ...options,
      onEnd: evt => {
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
        onReorder(evt.oldIndex, evt.newIndex);
        options?.onEnd?.(evt);
      },
    });
  }

  onMounted(init);
  onUnmounted(() => instance?.destroy());

  return { destroy: () => instance?.destroy(), init };
}
