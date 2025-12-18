# Implementation Plan: Schedule Import

**Branch**: `001-schedule-import` | **Date**: 2025-12-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-schedule-import/spec.md`

## Summary

Implement schedule import functionality allowing users to upload Excel (.xlsx, .xls) or CSV files containing their daily task schedule. The system will parse, validate, and preview tasks before confirmation, supporting inline editing and drag-and-drop reordering. All processing occurs client-side using SheetJS, with validated schedules persisted to localStorage.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x, Vite 6.x, SheetJS (xlsx), Tailwind CSS 4.x
**Storage**: localStorage (via wrapper service)
**Testing**: Vitest (unit), Svelte Testing Library (component), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (client-only)
**Performance Goals**: Parse 50 tasks in <2s, inline edits <100ms, drag-drop <200ms
**Constraints**: Offline-capable, <50KB bundle (core), no server dependencies, max 1MB file size
**Scale/Scope**: Single user, max 50 tasks per schedule, daily reset workflow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | FileUploader, SchedulePreview, TaskRow as self-contained components |
| II. Offline-First & Local Storage | ✅ PASS | SheetJS client-side parsing, localStorage persistence |
| III. Performance-Critical Timers | N/A | No timer logic in import feature |
| IV. Test-First Development | ✅ PASS | Unit tests for parser service, component tests for UI |
| V. Simplicity & YAGNI | ✅ PASS | Direct SheetJS usage, Svelte stores, no abstractions |
| VI. Comprehensive Documentation | ✅ PASS | Update USER_GUIDE.md, API.md, DATA_SCHEMA.md |

**Technology Stack Compliance**:
- ✅ Svelte 5.x with runes syntax
- ✅ Vite 6.x for build
- ✅ Tailwind CSS 4.x for styling
- ✅ SheetJS for file parsing (mandated in constitution)
- ✅ localStorage via wrapper service

## Project Structure

### Documentation (this feature)

```text
specs/001-schedule-import/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── parser-service.ts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── FileUploader.svelte      # Drag-drop + click-to-browse upload
│   │   ├── SchedulePreview.svelte   # Task list with edit/reorder
│   │   ├── TaskRow.svelte           # Single task with inline editing
│   │   ├── ValidationErrors.svelte  # Error list display
│   │   └── TemplateDownload.svelte  # Download template button
│   ├── stores/
│   │   └── importStore.ts           # Draft tasks, parse state, errors
│   ├── services/
│   │   ├── parser.ts                # SheetJS parsing + validation
│   │   └── storage.ts               # localStorage wrapper (existing)
│   └── utils/
│       ├── duration.ts              # Duration format parsing
│       └── time.ts                  # Time format parsing
├── routes/
│   └── +page.svelte                 # Main app entry (or App.svelte)
└── app.css

tests/
├── unit/
│   ├── parser.test.ts               # Parser service tests
│   ├── duration.test.ts             # Duration parsing tests
│   └── time.test.ts                 # Time parsing tests
├── component/
│   ├── FileUploader.test.ts         # Upload component tests
│   └── SchedulePreview.test.ts      # Preview component tests
└── e2e/
    └── import-flow.test.ts          # Full import workflow test
```

**Structure Decision**: Single-project structure per constitution. Components in `src/lib/components/`, services in `src/lib/services/`, stores in `src/lib/stores/`. Tests mirror source structure.

## Complexity Tracking

> No constitution violations. All requirements can be met with mandated technologies and simple patterns.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| File parsing | Direct SheetJS usage | Mandated by constitution, no wrapper needed |
| State management | Single Svelte store | Simplest approach for draft/preview state |
| Drag-drop | Native HTML5 drag-drop | No external library needed |
| Inline editing | Contenteditable + blur events | Simpler than form inputs |
