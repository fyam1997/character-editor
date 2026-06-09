# Character Card Editor

Domain glossary: `CONTEXT.md`. Spec: `spec_v2.md`. ADRs: `docs/adr/`. Plans: `docs/plans/`.

## Development Commands

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `npm run dev`      | Start Vite dev server           |
| `npm run build`    | Type-check (vue-tsc) then build |

## Project Structure

| Directory        | Purpose                          |
| ---------------- | -------------------------------- |
| `src/components` | Reusable Vue components          |
| `src/panels`     | Main panels (editor, chat, sidebar) |
| `src/stores`     | Pinia stores                     |
| `src/storage`    | IndexedDB/Dexie helpers          |
| `src/schemas`    | Zod schemas                      |
| `src/utils`      | Utilities (card I/O, API, etc.)  |

## Code Conventions

- Vue 3 with `<script setup>` and Composition API
- Zod + VeeValidate for form validation
- Pinia for shared state (`src/stores/`)
- TailwindCSS, no component library

## Commit & Changelog

- Commit after completing each change — don't wait to batch unrelated edits together
- Each commit should have a single purpose
- Commit messages: `type:` prefix — `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`
- Update `CHANGELOG.md` for each working branch, keep it brief (one line per change)

## Git Workflow

- Branch from `develop-X.Y.Z`, never from `master`
- Branches: `feature/*`, `fix/*`, or `enhance/*`
- Merge with `--no-ff`, never squash or rebase
- Releases: merge `develop-X.Y.Z` → `master`, then tag `vX.Y.Z`
