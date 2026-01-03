# Implementation Plan: UI Logging System

**Branch**: `014-ui-logging-system` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-ui-logging-system/spec.md`

## Summary

Implement a comprehensive UI interaction logging system to enable debugging of task-switching issues. The system will capture all button presses and user actions with full context (task ID, elapsed time, session status), persist logs to localStorage, and provide a log viewer accessible from the Settings panel. This addresses the specific bug where Task 1's time was incorrectly assigned to Task 2.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax)
**Primary Dependencies**: SvelteKit 2.x, Tailwind CSS 4.x, existing stores (sessionStore, timerStore)
**Storage**: localStorage (via existing `storage` service with new `tm_logs` key)
**Testing**: Vitest for unit tests, Playwright for e2e tests
**Target Platform**: Modern browsers (client-side only, offline-capable)
**Project Type**: Web application (single SvelteKit project)
**Performance Goals**: Log viewer opens in <2 seconds, export completes in <5 seconds for 1000 entries
**Constraints**: Max 1000 log entries, localStorage quota limits, no main thread blocking
**Scale/Scope**: Single user, local-only, debugging-focused (not analytics)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Component-First Architecture | ✅ PASS | LogViewer will be self-contained Svelte component; logStore for shared state |
| II. Offline-First & Local Storage | ✅ PASS | All logs persisted to localStorage; no external APIs |
| III. Performance-Critical Timers | ✅ PASS | Logging does not affect timer accuracy; async persistence |
| IV. Test-First Development | ✅ PASS | Unit tests for logStore, component tests for LogViewer |
| V. Simplicity & YAGNI | ✅ PASS | Simple chronological view, no search/filter initially |
| VI. Comprehensive Documentation | ✅ PASS | Will update API.md and USER_GUIDE.md |

**Gate Result**: PASS - No violations. Proceed with Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/014-ui-logging-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no external APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   └── LogViewer.svelte        # NEW: Log viewing UI component
│   ├── stores/
│   │   └── logStore.svelte.ts      # NEW: Svelte store for log state
│   ├── services/
│   │   ├── storage.ts              # MODIFY: Add log persistence methods
│   │   └── logging.ts              # NEW: Logging service with context capture
│   └── types/
│       └── index.ts                # MODIFY: Add LogEntry type
├── routes/
│   └── +page.svelte                # MODIFY: Add log calls to handlers

tests/
├── unit/
│   ├── logStore.test.ts            # NEW: Store unit tests
│   └── logging.test.ts             # NEW: Service unit tests
└── component/
    └── LogViewer.test.ts           # NEW: Component tests
```

**Structure Decision**: Single SvelteKit project following existing patterns. New logging functionality mirrors the pattern established by interruptionStore, noteStore, and the storage service wrapper.

## Complexity Tracking

> No constitution violations. Table not required.
