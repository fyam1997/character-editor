<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { marked } from 'marked';

const debugLog = import.meta.env.DEV ? console.log.bind(console, '[MarkdownField]') : () => {};

const props = defineProps<{
  modelValue: string;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editing = ref(false);
const textarea = ref<HTMLTextAreaElement | null>(null);
const contentEl = ref<HTMLElement | null>(null);
const initialized = ref(false);

function dialogueHtml(text: string): string {
  return text.replace(
    /(["](?:[^"\\]|\\.)*["]|["\u201c][^"\u201d]*["\u201d]|[\u300c][^\u300d]*[\u300d])/g,
    '<span class="dialogue">$1</span>',
  );
}

const rendered = computed(() => {
  if (!props.modelValue) return '';
  const text = dialogueHtml(props.modelValue);
  return marked(text, { breaks: true }) as string;
});

function getCaretRange(event: MouseEvent): Range | null {
  let range = document.caretRangeFromPoint(event.clientX, event.clientY);
  if (!range) {
    const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (pos) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }

  if (range && range.startOffset === 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = range.startContainer as Text;
    if (textNode.length > 0) {
      let prev: ChildNode | null = textNode.previousSibling;
      while (prev && prev.nodeType === Node.TEXT_NODE && (prev as Text).data.trim() === '') {
        prev = prev.previousSibling;
      }
      const isAfterBr = prev?.nodeName === 'BR';
      if (!isAfterBr) {
        const endRange = document.createRange();
        endRange.setStart(textNode, textNode.length);
        endRange.collapse(true);
        const endRect = endRange.getBoundingClientRect();
        if (endRect && event.clientX > endRect.left + 1) {
          range.setStart(textNode, textNode.length);
          range.collapse(true);
        }
      }
      debugLog(
        'getCaretRange offset0:',
        'text:',
        JSON.stringify(textNode.data),
        'prev:',
        prev?.nodeName,
        'isAfterBr:',
        isAfterBr,
        'adjusted:',
        range.startOffset !== 0,
      );
    }
  }

  return range;
}

function treeWalkerRowCol(
  container: HTMLElement,
  target: Node,
  targetOff: number,
): [number, number, boolean] {
  const blockTags = new Set([
    'P',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'LI',
    'BLOCKQUOTE',
    'PRE',
    'DIV',
    'HR',
    'TD',
    'TH',
  ]);
  let row = 0;
  let col = 0;
  let inNewBlock = true;
  let afterBr = false;
  let afterBrAtTarget = false;

  const walkLog: string[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ALL);
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node === container) {
      node = walker.nextNode();
      continue;
    }
    const isTarget = node === target;
    const tag =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element).tagName
        : node.nodeType === Node.TEXT_NODE
          ? '#text'
          : '';
    const prevRow = row;
    const prevCol = col;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const t = (node as Element).tagName;
      if (t === 'BR') {
        row++;
        col = 0;
        afterBr = true;
      } else if (blockTags.has(t)) {
        inNewBlock = true;
        col = 0;
        afterBr = false;
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).data;
      if (text.trim() === '' && /[\n\r]/.test(text)) {
        node = walker.nextNode();
        continue;
      }
      if (text.trim() === '') {
        col += text.length;
        if (inNewBlock) inNewBlock = false;
        if (afterBr) afterBr = false;
        node = walker.nextNode();
        continue;
      }
      const parts = text.split('\n');
      let effectiveLines = parts.length;
      if (effectiveLines > 1 && parts[effectiveLines - 1] === '') effectiveLines--;

      if (isTarget) {
        afterBrAtTarget = afterBr;
        let remaining = targetOff;
        let lineIdx = 0;
        while (lineIdx < effectiveLines && remaining > parts[lineIdx].length) {
          remaining -= parts[lineIdx].length + 1;
          lineIdx++;
        }
        if (inNewBlock) row++;
        row += lineIdx;
        col += remaining;
      } else if (
        inNewBlock &&
        effectiveLines > 0 &&
        parts.slice(0, effectiveLines).some(p => p.length > 0)
      ) {
        row += effectiveLines;
        col = parts[effectiveLines - 1].length;
        inNewBlock = false;
        afterBr = false;
      } else if (afterBr) {
        row += effectiveLines - 1;
        col = parts[effectiveLines - 1].length;
        afterBr = false;
      } else if (effectiveLines > 1) {
        row += effectiveLines - 1;
        col = parts[effectiveLines - 1].length;
      } else {
        col += text.length;
      }
    }
    walkLog.push(`${tag}${isTarget ? '*' : ''} r${prevRow}→${row} c${prevCol}→${col}`);
    if (isTarget) break;
    node = walker.nextNode();
  }
  debugLog('walker:', walkLog.join(' | '));
  debugLog('result row:', row, 'col:', col);
  return [row, col, afterBrAtTarget];
}

function visibleToSourceRow(row: number): number {
  const sourceLines = props.modelValue.split('\n');
  const visible: number[] = [];
  for (let i = 0; i < sourceLines.length; i++) {
    const l = sourceLines[i];
    if (/^```/.test(l) || /^\s*$/.test(l)) continue;
    if (/^(?:[-*_]\s*){3,}$/.test(l.trim())) continue;
    visible.push(i);
  }
  const idx = Math.max(0, row - 1);
  const srcRow = idx < visible.length ? visible[idx] : Math.min(idx, sourceLines.length - 1);
  debugLog(
    'visibleToSource visible:',
    JSON.stringify(visible),
    'row:',
    row,
    'idx:',
    idx,
    '→ srcRow:',
    srcRow,
  );
  return srcRow;
}

interface ScanResult {
  srcIdx: number;
  rendIdx: number;
  done: boolean;
}

const TOKEN_PATTERNS: Array<{
  test: (s: string, i: number) => boolean;
  openLen: number;
  close: string;
  suffix?: (src: string, closeAt: number) => number | null;
}> = [
  { test: (s, i) => s[i] === '*' && s[i + 1] === '*', openLen: 2, close: '**' },
  { test: (s, i) => s[i] === '*' && s[i + 1] !== '*', openLen: 1, close: '*' },
  { test: (s, i) => s[i] === '_' && s[i + 1] === '_', openLen: 2, close: '__' },
  { test: (s, i) => s[i] === '_' && s[i + 1] !== '_', openLen: 1, close: '_' },
  { test: (s, i) => s[i] === '`', openLen: 1, close: '`' },
  { test: (s, i) => s[i] === '~' && s[i + 1] === '~', openLen: 2, close: '~~' },
  {
    test: (s, i) => s[i] === '!' && s[i + 1] === '[',
    openLen: 2,
    close: ']',
    suffix: (src, closeAt) => {
      const p = src.indexOf(')', closeAt);
      return p !== -1 ? p + 1 : null;
    },
  },
  {
    test: (s, i) => s[i] === '[',
    openLen: 1,
    close: ']',
    suffix: (src, closeAt) => {
      const p = src.indexOf(')', closeAt);
      return p !== -1 ? p + 1 : null;
    },
  },
];

function scanToken(
  sourceLine: string,
  srcIdx: number,
  rendIdx: number,
  col: number,
  openLen: number,
  closeStr: string,
  suffix?: (src: string, closeAt: number) => number | null,
): ScanResult | null {
  const close = sourceLine.indexOf(closeStr, srcIdx + openLen);
  if (close === -1) return null;
  srcIdx += openLen;
  const contentLen = close - srcIdx;
  const take = Math.min(contentLen, col - rendIdx);
  if (take > 0) {
    srcIdx += take;
    rendIdx += take;
  }
  const suffixEnd = suffix ? suffix(sourceLine, close) : null;
  if (rendIdx < col) {
    return { srcIdx: suffixEnd ?? close + closeStr.length, rendIdx, done: false };
  }
  if (take === contentLen) srcIdx = suffixEnd ?? close + closeStr.length;
  return { srcIdx, rendIdx, done: true };
}

function sourceOffset(row: number, col: number): number {
  const sourceLines = props.modelValue.split('\n');
  const sourceLine = sourceLines[row] || '';

  let srcIdx = 0;
  let rendIdx = 0;

  const skipPrefix = sourceLine.match(/^\s*(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s?)/);
  if (skipPrefix) srcIdx = skipPrefix[0].length;

  while (srcIdx < sourceLine.length && rendIdx < col) {
    let result: ScanResult | null = null;
    for (const pat of TOKEN_PATTERNS) {
      if (pat.test(sourceLine, srcIdx)) {
        result = scanToken(sourceLine, srcIdx, rendIdx, col, pat.openLen, pat.close, pat.suffix);
        break;
      }
    }
    if (result) {
      srcIdx = result.srcIdx;
      rendIdx = result.rendIdx;
      if (result.done) break;
      continue;
    }
    srcIdx++;
    rendIdx++;
  }

  const adjustedCol = Math.min(srcIdx, sourceLine.length);

  let pos = 0;
  for (let i = 0; i < row; i++) {
    pos += sourceLines[i].length + 1;
  }
  pos += adjustedCol;
  const result = Math.min(pos, props.modelValue.length);
  debugLog(
    'sourceOffset row:',
    row,
    'col:',
    col,
    'adjustedCol:',
    adjustedCol,
    'sourceLine:',
    JSON.stringify(sourceLine),
    '→ pos:',
    result,
  );
  return result;
}

function closestTextNodeByY(container: HTMLElement, y: number): Node | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let bestNode: Node | null = null;
  let bestDist = Infinity;
  let node: Node | null = walker.firstChild();
  while (node) {
    const r = document.createRange();
    r.setStart(node, 0);
    r.setEnd(node, Math.min(1, (node as Text).length));
    const rect = r.getBoundingClientRect();
    if (rect) {
      const dist = Math.abs(y - rect.top);
      if (dist < bestDist) {
        bestDist = dist;
        bestNode = node;
      }
    }
    node = walker.nextNode();
  }
  return bestNode;
}

function startEdit(event: MouseEvent) {
  let clickPos = -1;

  if (contentEl.value) {
    try {
      const range = getCaretRange(event);
      if (range && contentEl.value.contains(range.startContainer)) {
        let target = range.startContainer;
        let targetOff = range.startOffset;

        if (target.nodeType === Node.ELEMENT_NODE) {
          const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
          let lastText: Node | null = null;
          let n: Node | null = walker.firstChild();
          while (n) {
            lastText = n;
            n = walker.nextNode();
          }
          if (lastText) {
            target = lastText;
            targetOff = (lastText as Text).length;
          }
        }

        debugLog(
          'startEdit effective target:',
          target.nodeName,
          'offset:',
          targetOff,
          'len:',
          (target as Text).length,
          'text:',
          JSON.stringify(target.textContent),
        );
        const [row, col, afterBr] = treeWalkerRowCol(contentEl.value, target, targetOff);
        const sourceRow = visibleToSourceRow(row);
        const textLen = target.nodeType === Node.TEXT_NODE ? (target as Text).length : 0;

        if (afterBr && row > 1 && (targetOff === 0 || (textLen > 0 && targetOff >= textLen))) {
          const bestNode = closestTextNodeByY(contentEl.value, event.clientY);
          debugLog(
            'startEdit Y-closest node:',
            bestNode?.nodeName,
            'text:',
            JSON.stringify((bestNode as Text)?.data),
          );
          if (bestNode && bestNode !== target) {
            const [r2, c2] = treeWalkerRowCol(contentEl.value, bestNode, (bestNode as Text).length);
            const sr2 = visibleToSourceRow(r2);
            clickPos = sourceOffset(sr2, c2);
            debugLog(
              'startEdit afterBr Y-fix: row:',
              r2,
              'col:',
              c2,
              'sourceRow:',
              sr2,
              'clickPos:',
              clickPos,
            );
          } else {
            clickPos = sourceOffset(sourceRow, col);
            debugLog(
              'startEdit afterBr same-target fallback: row:',
              row,
              'col:',
              col,
              'sourceRow:',
              sourceRow,
              'clickPos:',
              clickPos,
            );
          }
        } else {
          clickPos = sourceOffset(sourceRow, col);
          debugLog(
            'startEdit normal path: row:',
            row,
            'col:',
            col,
            'sourceRow:',
            sourceRow,
            'afterBr:',
            afterBr,
            'clickPos:',
            clickPos,
          );
        }
      }
    } catch {
      /* fall through */
    }
  }

  editing.value = true;
  nextTick(() => {
    const el = textarea.value;
    if (!el) return;
    if (!initialized.value) {
      el.value = props.modelValue;
      initialized.value = true;
    }
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    el.focus();
    if (clickPos >= 0) {
      el.setSelectionRange(clickPos, clickPos);
    }
  });
}

function commit() {
  editing.value = false;
  const el = textarea.value;
  if (el) {
    emit('update:modelValue', el.value);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    editing.value = false;
  }
}
</script>

<template>
  <div v-if="readonly" class="markdown-preview" v-html="rendered" />
  <div v-else>
    <div
      v-show="!editing"
      :class="[
        'min-h-[2em] px-2 py-1.5 text-xs bg-gray-800 rounded text-gray-200 cursor-text markdown-preview',
        !modelValue ? 'border border-gray-600' : '',
      ]"
      @click="startEdit"
    >
      <div v-if="!modelValue" class="text-gray-500">Click to edit...</div>
      <div v-else ref="contentEl" v-html="rendered" />
    </div>
    <textarea
      v-show="editing"
      ref="textarea"
      @blur="commit"
      @keydown="onKeydown"
      v-grow
      class="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-200"
    ></textarea>
  </div>
</template>

<style scoped>
.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4) {
  font-size: inherit;
  font-weight: 700;
  margin: 0.5em 0 0.25em;
}
.markdown-preview :deep(p) {
  margin: 0.25em 0;
}
.markdown-preview :deep(ul) {
  padding-left: 1.5em;
  margin: 0.25em 0;
  list-style: disc;
}
.markdown-preview :deep(ol) {
  padding-left: 1.5em;
  margin: 0.25em 0;
  list-style: decimal;
}
.markdown-preview :deep(li) {
  margin: 0.125em 0;
}
.markdown-preview :deep(code) {
  background: rgb(55 65 81);
  padding: 0.125em 0.25em;
  border-radius: 0.25em;
  font-size: 0.9em;
}
.markdown-preview :deep(pre code) {
  display: block;
  padding: 0.5em;
  overflow-x: auto;
}
.markdown-preview :deep(a) {
  color: rgb(96 165 250);
  text-decoration: underline;
}
.markdown-preview :deep(blockquote) {
  border-left: 3px solid rgb(75 85 99);
  padding-left: 0.75em;
  margin: 0.25em 0;
  color: rgb(156 163 175);
}
.markdown-preview :deep(strong) {
  font-weight: 700;
}
.markdown-preview :deep(em) {
  font-style: italic;
  color: rgb(209 213 219);
}

.markdown-preview :deep(.dialogue) {
  color: rgb(134 239 172);
}
</style>
