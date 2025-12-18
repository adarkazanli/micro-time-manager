# Research: Schedule Impact Panel

**Feature**: 003-impact-panel
**Date**: 2025-12-18

## Research Areas

### 1. Risk Calculation Algorithm

**Decision**: Calculate risk level for fixed tasks based on projected completion time vs. scheduled start time.

**Rationale**: The projection must account for:
1. Current task elapsed time (from timerStore)
2. Remaining duration of current task
3. Sum of durations for all tasks between current and target fixed task
4. Current accumulated lag

**Algorithm**:
```
projectedArrival = now + (currentTaskRemaining) + sum(intervening task durations)
buffer = fixedTask.plannedStart - projectedArrival
riskLevel =
  - if buffer > 5 minutes: GREEN
  - if buffer > 0 and buffer <= 5 minutes: YELLOW
  - if buffer <= 0: RED
```

**Alternatives Considered**:
- Store risk level in session state: Rejected - duplicates derived data, stale risk on timer updates
- Recalculate only on task completion: Rejected - doesn't meet real-time requirement (SC-003)

### 2. HTML5 Drag and Drop for Task Reordering

**Decision**: Use native HTML5 drag-and-drop API with `draggable`, `ondragstart`, `ondragover`, `ondrop` events.

**Rationale**:
- Already used in existing `TaskRow.svelte` and `SchedulePreview.svelte` components
- No additional dependencies (Constitution V: Simplicity)
- Works offline (Constitution II)
- Familiar pattern for team

**Implementation Pattern** (from existing code):
```svelte
<div
  draggable={task.type === 'flexible' && !isCompleted && !isCurrent}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
```

**Alternatives Considered**:
- `@dnd-kit/core`: Rejected - adds ~15KB to bundle, overkill for simple list reorder
- `svelte-sortable-list`: Rejected - additional dependency, native API sufficient

### 3. Real-Time Update Strategy

**Decision**: Use Svelte 5 derived state (`$derived.by`) to compute projected times and risk levels reactively.

**Rationale**:
- Automatic updates when timerStore.elapsedMs changes
- No manual subscription management
- Matches existing pattern in sessionStore

**Implementation**:
```typescript
const projectedTasks = $derived.by(() => {
  return tasks.map((task, index) => ({
    ...task,
    projectedStart: calculateProjectedStart(index),
    riskLevel: calculateRiskLevel(task, projectedStart)
  }));
});
```

**Alternatives Considered**:
- setInterval polling: Rejected - inefficient, doesn't align with Svelte reactivity
- Manual store subscriptions: Rejected - more code, error-prone

### 4. Persisting Task Reorder

**Decision**: Update `storage.saveTasks()` to accept reordered task array, preserve sortOrder field.

**Rationale**:
- Existing storage service handles localStorage with error handling
- sortOrder field already exists in ConfirmedTask type
- Session recovery already loads tasks from storage

**Implementation**:
```typescript
// In sessionStore
reorderTasks(fromIndex: number, toIndex: number): void {
  // Update sortOrder fields
  // Persist via storage.saveTasks()
}
```

**Alternatives Considered**:
- Separate reorder history: Rejected - overcomplicates, sortOrder field sufficient
- Store full reorder in session: Rejected - duplicates task data

### 5. Side-by-Side Layout Approach

**Decision**: CSS Grid or Flexbox layout in `+page.svelte` with timer section on left, impact panel on right.

**Rationale**:
- Tailwind CSS utilities support responsive layouts
- Can collapse to stacked on mobile (future enhancement)
- Minimal CSS changes

**Layout Structure**:
```svelte
<div class="tracking-container grid grid-cols-1 md:grid-cols-2 gap-6">
  <div class="timer-section">
    <!-- TimerDisplay, CurrentTask, TaskControls -->
  </div>
  <div class="impact-section">
    <ImpactPanel {tasks} {currentIndex} {elapsedMs} />
  </div>
</div>
```

## Summary

| Area | Decision | Confidence |
|------|----------|------------|
| Risk Calculation | Derived state with buffer thresholds | High |
| Drag-and-Drop | Native HTML5 API | High |
| Real-Time Updates | Svelte 5 `$derived.by` | High |
| Persistence | Extend existing storage service | High |
| Layout | CSS Grid with Tailwind | High |

All decisions align with Constitution principles and leverage existing codebase patterns.
