# Implementation Plan: Schedule Impact Panel

**Branch**: `003-impact-panel` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-impact-panel/spec.md`

## Summary

Add a real-time schedule impact panel that displays all tasks with visual status indicators (completed=grayed, in-progress=highlighted, pending=normal). Fixed tasks show risk indicators (green/yellow/red) based on projected timing. Users can drag-and-drop flexible tasks to reorder and resolve conflicts. The panel uses a side-by-side layout with the existing timer on left and impact panel on right.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Framework**: Svelte 5.x with runes syntax (`$state`, `$derived`, `$derived.by`)
**Primary Dependencies**: SvelteKit, Tailwind CSS 4.x, existing stores (sessionStore, timerStore, importStore)
**Storage**: localStorage (existing `storage` service)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Browser (client-side only, offline-first)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: Risk indicators update within 1 second of changes (per SC-003)
**Constraints**: <50KB gzipped bundle (per Constitution V), offline-capable, no external APIs
**Scale/Scope**: Single user, up to 50 tasks per schedule (existing MAX_TASKS constant)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | New ImpactPanel and ImpactTaskRow components, self-contained with typed props |
| II. Offline-First & Local Storage | ✅ PASS | Reordering persisted via existing storage service, no network calls |
| III. Performance-Critical Timers | ✅ PASS | Real-time updates use existing timerStore; derived state for projections |
| IV. Test-First Development | ✅ PASS | Unit tests for projection logic, e2e for drag-drop reordering |
| V. Simplicity & YAGNI | ✅ PASS | Extends existing types, no new abstractions, uses native drag-drop |
| VI. Comprehensive Documentation | ✅ PASS | JSDoc on new functions, update USER_GUIDE.md |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-impact-panel/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── ImpactPanel.svelte        # NEW: Main panel container
│   │   ├── ImpactTaskRow.svelte      # NEW: Individual task in panel
│   │   ├── CurrentTask.svelte        # MODIFY: May need layout adjustment
│   │   ├── TimerDisplay.svelte       # EXISTING: No changes
│   │   └── ...
│   ├── stores/
│   │   ├── sessionStore.svelte.ts    # MODIFY: Add reorderTasks() action
│   │   └── timerStore.svelte.ts      # EXISTING: Use elapsedMs for projections
│   ├── services/
│   │   ├── storage.ts                # MODIFY: Persist task order changes
│   │   └── projection.ts             # NEW: Risk calculation service
│   ├── types/
│   │   └── index.ts                  # MODIFY: Add RiskLevel type, projected types
│   └── utils/
│       └── time.ts                   # EXISTING: Time formatting utilities
└── routes/
    └── +page.svelte                  # MODIFY: Side-by-side layout

tests/
├── unit/
│   ├── projection.test.ts            # NEW: Risk calculation tests
│   └── sessionStore.test.ts          # MODIFY: Add reorderTasks tests
├── component/
│   └── ImpactPanel.test.ts           # NEW: Component interaction tests
└── e2e/
    └── impact-panel.test.ts          # NEW: Drag-drop reordering e2e
```

**Structure Decision**: Extends existing SvelteKit structure. New components in `lib/components/`, new service in `lib/services/`, type extensions in `lib/types/`.

## Complexity Tracking

> No violations requiring justification - all design decisions align with Constitution principles.

| Decision | Why Chosen | Alternative Rejected |
|----------|------------|---------------------|
| Native HTML5 drag-drop | Simple, no dependencies, matches existing TaskRow pattern | Libraries (dnd-kit, sortable.js) add bundle size |
| Derived state for projections | Real-time updates without manual recalculation | Separate projection store adds complexity |
| Extend ConfirmedTask | Risk level is derived, not stored | Adding riskLevel to storage duplicates logic |
