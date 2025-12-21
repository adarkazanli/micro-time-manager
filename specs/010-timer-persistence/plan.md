# Implementation Plan: Timer Persistence Across Browser/System Interruptions

**Branch**: `010-timer-persistence` | **Date**: 2025-12-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-timer-persistence/spec.md`

## Summary

This feature ensures that the task timer and interruption timer continue tracking elapsed time even when the browser is closed or the computer goes to sleep. The approach uses wall-clock timestamps stored in localStorage to calculate elapsed time on recovery, allowing accurate time tracking across browser restarts. Periodic sync (every 10 seconds) protects against data loss from unexpected closures.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax)
**Primary Dependencies**: SvelteKit 2.x, Tailwind CSS 4.x, existing stores (timerStore, sessionStore, interruptionStore)
**Storage**: localStorage (via existing `storage` service)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (SvelteKit SPA)
**Performance Goals**: Session recovery under 500ms perceived delay; timer accuracy within 1 second
**Constraints**: Offline-capable; no external APIs; must work across browser tabs
**Scale/Scope**: Single user, single session at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | No new UI components required; existing stores handle persistence |
| II. Offline-First & Local Storage | ✅ PASS | All persistence via localStorage; no network dependency |
| III. Performance-Critical Timers | ✅ PASS | Uses `performance.now()` during active timing; wall-clock only for recovery calculations |
| IV. Test-First Development | ✅ PASS | Unit tests for recovery logic; e2e for full scenarios |
| V. Simplicity & YAGNI | ✅ PASS | Extends existing storage patterns; no new abstractions |
| VI. Comprehensive Documentation | ✅ PASS | Updates to API.md and DATA_SCHEMA.md required |

**Gate Result**: PASS - All principles satisfied. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/010-timer-persistence/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/      # No changes required
│   ├── stores/
│   │   ├── timerStore.svelte.ts      # Add persistence + recovery
│   │   ├── sessionStore.svelte.ts    # Add timer start timestamp
│   │   └── interruptionStore.svelte.ts # Add persistence + recovery
│   ├── services/
│   │   └── storage.ts   # Add timer persistence methods + schema v6
│   ├── utils/           # No changes required
│   └── types/
│       └── index.ts     # Add TimerPersistenceState type
├── routes/
│   └── +page.svelte     # Hook up recovery on mount
└── app.css              # No changes required

tests/
├── unit/
│   ├── timerPersistence.test.ts    # NEW: Recovery logic tests
│   └── interruptionPersistence.test.ts # NEW: Interruption recovery tests
└── e2e/
    └── timer-persistence.test.ts   # NEW: Full scenario tests
```

**Structure Decision**: Single project structure (existing). Changes are limited to stores, storage service, and types - no new directories or architectural changes required.

## Complexity Tracking

> No Constitution Check violations. This section is empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
