# Data Model: Schedule Impact Panel

**Feature**: 003-impact-panel
**Date**: 2025-12-18

## New Types

### RiskLevel

```typescript
/** Risk level for fixed task indicators */
export type RiskLevel = 'green' | 'yellow' | 'red';
```

**Usage**: Display indicator color on fixed tasks in ImpactPanel.

### ProjectedTask

```typescript
/**
 * Task with projected timing information for impact display.
 * Computed at runtime, not persisted.
 */
export interface ProjectedTask {
  /** Reference to original ConfirmedTask */
  task: ConfirmedTask;

  /** Projected start time based on current progress */
  projectedStart: Date;

  /** Projected end time (projectedStart + duration) */
  projectedEnd: Date;

  /** Risk level for fixed tasks (null for flexible) */
  riskLevel: RiskLevel | null;

  /** Seconds of buffer before scheduled start (negative = late) */
  bufferSec: number;

  /** Visual status for styling */
  displayStatus: 'completed' | 'current' | 'pending';

  /** Whether this task can be dragged (flexible + not completed/current) */
  isDraggable: boolean;
}
```

**Usage**: Derived state in ImpactPanel, computed from sessionStore + timerStore.

### ImpactPanelState

```typescript
/**
 * Complete state for the impact panel.
 * Derived from session state and timer.
 */
export interface ImpactPanelState {
  /** All tasks with projections */
  projectedTasks: ProjectedTask[];

  /** Count of fixed tasks at each risk level */
  riskSummary: {
    green: number;
    yellow: number;
    red: number;
  };

  /** Whether any reordering is possible */
  canReorder: boolean;
}
```

**Usage**: Top-level derived state for ImpactPanel component.

## Modified Types

### ConfirmedTask (extend)

No structural changes needed. The `sortOrder` field already exists and will be updated when tasks are reordered.

### DaySession (extend)

No structural changes needed. Task order is maintained via the `tasks` array passed to sessionStore, which references ConfirmedTask objects persisted via storage service.

## Constants

### WARNING_THRESHOLD_MS (existing)

```typescript
/** Warning threshold - timer turns yellow at 5 minutes remaining (ms) */
export const WARNING_THRESHOLD_MS = 300000;
```

**Note**: Reuse the existing constant from 002-day-tracking. No new constant needed - same 5-minute threshold applies to both timer warnings and risk indicators.

## Entity Relationships

```
┌─────────────────────┐
│   ConfirmedTask     │
│   (persisted)       │
└─────────┬───────────┘
          │
          │ derived from
          ▼
┌─────────────────────┐
│   ProjectedTask     │
│   (runtime only)    │
│                     │
│ + projectedStart    │
│ + riskLevel         │
│ + displayStatus     │
│ + isDraggable       │
└─────────────────────┘
          │
          │ aggregated to
          ▼
┌─────────────────────┐
│  ImpactPanelState   │
│  (runtime only)     │
│                     │
│ + projectedTasks[]  │
│ + riskSummary       │
│ + canReorder        │
└─────────────────────┘
```

## State Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ timerStore   │────▶│  projection  │────▶│  ImpactPanel     │
│ .elapsedMs   │     │  service     │     │  (component)     │
└──────────────┘     │              │     │                  │
                     │ calculates   │     │ renders tasks    │
┌──────────────┐     │ projected    │     │ with risk colors │
│ sessionStore │────▶│ times &      │     │ & drag handles   │
│ .tasks       │     │ risk levels  │     │                  │
│ .currentIdx  │     │              │     │                  │
│ .lagSec      │     └──────────────┘     └──────────────────┘
└──────────────┘
       │
       │ on reorder
       ▼
┌──────────────┐
│   storage    │
│ .saveTasks() │
└──────────────┘
```

## Validation Rules

### Task Reordering Constraints

| Constraint | Validation |
|------------|------------|
| Cannot move fixed tasks | `task.type === 'flexible'` required |
| Cannot move completed tasks | `displayStatus !== 'completed'` required |
| Cannot move current task | `displayStatus !== 'current'` required |
| Can only move to positions after current | `targetIndex > currentTaskIndex` required |
| Cannot place flexible before fixed | Fixed task positions preserved |

### Risk Level Calculation

| Condition | Risk Level |
|-----------|------------|
| `bufferSec > 300` (5 min) | `green` |
| `bufferSec > 0 && bufferSec <= 300` | `yellow` |
| `bufferSec <= 0` | `red` |

## Storage Schema

No schema changes required. Task reordering updates the `sortOrder` field in existing ConfirmedTask records stored under `tm_tasks` key.

```typescript
// Existing storage key
STORAGE_KEY_TASKS = 'tm_tasks'

// After reorder, tasks saved with updated sortOrder values
storage.saveTasks(reorderedTasks);
```
