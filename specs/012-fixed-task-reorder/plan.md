# Implementation Plan: Fixed Task Reorder Behavior

**Branch**: `012-fixed-task-reorder` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-fixed-task-reorder/spec.md`

## Summary

Implement differential reorder behavior for task type changes: flexible tasks stay in position when converted from fixed, while fixed tasks auto-reorder chronologically by their specified start time with auto-scroll and visual highlight to help users locate repositioned tasks.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax)
**Primary Dependencies**: SvelteKit, Tailwind CSS 4.x, existing stores (sessionStore, importStore)
**Storage**: localStorage (via existing `storage` service)
**Testing**: Vitest for unit tests, Playwright for e2e
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Single SvelteKit web application
**Performance Goals**: Reorder within 200ms, auto-scroll within 300ms
**Constraints**: Bundle size <50KB gzipped, offline-capable, no external APIs
**Scale/Scope**: Single user, ~20-50 tasks per day typical

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | PASS | Changes isolated to SchedulePreview, ImpactPanel, TaskRow components |
| II. Offline-First & Local Storage | PASS | All changes client-side, no network dependency |
| III. Performance-Critical Timers | N/A | Feature does not modify timer logic |
| IV. Test-First Development | PASS | Will write tests for reorder logic before implementation |
| V. Simplicity & YAGNI | PASS | Minimal changes to existing components, no new abstractions |
| VI. Comprehensive Documentation | PASS | Will update component JSDoc and user guide |

**Gate Status**: PASS - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/012-fixed-task-reorder/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── SchedulePreview.svelte    # MODIFY: Add reorder-on-fixed logic
│   │   ├── ImpactPanel.svelte        # MODIFY: Add reorder-on-fixed logic
│   │   ├── TaskRow.svelte            # MODIFY: Add highlight animation support
│   │   └── EditTaskDialog.svelte     # EXISTING: Already supports type toggle
│   ├── stores/
│   │   ├── sessionStore.svelte.ts    # MODIFY: Add reorderTaskToChronologicalPosition
│   │   └── importStore.ts            # MODIFY: Add reorder method for pre-session
│   ├── services/
│   │   └── scheduleCalculator.ts     # EXISTING: Used for chronological position calc
│   └── utils/
│       └── scroll.ts                 # NEW: Utility for smooth scroll + highlight

tests/
├── unit/
│   └── taskReorder.test.ts           # NEW: Tests for reorder logic
└── component/
    └── TaskReorder.test.ts           # NEW: Component tests for reorder behavior
```

**Structure Decision**: Single project structure following existing SvelteKit layout. Changes primarily in components and stores, with one new utility function.
