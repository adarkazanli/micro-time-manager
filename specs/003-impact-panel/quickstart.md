# Quickstart: Schedule Impact Panel

**Feature**: 003-impact-panel
**Date**: 2025-12-18

## Overview

This guide covers implementing the Schedule Impact Panel feature, which adds real-time schedule visualization with risk indicators and task reordering capability.

## Prerequisites

- Node.js 18+
- Existing codebase with 002-day-tracking merged
- Familiarity with Svelte 5 runes syntax

## Implementation Order

### Phase 1: Types & Service (Foundation)

1. **Add new types** to `src/lib/types/index.ts`:
   - `RiskLevel` type
   - `ProjectedTask` interface
   - `ImpactPanelState` interface
   - Reuse existing `WARNING_THRESHOLD_MS` constant (no new constant needed)

2. **Create projection service** at `src/lib/services/projection.ts`:
   ```typescript
   // Key functions to implement:
   export function calculateProjectedStart(
     tasks: ConfirmedTask[],
     currentIndex: number,
     currentElapsedMs: number,
     targetIndex: number
   ): Date;

   export function calculateRiskLevel(
     projectedStart: Date,
     scheduledStart: Date
   ): RiskLevel;

   export function createProjectedTasks(
     tasks: ConfirmedTask[],
     currentIndex: number,
     currentElapsedMs: number
   ): ProjectedTask[];
   ```

### Phase 2: Store Updates

3. **Extend sessionStore** with reorder capability:
   ```typescript
   // Add to sessionStore.svelte.ts:
   reorderTasks(fromIndex: number, toIndex: number): void;
   ```

4. **Update storage service** to persist reordered tasks:
   ```typescript
   // Ensure storage.saveTasks() handles sortOrder updates
   ```

### Phase 3: Components

5. **Create ImpactTaskRow** component:
   - Props: `task: ProjectedTask`, `onDragStart`, `onDrop`
   - Displays: task name, time, risk indicator, drag handle
   - Styling: gray for completed, highlighted for current, risk colors for fixed

6. **Create ImpactPanel** component:
   - Props: `tasks: ConfirmedTask[]`, `currentIndex: number`, `elapsedMs: number`
   - Computes: `ProjectedTask[]` using derived state
   - Renders: list of `ImpactTaskRow` with drag-drop handling

### Phase 4: Layout Integration

7. **Update +page.svelte** for side-by-side layout:
   ```svelte
   <div class="tracking-container grid grid-cols-1 md:grid-cols-2 gap-6">
     <div class="timer-section">
       <!-- Existing timer, current task, controls -->
     </div>
     <div class="impact-section">
       <ImpactPanel ... />
     </div>
   </div>
   ```

## Key Implementation Notes

### Risk Calculation

```typescript
function calculateRiskLevel(projectedStart: Date, scheduledStart: Date): RiskLevel {
  const bufferMs = scheduledStart.getTime() - projectedStart.getTime();

  if (bufferMs > WARNING_THRESHOLD_MS) return 'green';  // Reuse existing constant
  if (bufferMs > 0) return 'yellow';
  return 'red';
}
```

### Drag-Drop Constraints

```typescript
// Only flexible tasks after current can be dragged
const isDraggable =
  task.type === 'flexible' &&
  taskIndex > currentIndex &&
  progress[taskIndex].status === 'pending';
```

### Real-Time Updates

Use `$derived.by` to automatically recalculate projections:

```typescript
const projectedTasks = $derived.by(() => {
  return createProjectedTasks(tasks, sessionStore.currentTaskIndex, timerStore.elapsedMs);
});
```

## Testing Strategy

### Unit Tests (write first)

1. `projection.test.ts`:
   - Test `calculateProjectedStart` with various scenarios
   - Test `calculateRiskLevel` at threshold boundaries
   - Test `createProjectedTasks` with mixed task types

2. `sessionStore.test.ts` (extend):
   - Test `reorderTasks` preserves fixed task positions
   - Test `reorderTasks` rejects invalid moves
   - Test persistence after reorder

### E2E Tests

1. `impact-panel.test.ts`:
   - Panel displays all tasks with correct status colors
   - Drag-drop reorders tasks and updates indicators
   - Fixed tasks cannot be dragged
   - Reorder persists across page reload

## Verification Commands

```bash
# Type checking
npm run check

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Development server
npm run dev
```

## Common Pitfalls

1. **Forgetting to update sortOrder** - When reordering, all affected tasks need their sortOrder updated, not just the moved task.

2. **Fixed task positions** - Fixed tasks anchor to their scheduled time; ensure flexible tasks flow around them.

3. **Performance** - Projection calculation runs on every timer tick; keep it efficient (O(n) where n = remaining tasks).

4. **Drag state leaks** - Clear drag state on `dragend` even if drop was cancelled.
