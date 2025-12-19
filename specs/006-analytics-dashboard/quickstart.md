# Quickstart: Analytics Dashboard

**Feature**: 006-analytics-dashboard
**Date**: 2025-12-19

## Overview

This guide covers implementing the analytics dashboard feature for Micro Time Manager. The feature displays productivity metrics derived from existing session and interruption data.

---

## Prerequisites

- Node.js 18+
- Existing features implemented: 001-005 (schedule import, day tracking, impact panel, interruption tracking, note capture)
- Familiarity with Svelte 5 runes syntax

---

## File Structure

```text
src/lib/
├── components/
│   ├── AnalyticsDashboard.svelte    # NEW: Main analytics panel
│   ├── DaySummaryCard.svelte        # NEW: Summary metrics
│   ├── ConcentrationScore.svelte    # NEW: Concentration display
│   └── TaskPerformanceList.svelte   # NEW: Per-task metrics
├── services/
│   └── analytics.ts                 # NEW: Analytics calculations
└── types/
    └── index.ts                     # MODIFY: Add analytics types

tests/unit/
└── analytics.test.ts                # NEW: Analytics service tests

docs/
├── USER_GUIDE.md                    # MODIFY: Add analytics section
├── API.md                           # MODIFY: Add analytics service
└── DATA_SCHEMA.md                   # MODIFY: Add analytics types
```

---

## Implementation Steps

### Step 1: Add Types

Add to `src/lib/types/index.ts`:

```typescript
// =============================================================================
// Analytics Types (006-analytics-dashboard)
// =============================================================================

/** Rating tier for concentration score */
export type ConcentrationRating = 'Excellent' | 'Good' | 'Fair' | 'Needs improvement';

/**
 * Day-level analytics summary
 */
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

/**
 * Per-task performance metrics
 */
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

// Analytics constants
export const CONCENTRATION_EXCELLENT_THRESHOLD = 90;
export const CONCENTRATION_GOOD_THRESHOLD = 80;
export const CONCENTRATION_FAIR_THRESHOLD = 70;
```

### Step 2: Create Analytics Service

Create `src/lib/services/analytics.ts`:

```typescript
/**
 * Analytics Service
 *
 * Feature: 006-analytics-dashboard
 *
 * Pure functions for calculating productivity metrics.
 * No state management - all calculations are derived from input data.
 */

import type {
  AnalyticsSummary,
  TaskPerformance,
  ConcentrationRating,
  TaskProgress,
  ConfirmedTask,
  Interruption,
  ProgressStatus
} from '$lib/types';

import {
  CONCENTRATION_EXCELLENT_THRESHOLD,
  CONCENTRATION_GOOD_THRESHOLD,
  CONCENTRATION_FAIR_THRESHOLD
} from '$lib/types';

/**
 * Get concentration rating based on score
 */
export function getConcentrationRating(score: number): ConcentrationRating {
  if (score >= CONCENTRATION_EXCELLENT_THRESHOLD) return 'Excellent';
  if (score >= CONCENTRATION_GOOD_THRESHOLD) return 'Good';
  if (score >= CONCENTRATION_FAIR_THRESHOLD) return 'Fair';
  return 'Needs improvement';
}

/**
 * Calculate day-level analytics summary
 */
export function calculateAnalyticsSummary(
  taskProgress: readonly TaskProgress[],
  interruptions: readonly Interruption[]
): AnalyticsSummary {
  // Aggregate task metrics
  let totalPlannedSec = 0;
  let totalActualSec = 0;
  let tasksCompleted = 0;

  for (const progress of taskProgress) {
    totalPlannedSec += progress.plannedDurationSec;
    if (progress.status === 'complete') {
      totalActualSec += progress.actualDurationSec;
      tasksCompleted++;
    }
  }

  // Aggregate interruption metrics
  let totalInterruptionSec = 0;
  for (const interruption of interruptions) {
    totalInterruptionSec += interruption.durationSec;
  }

  // Calculate derived metrics
  const scheduleAdherence = totalActualSec > 0
    ? (totalPlannedSec / totalActualSec) * 100
    : 0;

  const workTime = totalActualSec;
  const concentrationScore = workTime > 0
    ? Math.max(0, ((workTime - totalInterruptionSec) / workTime) * 100)
    : 0;

  return {
    totalPlannedSec,
    totalActualSec,
    tasksCompleted,
    totalTasks: taskProgress.length,
    scheduleAdherence: Math.round(scheduleAdherence * 10) / 10,
    concentrationScore: Math.round(concentrationScore * 10) / 10,
    concentrationRating: getConcentrationRating(concentrationScore),
    totalInterruptionCount: interruptions.length,
    totalInterruptionSec
  };
}

/**
 * Calculate per-task performance metrics
 */
export function calculateTaskPerformance(
  tasks: readonly ConfirmedTask[],
  taskProgress: readonly TaskProgress[],
  interruptions: readonly Interruption[]
): TaskPerformance[] {
  return tasks.map((task) => {
    const progress = taskProgress.find(p => p.taskId === task.taskId);
    const taskInterruptions = interruptions.filter(i => i.taskId === task.taskId);

    const plannedDurationSec = progress?.plannedDurationSec ?? task.plannedDurationSec;
    const actualDurationSec = progress?.actualDurationSec ?? 0;
    const interruptionSec = taskInterruptions.reduce((sum, i) => sum + i.durationSec, 0);

    return {
      taskId: task.taskId,
      taskName: task.name,
      plannedDurationSec,
      actualDurationSec,
      varianceSec: actualDurationSec - plannedDurationSec,
      interruptionCount: taskInterruptions.length,
      interruptionSec,
      status: progress?.status ?? 'pending'
    };
  });
}
```

### Step 3: Create Components

#### AnalyticsDashboard.svelte

```svelte
<script lang="ts">
  /**
   * AnalyticsDashboard Component
   *
   * Feature: 006-analytics-dashboard
   * Main container for analytics display.
   */

  import { sessionStore } from '$lib/stores/sessionStore.svelte';
  import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
  import { calculateAnalyticsSummary, calculateTaskPerformance } from '$lib/services/analytics';
  import DaySummaryCard from './DaySummaryCard.svelte';
  import ConcentrationScore from './ConcentrationScore.svelte';
  import TaskPerformanceList from './TaskPerformanceList.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const summary = $derived(
    calculateAnalyticsSummary(
      sessionStore.taskProgress,
      interruptionStore.interruptions
    )
  );

  const taskPerformance = $derived(
    calculateTaskPerformance(
      sessionStore.tasks,
      sessionStore.taskProgress,
      interruptionStore.interruptions
    )
  );

  const hasData = $derived(sessionStore.status !== 'idle');
</script>

<div class="analytics-dashboard" data-testid="analytics-dashboard">
  <header class="dashboard-header">
    <h2>Analytics</h2>
    <button onclick={onClose} aria-label="Close analytics">×</button>
  </header>

  {#if hasData}
    <div class="dashboard-content">
      <DaySummaryCard {summary} />
      <ConcentrationScore
        score={summary.concentrationScore}
        rating={summary.concentrationRating}
      />
      <TaskPerformanceList tasks={taskPerformance} />
    </div>
  {:else}
    <div class="empty-state">
      <p>No analytics available yet</p>
      <p class="hint">Start your day to begin tracking</p>
    </div>
  {/if}
</div>
```

#### ConcentrationScore.svelte

```svelte
<script lang="ts">
  /**
   * ConcentrationScore Component
   *
   * Displays concentration score with rating badge.
   */

  import type { ConcentrationRating } from '$lib/types';

  interface Props {
    score: number;
    rating: ConcentrationRating;
  }

  let { score, rating }: Props = $props();

  const ratingColor = $derived(() => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  });
</script>

<div class="concentration-card" data-testid="concentration-score">
  <h3>Concentration Score</h3>
  <div class="score-display">
    <span class="score">{score.toFixed(1)}%</span>
    <span class="rating {ratingColor()}">{rating}</span>
  </div>
  <p class="formula">
    (Work Time − Interruption Time) ÷ Work Time × 100
  </p>
</div>
```

### Step 4: Integrate with Main Page

Add to `src/routes/+page.svelte`:

```svelte
<script>
  // ... existing imports
  import AnalyticsDashboard from '$lib/components/AnalyticsDashboard.svelte';

  let isAnalyticsOpen = $state(false);
</script>

<!-- In secondary controls section -->
<button
  onclick={() => isAnalyticsOpen = true}
  disabled={sessionStore.status === 'idle'}
>
  Analytics
</button>

<!-- Analytics panel -->
{#if isAnalyticsOpen}
  <div class="overlay">
    <AnalyticsDashboard onClose={() => isAnalyticsOpen = false} />
  </div>
{/if}
```

### Step 5: Write Tests

Create `tests/unit/analytics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getConcentrationRating,
  calculateAnalyticsSummary,
  calculateTaskPerformance
} from '$lib/services/analytics';

describe('getConcentrationRating', () => {
  it('returns Excellent for score >= 90', () => {
    expect(getConcentrationRating(90)).toBe('Excellent');
    expect(getConcentrationRating(100)).toBe('Excellent');
  });

  it('returns Good for score 80-89', () => {
    expect(getConcentrationRating(80)).toBe('Good');
    expect(getConcentrationRating(89)).toBe('Good');
  });

  it('returns Fair for score 70-79', () => {
    expect(getConcentrationRating(70)).toBe('Fair');
    expect(getConcentrationRating(79)).toBe('Fair');
  });

  it('returns Needs improvement for score < 70', () => {
    expect(getConcentrationRating(69)).toBe('Needs improvement');
    expect(getConcentrationRating(0)).toBe('Needs improvement');
  });
});

describe('calculateAnalyticsSummary', () => {
  it('calculates summary with no data', () => {
    const summary = calculateAnalyticsSummary([], []);
    expect(summary.totalPlannedSec).toBe(0);
    expect(summary.totalActualSec).toBe(0);
    expect(summary.concentrationScore).toBe(0);
  });

  it('calculates concentration score correctly', () => {
    const taskProgress = [
      { taskId: '1', plannedDurationSec: 1800, actualDurationSec: 1800, completedAt: '2025-01-01', status: 'complete' as const }
    ];
    const interruptions = [
      { interruptionId: '1', taskId: '1', startedAt: '', endedAt: '', durationSec: 180, category: null, note: null }
    ];

    const summary = calculateAnalyticsSummary(taskProgress, interruptions);
    // (1800 - 180) / 1800 * 100 = 90%
    expect(summary.concentrationScore).toBe(90);
    expect(summary.concentrationRating).toBe('Excellent');
  });
});
```

---

## Testing Checklist

- [ ] Unit tests pass: `npm run test:unit`
- [ ] Lint passes: `npm run lint`
- [ ] Type check passes: `npm run check`
- [ ] Manual test: View analytics with completed tasks
- [ ] Manual test: View analytics with interruptions
- [ ] Manual test: Empty state displays correctly
- [ ] Manual test: Real-time updates work

---

## Documentation Updates

After implementation, update:

1. **USER_GUIDE.md**: Add "Viewing Analytics" section
2. **API.md**: Add Analytics Service documentation
3. **DATA_SCHEMA.md**: Add AnalyticsSummary and TaskPerformance types

---

## Common Issues

### Issue: Concentration score shows 0 with no interruptions

**Cause**: Division by zero when no tasks completed.
**Solution**: Check for `totalActualSec > 0` before calculating.

### Issue: Analytics don't update in real-time

**Cause**: Not using `$derived` for calculations.
**Solution**: Wrap calculations in `$derived()` to re-run on store changes.

### Issue: TypeScript errors on store access

**Cause**: Missing readonly modifier on arrays.
**Solution**: Use `readonly TaskProgress[]` in function signatures.
