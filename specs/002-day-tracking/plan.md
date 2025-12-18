# Implementation Plan: Day Tracking Timer

**Branch**: `002-day-tracking` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-day-tracking/spec.md`

## Summary

Implement a real-time day tracking timer that allows users to execute their imported schedule. The system displays a countdown timer for the current task, tracks completion status, calculates schedule lag, and warns users about conflicts with upcoming fixed tasks. Timer state persists through page refreshes via localStorage.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x (runes syntax), Vite 6.x, Tailwind CSS 4.x
**Storage**: localStorage (JSON with schema versioning)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Single client-side web application
**Performance Goals**: Timer accuracy within 100ms drift, 60fps UI updates
**Constraints**: Offline-capable, <50KB gzipped bundle, sub-second state persistence
**Scale/Scope**: Single user per browser, up to 50 tasks per day

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | Timer display, task controls, lag indicator as separate components |
| II. Offline-First & Local Storage | ✅ PASS | All state persisted to localStorage, no network calls |
| III. Performance-Critical Timers | ✅ PASS | Must use `performance.now()`, requestAnimationFrame for display updates |
| IV. Test-First Development | ✅ PASS | Unit tests for timer logic, e2e tests for user flows |
| V. Simplicity & YAGNI | ✅ PASS | No pause feature, no external dependencies beyond existing stack |
| VI. Comprehensive Documentation | ✅ PASS | Timer API documented, user guide updated |

**Technology Stack Compliance**:
- ✅ Svelte 5.x with runes syntax
- ✅ Tailwind CSS 4.x for styling
- ✅ localStorage with schema versioning
- ✅ No prohibited technologies (SSR, external DBs, CSS-in-JS, Redux)

## Project Structure

### Documentation (this feature)

```text
specs/002-day-tracking/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── timer-store.contract.ts
│   ├── session-store.contract.ts
│   └── timer-service.contract.ts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── TimerDisplay.svelte      # Countdown timer with color states
│   │   ├── TaskControls.svelte      # Start Day, Complete Task buttons
│   │   ├── LagIndicator.svelte      # Schedule ahead/behind display
│   │   ├── FixedTaskWarning.svelte  # Warning for fixed task conflicts
│   │   ├── DaySummary.svelte        # End-of-day completion summary
│   │   └── CurrentTask.svelte       # Task name and type badge display
│   ├── stores/
│   │   ├── timerStore.ts            # Timer state and elapsed time tracking
│   │   └── sessionStore.ts          # Day session with task progress
│   ├── services/
│   │   ├── timer.ts                 # High-precision timer logic (performance.now())
│   │   ├── storage.ts               # [existing] Extend for session persistence
│   │   └── tabSync.ts               # Multi-tab detection and coordination
│   ├── types/
│   │   └── index.ts                 # [existing] Extend with timer types
│   └── utils/
│       └── time.ts                  # [existing] Extend with lag calculations

tests/
├── unit/
│   ├── timer.test.ts                # Timer service unit tests
│   ├── timerStore.test.ts           # Timer store unit tests
│   ├── sessionStore.test.ts         # Session store unit tests
│   └── lagCalculation.test.ts       # Lag calculation tests
├── component/
│   ├── TimerDisplay.test.ts         # Timer display component tests
│   ├── TaskControls.test.ts         # Control button component tests
│   └── LagIndicator.test.ts         # Lag indicator component tests
└── e2e/
    └── day-tracking.test.ts         # Full day tracking workflow tests
```

**Structure Decision**: Extends the existing single-project Svelte structure established in 001-schedule-import. New components, stores, and services follow the same organizational pattern.

## Complexity Tracking

> No constitution violations - complexity within guidelines.

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| Timer Precision | `performance.now()` + drift compensation | Constitution III mandates accurate timers |
| Multi-tab Handling | BroadcastChannel API with leader election | Simplest cross-tab coordination mechanism |
| State Persistence | Extend existing localStorage service | Reuse established patterns from 001-schedule-import |
