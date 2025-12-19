# Implementation Plan: Note Capture

**Branch**: `005-note-capture` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-note-capture/spec.md`

## Summary

Implement a quick note capture system that allows users to record information during task execution without disrupting their workflow. Notes are automatically associated with the active task, persisted to localStorage, and can be viewed, searched, filtered, edited, and deleted through a dedicated Notes view.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x (runes syntax), SvelteKit, Tailwind CSS 4.x
**Storage**: localStorage (via existing storage service wrapper)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (SvelteKit SPA)
**Performance Goals**: Note input appears within 100ms; note capture in under 3 seconds
**Constraints**: Offline-capable, <50KB gzipped bundle impact, 500 char note limit
**Scale/Scope**: Typical user: 10-50 notes per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Component-First Architecture | PASS | NoteInput, NotesView, NoteRow, DeleteConfirmDialog as self-contained components |
| II. Offline-First & Local Storage | PASS | localStorage persistence via storage service; no external APIs |
| III. Performance-Critical Timers | PASS | Note capture does not pause task timer; uses existing timer infrastructure |
| IV. Test-First Development | PASS | Unit tests for noteStore, e2e tests for capture/view workflows |
| V. Simplicity & YAGNI | PASS | Plain text notes, simple filter/search, no rich text or tagging |
| VI. Comprehensive Documentation | PASS | Will update API.md, USER_GUIDE.md, DATA_SCHEMA.md |

**Gate Status**: PASS - All principles satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/005-note-capture/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── NoteInput.svelte       # Inline note input with char counter
│   │   ├── NotesView.svelte       # Notes panel with search/filter
│   │   ├── NoteRow.svelte         # Individual note display
│   │   └── DeleteConfirmDialog.svelte  # Confirmation dialog for delete
│   ├── stores/
│   │   └── noteStore.svelte.ts    # Note state management (Svelte 5 runes)
│   ├── services/
│   │   └── storage.ts             # Extended with note persistence methods
│   └── types/
│       └── index.ts               # Extended with Note types
├── routes/
│   └── +page.svelte               # Integration of note components

tests/
├── unit/
│   └── noteStore.test.ts          # Store logic tests
└── e2e/
    └── note-capture.test.ts       # End-to-end workflow tests
```

**Structure Decision**: Follows existing pattern from 004-interruption-tracking with dedicated store, components, and storage service extension.

## Complexity Tracking

No constitution violations requiring justification.
