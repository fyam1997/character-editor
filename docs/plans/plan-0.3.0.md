# Plan: Extension Editor (0.3.0)

## Problem

The Character Card V2 spec defines `extensions` fields at three levels:

| Level | Path |
|---|---|
| Card | `data.extensions` |
| Character Book | `data.character_book.extensions` |
| Book Entry | `data.character_book.entries[].extensions` |

Each is typed `Record<string, unknown>` and defaults to `{}`. The spec mandates:

- **MUST NOT** destroy unknown key-value pairs on import/export
- Applications **SHOULD** namespace keys to prevent conflicts (e.g. `"agnai/voice"`, `"sillytavern_*"`)

The `unknown` value type makes structured editing difficult: values can be strings, numbers, booleans, arrays, nested objects, or any arbitrary JSON. The editor currently has **no UI** for extensions — they are silently preserved through import/export but invisible to the user.

## Design

### Philosophy

The extension editor is a **pass-through with visibility**. Unknown extension data is preserved by default; the editor adds the ability to **inspect, add, edit, and remove** extension key-value pairs without destroying unrecognised ones.

Since the value space is unbounded, the editor uses a **type-aware key-value table** with JSON fallback:

- **Primitive types** (string, number, boolean) get simple inline inputs
- **Complex types** (arrays, nested objects) are edited as JSON text in a modal
- Each row declares its type explicitly so the editor doesn't need to guess

### UI Components

#### 1. `ExtensionsPanel.vue` — Card-level extensions

A new collapsible panel in the editor column, inserted below the LoreBook panel.

- Key-value table with columns: **Key**, **Type**, **Value**, **Delete**
- **Add Extension** button appends a new row (defaults: `""`, `string`, `""`)
- Type selector per row: `String | Number | Boolean | JSON`
- For String/Number/Boolean: inline `<input>` bound to parsed value
- For JSON: a text button showing a preview of the JSON; clicking it opens a modal with a `<textarea>` for raw JSON editing
- Empty-key rows are removed on save/blur
- Deleted rows simply drop the key from the record

```
┌──────────────────────────────────────────────┐
│ ▶ Extensions (3)                             │
├──────────┬────────┬─────────────────┬────────┤
│ Key      │ Type   │ Value           │        │
├──────────┼────────┼─────────────────┼────────┤
│ agnai/.. │ JSON   │ { "voice": ...  │   ✕    │
│ my_flag  │ Bool   │ ☑ true          │   ✕    │
│ prefix   │ String │ "hello"         │   ✕    │
├──────────┴────────┴─────────────────┴────────┤
│ + Add Extension                               │
└──────────────────────────────────────────────┘
```

#### 2. LoreBook extensions (in-app integration)

- **Book-level**: An "Extensions" collapsible subsection at the bottom of the book metadata area in `LoreBookPanel.vue`, reusing the same key-value table component.
- **Entry-level**: An "Extensions" collapsible subsection at the bottom of the advanced view in `EntryCard.vue`, reusing the same key-value table component.

This requires extracting the key-value table into a shared `ExtensionsTable.vue` component (see below).

#### 3. `ExtensionsTable.vue` — Reusable key-value table

A shared component used by `ExtensionsPanel`, `LoreBookPanel`, and `EntryCard`.

Props:
- `modelValue: Record<string, unknown>` — the extensions record (v-model)

Internally the component converts the `Record<string, unknown>` into a reactive array of `{ key, type, value }` rows. On mutation it serialises back to `Record<string, unknown>` and emits `update:modelValue`.

### Type Mapping

| Type selector | Storage format | UI widget |
|---|---|---|
| String | `string` | `<input type="text">` |
| Number | `number` | `<input type="number">` |
| Boolean | `boolean` | `<input type="checkbox">` |
| JSON | arbitrary JSON | text button + modal `<textarea>` |

When loading an existing extension record, each key's value is classified:
- `typeof v === "string"` → String
- `typeof v === "number"` → Number
- `typeof v === "boolean"` → Boolean
- everything else (`object`, `Array.isArray`, `null`) → JSON (serialised with `JSON.stringify(v, null, 2)`)

### Data Flow

```
ExtensionsTable
  ├── reads: Record<string, unknown> → array of { key, type, value }
  ├── emits: array → Record<string, unknown> via update:modelValue
  └── parent binds with v-model to store.cardJson.data.extensions (or book/entry)
```

Because `store.cardJson.data` is deeply watched, any change to extensions triggers the existing 500ms debounced auto-save — no new persistence logic needed.

### Import/Export Compatibility

No changes needed. The existing `card-io.ts` already deep-copies (preserves) extension data:

- `importCard()`: spreads source JSON, preserving any `extensions` keys
- `prepareExport()`: uses `JSON.parse(JSON.stringify(cardJson))` which deep-copies everything
- `png.ts`: `embedJsonInPng()` uses `JSON.stringify(json)` which preserves all data

The risk is that the editor's type-mapping could inadvertently mutate values (e.g., round-tripping a number through a string input). To mitigate:

1. The `JSON` type always round-trips through `JSON.parse(JSON.stringify(v))` — no information loss.
2. The `Number` type uses a numeric input — `parseFloat` may lose precision for very large integers, but this matches JSON's own `number` semantics.
3. All unrecognised types fall back to JSON, which is lossless.

### Files Changed

| File | Change |
|---|---|
| `src/components/ExtensionsTable.vue` | **New** — shared key-value table component |
| `src/components/ExtensionsJsonModal.vue` | **New** — modal for editing JSON values |
| `src/panels/ExtensionsPanel.vue` | **New** — card-level extensions panel |
| `src/App.vue` | Add `<ExtensionsPanel>` in editor column after `<LoreBookPanel>` |
| `src/panels/LoreBookPanel.vue` | Add book-level extensions subsection (reuses ExtensionsTable) |
| `src/components/EntryCard.vue` | Add entry-level extensions subsection in advanced view (reuses ExtensionsTable) |

### Out of Scope (Future)

- Structured editors for known extension namespaces (e.g., Agnai voice config, SillyTavern character expressions). These could be added later as pluggable "extension resolvers."
- Zod validation of extension values (impossible without knowing the schema ahead of time)
- Extension auto-discovery / marketplace integration

## Tasks

1. [ ] Create `ExtensionsTable.vue` — shared key-value table with type selector
2. [ ] Create `ExtensionsJsonModal.vue` — modal for raw JSON editing
3. [ ] Create `ExtensionsPanel.vue` — card-level extensions panel
4. [ ] Integrate `ExtensionsPanel` into `App.vue` editor column
5. [ ] Add book-level extensions subsection to `LoreBookPanel.vue`
6. [ ] Add entry-level extensions subsection to `EntryCard.vue` advanced view
7. [ ] Verify: import a card with extensions → edit → export → extensions preserved
8. [ ] Verify: the `npm run build` type-check passes
