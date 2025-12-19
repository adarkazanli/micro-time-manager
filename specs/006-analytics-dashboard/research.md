# Research: Analytics Dashboard

**Feature**: 006-analytics-dashboard
**Date**: 2025-12-19

## Overview

Research findings for implementing analytics dashboard that calculates and displays productivity metrics from existing session and interruption data.

---

## 1. Data Sources

### Decision: Derive all analytics from existing stores

**Rationale**: The application already tracks all necessary data in sessionStore and interruptionStore. No new data persistence is required.

**Existing Data Available**:

| Source | Data | Usage |
|--------|------|-------|
| `sessionStore.taskProgress` | `plannedDurationSec`, `actualDurationSec`, `status` | Total planned/actual time, task completion |
| `sessionStore.session` | `startedAt`, `endedAt`, `totalLagSec` | Session duration, schedule adherence |
| `interruptionStore.interruptions` | `durationSec`, `taskId`, `count` | Concentration score, interruption summary |
| `sessionStore.tasks` | `ConfirmedTask[]` | Task names for performance list |

**Alternatives Considered**:
- Create dedicated analyticsStore with persisted state → Rejected: unnecessary complexity, data is already available
- Store analytics in localStorage → Rejected: analytics are ephemeral, calculated on demand

---

## 2. Concentration Score Formula

### Decision: Use spec-defined formula

```
Concentration = (Work Time - Interruption Time) / Work Time × 100
```

**Rationale**: Formula is clearly defined in spec. Work Time = sum of all actual task durations. Interruption Time = sum of all interruption durations.

**Edge Cases**:
| Scenario | Result |
|----------|--------|
| Work Time = 0 | Display "N/A" (avoid division by zero) |
| No interruptions | 100% "Excellent" |
| Interruption Time > Work Time | 0% (floor at 0, shouldn't happen in practice) |

**Rating Thresholds** (from spec):
| Score | Rating | Color (visual) |
|-------|--------|----------------|
| ≥90% | Excellent | Green |
| 80-89% | Good | Blue |
| 70-79% | Fair | Yellow |
| <70% | Needs improvement | Red |

---

## 3. Schedule Adherence Calculation

### Decision: Percentage of actual vs planned time

```
Schedule Adherence = (Total Planned Time / Total Actual Time) × 100
```

**Rationale**: Shows how closely the user followed their schedule. 100% = exactly on schedule, >100% = finished faster, <100% = took longer.

**Alternative Formula Considered**:
- `Total Actual / Total Planned` → Rejected: inverted meaning (>100% = slower)
- Binary adherence per task → Rejected: less informative than aggregate

**Cap**: Display as percentage without cap (e.g., 150% if finished in half the time)

---

## 4. Task Variance Calculation

### Decision: Simple difference (actual - planned)

```
Variance = Actual Duration - Planned Duration
```

**Display**:
- Positive variance: "+5:00" (red, over time)
- Negative variance: "-3:00" (green, under time)
- Zero variance: "0:00" (neutral)

**Rationale**: Consistent with existing lag display in sessionStore. Users understand positive = behind, negative = ahead.

---

## 5. Component Architecture

### Decision: Four specialized components

| Component | Responsibility | Props |
|-----------|----------------|-------|
| `AnalyticsDashboard` | Container, orchestrates data, panel visibility | `onClose` |
| `DaySummaryCard` | Displays aggregate metrics | `summary: AnalyticsSummary` |
| `ConcentrationScore` | Displays score with rating | `score: number`, `rating: string` |
| `TaskPerformanceList` | Lists per-task metrics | `tasks: TaskPerformance[]` |

**Rationale**: Follows Component-First Architecture principle. Each component is independently testable and has single responsibility.

**Alternative Considered**:
- Single monolithic AnalyticsDashboard → Rejected: violates single responsibility, harder to test

---

## 6. Analytics Service Design

### Decision: Pure function service (not a Svelte store)

**Rationale**: Analytics calculations are stateless transformations. No need for reactive state management. Pure functions are easier to test.

**Service API**:

```typescript
// src/lib/services/analytics.ts

export interface AnalyticsSummary {
  totalPlannedSec: number;
  totalActualSec: number;
  tasksCompleted: number;
  totalTasks: number;
  scheduleAdherence: number;
  concentrationScore: number;
  concentrationRating: ConcentrationRating;
  totalInterruptionCount: number;
  totalInterruptionSec: number;
}

export interface TaskPerformance {
  taskId: string;
  taskName: string;
  plannedDurationSec: number;
  actualDurationSec: number;
  varianceSec: number;
  interruptionCount: number;
  interruptionSec: number;
  status: ProgressStatus;
}

export function calculateAnalyticsSummary(
  taskProgress: TaskProgress[],
  interruptions: Interruption[]
): AnalyticsSummary;

export function calculateTaskPerformance(
  tasks: ConfirmedTask[],
  taskProgress: TaskProgress[],
  interruptions: Interruption[]
): TaskPerformance[];

export function getConcentrationRating(score: number): ConcentrationRating;
```

---

## 7. Real-Time Updates

### Decision: Reactive derivation in components

**Rationale**: Svelte's reactivity automatically updates when store values change. Components read from stores directly, calculations re-run on each render.

**Implementation**:
- Components use `$derived` to compute analytics from store getters
- No polling or manual refresh needed
- Updates happen automatically when tasks complete or interruptions end

---

## 8. Empty States

### Decision: Contextual empty messages

| State | Message | Action Hint |
|-------|---------|-------------|
| No session started | "No analytics available yet" | "Start your day to begin tracking" |
| Session running, no completions | "Complete your first task to see analytics" | Shows planned totals only |
| All tasks pending | "Analytics will appear as you complete tasks" | - |

**Rationale**: Users should understand why analytics are unavailable and what action to take.

---

## Summary

| Decision | Choice | Key Rationale |
|----------|--------|---------------|
| Data source | Existing stores | No new persistence needed |
| Concentration formula | (Work - Interruption) / Work × 100 | Spec-defined |
| Schedule adherence | Planned / Actual × 100 | Intuitive percentage |
| Variance | Actual - Planned | Consistent with lag display |
| Architecture | 4 components + 1 service | Component-First principle |
| Service type | Pure functions | Stateless calculations, easy to test |
| Updates | Reactive derivation | Svelte reactivity handles updates |
