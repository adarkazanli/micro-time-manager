# Data Model: Fixed Task Reorder Behavior

**Feature**: 012-fixed-task-reorder
**Date**: 2025-12-27

## Overview

This feature does not introduce new data entities. It modifies the behavior of existing task list operations when task type changes occur.

## Existing Entities (Referenced)

### ConfirmedTask

The existing task entity already has all required fields for this feature.

```typescript
interface ConfirmedTask {
  taskId: string;           // Unique identifier
  name: string;             // Task name
  plannedStart: Date;       // Scheduled start time (used for chronological ordering)
  plannedDurationSec: number; // Duration in seconds
  type: TaskType;           // 'fixed' | 'flexible'
  originalIndex?: number;   // Original import order (not used for this feature)
}

type TaskType = 'fixed' | 'flexible';
```

**Key Fields for This Feature**:
- `taskId`: Used to identify the task for reordering and DOM element lookup
- `plannedStart`: Used to determine chronological position when task becomes fixed
- `type`: Determines reorder behavior (fixed → flexible = no reorder, flexible → fixed = reorder)

### Task List State

Tasks are stored in arrays within the stores:

```typescript
// In importStore (pre-session)
confirmedTasks: ConfirmedTask[]

// In sessionStore (during session)
tasks: ConfirmedTask[]
```

**Array Order = Display Order**: The index of a task in the array determines its display position. This feature modifies array indices when tasks become fixed.

## State Transitions

### Type Change: Fixed → Flexible

```
┌─────────────┐     ┌─────────────┐
│  Task at    │     │  Task at    │
│  index N    │ ──▶ │  index N    │
│  type=fixed │     │  type=flex  │
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
   Position: N         Position: N (unchanged)
```

**No reorder occurs.** The task remains at its current array index.

### Type Change: Flexible → Fixed

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Task at    │     │ Find chrono │     │  Task at    │
│  index N    │ ──▶ │  position   │ ──▶ │  index M    │
│  type=flex  │     │  based on   │     │  type=fixed │
└─────────────┘     │ plannedStart│     └─────────────┘
                    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   Position: N      Calculate M        Position: M (may differ)
                    based on time      + scroll + highlight
```

**Reorder occurs if M ≠ N.** The task is moved to its chronologically correct position.

## Chronological Position Algorithm

```typescript
function findChronologicalPosition(
  tasks: ConfirmedTask[],
  targetTask: ConfirmedTask
): number {
  // Get all fixed tasks except the target, sorted by time
  const fixedTasks = tasks
    .filter(t => t.type === 'fixed' && t.taskId !== targetTask.taskId)
    .sort((a, b) => a.plannedStart.getTime() - b.plannedStart.getTime());

  // Find insertion point among fixed tasks
  let insertAfterIndex = -1;
  for (const fixedTask of fixedTasks) {
    const fixedTaskIndex = tasks.findIndex(t => t.taskId === fixedTask.taskId);
    if (fixedTask.plannedStart.getTime() <= targetTask.plannedStart.getTime()) {
      insertAfterIndex = fixedTaskIndex;
    }
  }

  // Calculate target position
  if (insertAfterIndex === -1) {
    // No fixed task before this time - find first position
    return 0;
  }

  return insertAfterIndex + 1;
}
```

## UI State

### Highlight State

Transient UI state for the highlight animation:

```typescript
interface HighlightState {
  taskId: string | null;  // Currently highlighted task, or null
  expiresAt: number;      // Timestamp when highlight should be removed
}
```

This state is ephemeral and not persisted. It is managed via CSS classes applied to DOM elements.

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| Fixed tasks must have a valid `plannedStart` | EditTaskDialog requires time when type=fixed |
| Task position must be valid array index | Bounds checking in reorder function |
| Scroll target element must exist | Null check before scrollIntoView |

## Schema Version

**No schema version increment required.** This feature modifies behavior, not data structure. The existing schema version (7) remains unchanged.
