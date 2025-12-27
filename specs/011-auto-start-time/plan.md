# Implementation Plan: Automatic Start Time Calculation

**Branch**: `011-auto-start-time` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-auto-start-time/spec.md`

## Summary

Implement automatic calculation of task start times based on task sequence and duration. The system will dynamically recalculate all start times when tasks are added, modified, or reordered, while respecting fixed-time appointments that cannot be moved. Users can configure a schedule start time or use "Start Now" for immediate scheduling.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x (runes syntax), SvelteKit, Tailwind CSS 4.x
**Storage**: localStorage (via existing `storage` service)
**Testing**: Vitest for unit tests, Playwright for component/e2e tests
**Target Platform**: Web browser (client-only SPA)
**Project Type**: Single web application
**Performance Goals**: Start time recalculation within 1 second, support 50+ tasks
**Constraints**: Offline-capable, <50KB gzipped bundle impact, no external APIs
**Scale/Scope**: Single user, single day schedule

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ Pass | New UI for schedule start time will be a self-contained component |
| II. Offline-First & Local Storage | ✅ Pass | All calculations client-side, persist to localStorage |
| III. Performance-Critical Timers | ✅ Pass | Recalculation uses O(n) algorithm, will not block timer updates |
| IV. Test-First Development | ✅ Pass | Unit tests for calculation service before implementation |
| V. Simplicity & YAGNI | ✅ Pass | Extends existing projection service, no new abstractions |
| VI. Comprehensive Documentation | ✅ Pass | Will update API.md and USER_GUIDE.md |

## Project Structure

### Documentation (this feature)

```text
specs/011-auto-start-time/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── ScheduleStartPicker.svelte   # NEW: Schedule start time picker
│   │   ├── SchedulePreview.svelte       # MODIFY: Display calculated start times
│   │   ├── AddTaskDialog.svelte         # MODIFY: Add fixed-time toggle
│   │   ├── ImpactPanel.svelte           # MODIFY: Show overflow warning
│   │   └── ImpactTaskRow.svelte         # MODIFY: Display calculated times
│   ├── stores/
│   │   ├── sessionStore.svelte.ts       # MODIFY: Add scheduleStartTime field
│   │   └── settingsStore.svelte.ts      # MODIFY: Add default start time setting
│   ├── services/
│   │   ├── projection.ts                # MODIFY: Core start time calculation
│   │   └── scheduleCalculator.ts        # NEW: Scheduling algorithm with interruptions
│   ├── types/
│   │   └── index.ts                     # MODIFY: Add new types
│   └── utils/
│       └── time.ts                      # EXISTING: Time formatting utilities

tests/
├── unit/
│   ├── scheduleCalculator.test.ts       # NEW: Algorithm unit tests
│   └── projection.test.ts               # MODIFY: Add new test cases
└── component/
    └── ScheduleStartPicker.test.ts      # NEW: Component tests
```

**Structure Decision**: Extends existing single web application structure. New scheduling logic will be encapsulated in a dedicated `scheduleCalculator.ts` service to keep `projection.ts` focused on its current responsibility. The ScheduleStartPicker will be a new reusable component for the schedule start time selection.

## Complexity Tracking

> No constitution violations identified. All changes follow existing patterns.
