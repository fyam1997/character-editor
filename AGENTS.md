**You should commit your changes after finishing task**
**You should commit your changes after finishing task**
**You should commit your changes after finishing task**

# Character Card Editor

A tool for creating and editing Character Card V2 documents.

Spec: `spec_v3.md`. ADRs: `docs/adr/`. Plans: `docs/plans/`.

Local TODO: `.todo.md` — cross branch doc for tracking and planning. **DO NOT commit `.todo.md`**.

## Project Structure

| Directory        | Purpose                             |
|------------------|-------------------------------------|
| `src/components` | Reusable Vue components             |
| `src/panels`     | Main panels (editor, chat, sidebar) |
| `src/stores`     | Pinia stores                        |
| `src/storage`    | IndexedDB/Dexie helpers             |
| `src/schemas`    | Zod schemas                         |
| `src/utils`      | Utilities (card I/O, API, etc.)     |

## Code Conventions

- Vue 3 with `<script setup>` and Composition API
- Zod + VeeValidate for form validation
- Pinia for shared state (`src/stores/`)
- TailwindCSS, no component library

## Commit & Changelog

- Each commit should have a single purpose, avoid making a commit too large
- Commit messages: `type:` prefix — `feat:`, `fix:`, `refactor:`, `chore:`, `style:`, `docs:`
- Update `CHANGELOG.md` after finished task

## Git Workflow

- Branch from `develop-X.Y.Z`
- Branches: `feature/*`, `fix/*`, or `enhance/*`
- Merge with `--no-ff`, never squash or rebase
- Releases: merge `develop-X.Y.Z` → `master`, then tag `vX.Y.Z`

## Test

Before you try to test with playwright, check if dev server is running.
DO NOT try to run dev server if it's not running.
If it's not running, just skip playwright test and suggest user to start a dev server for you.
