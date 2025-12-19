# Implementation Plan: Analytics Dashboard

**Branch**: `006-analytics-dashboard` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-analytics-dashboard/spec.md`

## Summary

Implement an analytics dashboard that displays day summary metrics, concentration score, task performance details, and interruption summary. The feature derives all data from existing session, interruption, and task stores—no new data persistence required. The analytics panel will be accessible from the main interface during and after work sessions.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x (runes syntax), SvelteKit, Tailwind CSS 4.x
**Storage**: localStorage (existing `storage` service) - read-only for this feature
**Testing**: Vitest for unit tests, existing test infrastructure
**Target Platform**: Browser (client-side SPA)
**Project Type**: Web application (SvelteKit SPA)
**Performance Goals**: Analytics panel renders in <1 second, real-time updates within 1 second
**Constraints**: No new localStorage keys, derive all analytics from existing stores
**Scale/Scope**: Single-day analytics only (historical trends explicitly out of scope)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Component-First | Self-contained Svelte components | ✅ Pass | AnalyticsDashboard, DaySummaryCard, ConcentrationScore, TaskPerformanceList components |
| II. Offline-First | No network dependency | ✅ Pass | All data from localStorage via existing stores |
| III. Performance-Critical Timers | No timer impact | ✅ Pass | Analytics are read-only, no timer modifications |
| IV. Test-First Development | Unit tests before implementation | ✅ Pass | Analytics service tests, component tests planned |
| V. Simplicity & YAGNI | Minimal complexity | ✅ Pass | No new abstractions, derived from existing stores |
| VI. Comprehensive Documentation | Docs updated | ✅ Pass | USER_GUIDE.md, API.md, DATA_SCHEMA.md updates planned |

**Technology Stack Compliance:**
- Svelte 5.x with runes ✅
- Tailwind CSS 4.x ✅
- TypeScript strict mode ✅
- No SSR, no external APIs ✅

## Project Structure

### Documentation (this feature)

```text
specs/006-analytics-dashboard/
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
│   │   ├── AnalyticsDashboard.svelte    # Main analytics panel
│   │   ├── DaySummaryCard.svelte        # Summary metrics card
│   │   ├── ConcentrationScore.svelte    # Concentration display
│   │   ├── TaskPerformanceList.svelte   # Per-task metrics container
│   │   └── TaskPerformanceRow.svelte    # Individual task metrics row
│   ├── services/
│   │   └── analytics.ts                 # Analytics calculation service
│   └── types/
│       └── index.ts                     # Add analytics types
├── routes/
│   └── +page.svelte                     # Add analytics button/panel

tests/
├── unit/
│   └── analytics.test.ts                # Analytics service tests
```

**Structure Decision**: Follows existing single-project structure. New components in `src/lib/components/`, new analytics service in `src/lib/services/`, types extended in existing `src/lib/types/index.ts`.

## Complexity Tracking

> No complexity violations. Feature follows existing patterns.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| No new store | Use existing sessionStore, interruptionStore | Analytics are derived, not stateful |
| Service over store | analyticsService for calculations | Pure functions, no reactive state needed |
| Single panel | Inline in main page, not separate route | Matches existing pattern (Impact Panel, Notes View) |
