# Plan: Migrate from Character Card V2 to V3

## Problem

The current editor implements the Character Card V2 specification (`spec_v2.md`). The new V3 spec introduces significant changes: top-level card fields ( `nickname`, `assets`, `source`, `group_only_greetings`, `creator_notes_multilingual`, `creation_date`, `modification_date`), a new Lorebook entry field (`use_regex`), Lorebook decorators system, new embedding format (`ccv3` PNG chunk), and Curly Braced Syntaxes (CBS). The editor must support **creating, editing, importing, and exporting** V3 cards while maintaining backward compatibility with V2.

## Scope

Full migration: types, schemas, import/export, all panels, prompt assembly, AI generation, and storage.

## Changes

### 1. Types & Zod Schemas

| File | Change |
|---|---|
| `src/types.ts` | Rename `CharacterCardV2` → `CharacterCardV3`; update `spec` to `'chara_card_v3'`, `spec_version` to `'3.0'`. Add new fields: `nickname?`, `assets?`, `source?`, `group_only_greetings`, `creator_notes_multilingual?`, `creation_date?`, `modification_date?`. Rename `CharacterBook` → `Lorebook`. Add `use_regex: boolean` to entry type. Widen `id` type from `number?` to `number \| string?`. Keep `CharacterCardV2` as an alias for backward-compat import. |
| `src/schemas/card.ts` | Update `cardSchema` spec/version literals. Update `cardDataSchema` with new fields. Rename `characterBookEntrySchema` → `lorebookEntrySchema`, add `use_regex`. Rename `characterBookSchema` → `lorebookSchema`. Add standalone `lorebookExportSchema: { spec: z.literal('lorebook_v3'), data: lorebookSchema }`. Default for `group_only_greetings`: `[]`. Default for `assets`: `undefined` (runtime fallback to `[{ type: 'icon', uri: 'ccdefault:', name: 'main', ext: 'png' }]`). |

### 2. Import / Export

| File | Change |
|---|---|
| `src/utils/png.ts` | Add read/write for `ccv3` chunk (same base64 encoding as `chara`). On import, prefer `ccv3` over `chara`. Optionally write both chunks for backward compat. |
| `src/utils/card-io.ts` | **`importCard()`**: detect V3 by checking `spec === 'chara_card_v3'`. If V2 detected (`'chara_card_v2'`), upgrade: fill `group_only_greetings: []`, `assets: undefined`, etc. Use parsed float of `spec_version` to decide compat. **`prepareExport()`**: no longer shift `alternate_greetings[0]` into `first_mes` for V3 (V3 keeps them in parallel); only do this for V2 export. ~~**New `exportAsCharx()`**: zip `card.json` + assets with `embeded://` URIs, directory layout per spec. **Download**: add `.charx` option.~~ *(deferred)* |
| `src/utils/coerce-v2-to-v3.ts` | **New** — pure function `coerceV2toV3(v2: CharacterCardV2): CharacterCardV3`. Maps all fields, fills defaults for new fields. |

### 3. Storage Layer

| File | Change |
|---|---|
| `src/stores/editor.ts` | `cardJson` ref type changes from `CharacterCardV2 \| null` to `CharacterCardV3 \| null`. On `setActiveCard`, if card is V2, coerce to V3. Auto-set `creation_date` (Unix timestamp seconds) on new card creation. Update `modification_date` on save/export. |
| `src/storage/db.ts` | `CardRecord.cardJson` type widens; existing DB records (V2 format) are read as-is and coerced in the store layer. |

### 4. UI Panels — New & Modified

#### 4a. Modified Panels

| Panel | Changes |
|---|---|
| `InfoPanel.vue` | Add `nickname` text input (between name and tags). Keep `creator_notes` as single MarkdownField. Show `source` as read-only list (with open-in-new-tab for URLs). |
| `GreetingsPanel.vue` | Add `group_only_greetings` section (separate list of greetings, only used in group chats). V3 keeps `first_mes` and `alternate_greetings` in parallel (no more shifting on export). |
| `LoreBookPanel.vue` | Rename internal references: `character_book` → `character_book` (field name unchanged in JSON, but type name changes). |
| `EntryCard.vue` | Add `use_regex` toggle (checkbox in basic section). `constant` moves from "advanced" to prominent position (required-to-implement per V3). `id` field accepts number or string. |

#### 4b. New Panels

| Panel | Description |
|---|---|
| `AssetsPanel.vue` | Manage `assets[]` array. Each row: type (icon/background/emotion/user_icon), name, URI (file picker → base64 data URL), ext. Validation: exactly one `icon` with `name === 'main'`. Show preview for images. ~~CHARX `embeded://` URI support deferred.~~ |
| `DateInfoPanel.vue` | Display-only panel showing `creation_date` and `modification_date` (formatted from Unix timestamps). Auto-generated, not user-editable. |

### 5. Prompt Assembly — Lorebook Changes

| File | Change |
|---|---|
| `src/utils/prompt-assembly.ts` | **`nickname`**: replace `{{char}}` / `<char>` / `<bot>` with `nickname` if present, else `name`. **`use_regex`**: when matching lore keys, if entry has `use_regex: true`, use `new RegExp(key, flags)` instead of `text.includes(key)`. Respect `case_sensitive` in regex flags. **Decorators**: parse `@@` directives from entry `content`. Implement `@@activate_only_after`, `@@activate_only_every`, `@@depth`, `@@instruct_depth`, `@@role`, `@@scan_depth`, `@@position`, `@@is_greeting`, `@@constant`, `@@dont_activate_after_match`, `@@keep_activate_after_match`, `@@additional_keys`, `@@exclude_keys`, `@@dont_activate`, `@@activate`, `@@ignore_on_max_context`, `@@reverse_depth`, `@@reverse_instruct_depth`, `@@instruct_scan_depth`, `@@is_user_icon`, `@@disable_ui_prompt`. Support fallback decorators (`@@@`). Strip decorators before inserting content. **CBS**: resolve `{{char}}`, `{{user}}`, `{{random:}}`, `{{pick:}}`, `{{roll:}}`, `{{//}}`, `{{hidden_key:}}`, `{{comment:}}`, `{{reverse:}}`. |
| `src/utils/generate.ts` | Update `assembleGeneratePrompt` to read `nickname`, `group_only_greetings`. Lore generation includes `use_regex` example. |

### 6. Sidebar & Card Creation

| File | Change |
|---|---|
| `src/components/Sidebar.vue` | `newCard()` now creates V3 structure with `spec: 'chara_card_v3'`, `spec_version: '3.0'`, `group_only_greetings: []`, `creation_date: Math.floor(Date.now() / 1000)`. |

### 7. Backward Compatibility

| Scenario | Behavior |
|---|---|
| Import V2 PNG (`chara` chunk) | Coerce to V3 in-memory, display as V3, save as V3. |
| Import V3 PNG (`ccv3` chunk) | Use directly. If both `chara` + `ccv3` exist, prefer `ccv3`. |
| Import V2 JSON (`spec: 'chara_card_v2'`) | Coerce to V3 on import. |
| Export | User chooses format: V3 PNG (`ccv3`) or V3 JSON. Optionally export as V2 (`chara` chunk) for compatibility. ~~CHARX format deferred.~~ |
| Old DB records | Stored V2 JSON is read, coerced to V3 in store layer. |

### 8. Asset System (Deferred)

> CHARX format (`.charx` zip) and `embeded://` URI resolution are deferred. Assets use base64 data URLs for now. See Out of Scope.

| Concern | Detail |
|---|---|
| URI resolution | Implement resolver for `ccdefault:` (fallback to PNG image or default icon), base64 data URLs, HTTP/HTTPS. ~~`embeded://` (zip entries) deferred.~~ |
| CHARX export | ~~Use `jszip` to create zip with `card.json` at root, assets in `assets/{type}/{category}/`. Deferred.~~ |
| CHARX import | ~~Read zip, extract `card.json`, parse `embeded://` URIs from assets. Deferred.~~ |
| PNG/APNG asset chunks | Support `__asset:` URI from `chara-ext-asset_:{path}` tEXt chunks (secondary; CHARX preferred per spec). Deferred. |

## Tasks

### Phase 1 — Core Types & Schema ✅

- [x] 1.1 Update `src/types.ts`: CharacterCardV3 type, Lorebook type, Asset type, CBS types
- [x] 1.2 Update `src/schemas/card.ts`: new Zod schemas with V3 fields and defaults
- [x] 1.3 Create `src/utils/coerce-v2-to-v3.ts`: pure upgrade function
- [x] 1.4 Run type-check: `npm run build` passes

**Test in this state:**
- `npm run build` passes (vue-tsc + vite build, 0 errors)
- New card created via Sidebar has `spec: 'chara_card_v3'`, `spec_version: '3.0'`, `group_only_greetings: []`
- Import V2 PNG/JSON → coerced to V3 in store layer (`setActiveCard` calls `coerceV2toV3`)
- Old V2 DB records load and coerce without error
- All existing UI panels render without type errors

### Phase 2 — Import / Export Engine ✅

- [x] 2.1 Update `src/utils/png.ts`: `ccv3` chunk read/write; prefer `ccv3` over `chara`
- [x] 2.2 Update `src/utils/card-io.ts`: V3 detect, V2→V3 coercion in import; V3 export paths
- [x] 2.3 Test round-trip: import V2 PNG → edit → export V3 PNG → re-import

**Test in this state:**
- Import V2 PNG (`chara` chunk) → coerced to V3, displayed as V3, saved as V3
- Import V3 PNG (`ccv3` chunk) → used directly, no coercion
- Both chunks present (`chara` + `ccv3`) → `ccv3` preferred
- Export V3 JSON → re-import → all V3 fields intact
- Export V3 PNG (`ccv3`) → re-import → round-trip preserved
- `npm run build` passes

### Phase 3 — Storage & State ✅

- [x] 3.1 Update `src/stores/editor.ts`: V3 type, auto-set `creation_date`, update `modification_date`
- [x] 3.2 Update `src/storage/db.ts`: widen CardRecord type, no migration needed (coercion in store)
- [x] 3.3 Test: load old V2 DB records → auto-coerced to V3 → save → reload

**Test in this state:**
- New card → `creation_date` auto-set to `Math.floor(Date.now() / 1000)` (Unix seconds)
- Save card → `modification_date` updates to current timestamp
- Load old V2 DB record → coerced to V3 → save → reload → all data intact, no loss
- `npm run build` passes

### Phase 4 — New Panel: Assets ✅

- [x] 4.1 Create `src/panels/AssetsPanel.vue`
- [x] 4.2 Integrate into `App.vue` editor column (after GreetingsPanel, before LoreBookPanel)
- [x] 4.3 Support: file upload (→ base64 data URL), type/name/ext editing, preview, validation (exactly one main icon) ~~CHARX `embeded://` deferred.~~
- [x] 4.4 Assets included in export

**Test in this state:**
- AssetsPanel renders in correct position in editor column
- File picker → image becomes base64 data URL in `uri` field
- Type dropdown (icon/background/emotion/user_icon), name, ext fields editable
- Image preview renders for common formats (png, jpg, gif, webp)
- Validation: exactly one `icon` with `name === 'main'` — warning on 0 or 2+
- Remove asset → array shrinks, validation re-runs
- `npm run build` passes

### Phase 5 — Dates Display

- [x] 5.1 Display formatted creation/modification dates in InfoPanel (read-only)

**Tested:**
- Dates shown inline in InfoPanel: creation + modification formatted from Unix timestamps
- New card without dates → shows "Not set" placeholder
- No editable inputs — display-only
- `npm run build` passes

### Phase 6 — Modified Panels

- [x] 6.1 `InfoPanel.vue`: add `nickname` input, keep `creator_notes` as single MarkdownField, `source` read-only display
- [x] 6.2 `GreetingsPanel.vue`: add `group_only_greetings` section; remove `first_mes` ↔ `alternate_greetings[0]` sync for V3
- [x] 6.3 `EntryCard.vue`: add `use_regex` toggle; promote `constant`; widen `id` input
- [x] 6.4 Sidebar `newCard()`: create V3 structure

**Tested:**
- **InfoPanel**: nickname, creator_notes, source chips, dates display — all work
- **GreetingsPanel**: group_only_greetings add/edit/remove — works
- **EntryCard**: use_regex toggle, constant in basic, id accepts number/string — works
- **Sidebar**: newCard() sets creation_date
- `npm run build` passes

### Phase 7 — Polish & QA

- [ ] 7.1 Verify: import V2 → edit all fields → export V3 → re-import → all data intact
- [ ] 7.2 Verify: import V3 → export V2 backward compat → re-import → no data loss
- [ ] 7.3 Verify: `npm run build` type-check and lint pass
- [ ] 7.4 Update `spec_v2.md` → `spec_v3.md` (already saved locally)

## Branch Strategy

Each branch merges into `develop-X.Y.Z` with `--no-ff`. Never squash or rebase.

| Branch | Phase | Key Files | Est. Size |
|---|---|---|---|
| `feature/v3-core` | 1 — Types & Schema | `types.ts`, `schemas/card.ts`, `utils/coerce-v2-to-v3.ts` | ~250 lines |
| `feature/v3-io` | 2 — Import/Export | `utils/png.ts`, `utils/card-io.ts` | ~300 lines |
| `feature/v3-store` | 3 — Storage & State | `stores/editor.ts`, `storage/db.ts` | ~150 lines |
| `feature/v3-assets` | 4 — Assets Panel | `panels/AssetsPanel.vue`, `App.vue` | ~300 lines |
| `feature/v3-panels` | 5-6 — Panel Mods | `InfoPanel.vue`, `GreetingsPanel.vue`, `EntryCard.vue`, `DateInfoPanel.vue`, `Sidebar.vue` | ~400 lines |
| `feature/v3-qa` | 7 — Polish & QA | All files, round-trip tests, lint | ~50 lines |

Dependency graph:

```
v3-core ← v3-io ← v3-store ← v3-assets
                        ↓
                    v3-panels ← v3-qa
```

`v3-assets` and `v3-panels` are independent after `v3-store` and can run in parallel.

Base branch: `develop-X.Y.Z` (create if not exists).

## Deferred & Excluded Features

Features from the spec intentionally deferred or simplified:

| Feature | Spec Section | Status |
|---|---|---|
| `creator_notes_multilingual` | §`creator_notes_multilingual` | **Simplified** — single `creator_notes` field, no language selector |
| CHARX format (`.charx` zip) | §CHARX | **Deferred** — PNG `ccv3` + JSON only for now |
| PNG `chara-ext-asset_:` chunks | §PNG/APNG | **Deferred** — not read or written |

## Out of Scope

- Live2D / 3D / AI model asset viewers — assets with these types are preserved but not rendered
- CBS `{{user}}` persona system — uses current hardcoded display name
- Global lorebook stacking — V3 recommends it but this editor only handles character-specific lorebook
- CHARX format (`.charx` zip) — deferred to a later release; PNG `ccv3` + JSON are the supported embedding methods for now
- Full CHARX PNG asset chunk round-trip (`__asset:` URIs) — PNG asset chunks are MAY
