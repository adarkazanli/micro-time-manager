# Research: Fixed Task Reorder Behavior

**Feature**: 012-fixed-task-reorder
**Date**: 2025-12-27

## Research Questions

### 1. How to determine chronological position for fixed tasks?

**Decision**: Use the existing `calculateSchedule` function from `scheduleCalculator.ts` which already sorts tasks chronologically for schedule display.

**Rationale**: The schedule calculator already handles chronological ordering of tasks based on their `plannedStart` times. We can leverage the same sorting logic to determine where a newly-fixed task should be inserted.

**Alternatives Considered**:
- Custom binary search insertion: Rejected - would duplicate existing logic
- Sort entire list on each change: Rejected - less efficient than targeted insertion
- Use `calculateSchedule` output: Selected - already proven, well-tested

### 2. How to implement auto-scroll to repositioned task?

**Decision**: Use native `Element.scrollIntoView()` with `{ behavior: 'smooth', block: 'center' }` options.

**Rationale**: Native browser API is well-supported, performant, and requires no additional dependencies. The `block: 'center'` option ensures the task is centered in the viewport for visibility.

**Alternatives Considered**:
- Custom scroll animation: Rejected - unnecessary complexity
- Third-party scroll library: Rejected - violates YAGNI principle
- Native `scrollIntoView`: Selected - simple, effective, no dependencies

### 3. How to implement visual highlight on repositioned task?

**Decision**: Use CSS animation with a temporary class that fades a highlight color (amber/yellow background) over 1.5 seconds.

**Rationale**: CSS animations are hardware-accelerated, don't block the main thread, and integrate naturally with Tailwind's animation utilities. A 1.5-second duration is long enough to be noticed but not distracting.

**Alternatives Considered**:
- JavaScript-based animation: Rejected - less performant
- CSS `@keyframes` with Tailwind: Selected - simple, performant
- No highlight (scroll only): Rejected - users may miss the repositioned task

### 4. Where should reorder logic live?

**Decision**: Implement reorder logic in the component handlers (SchedulePreview, ImpactPanel) that call the existing store update methods, not in the stores themselves.

**Rationale**: The reorder decision (whether to reorder or not) depends on the type change context, which the component knows. The stores remain focused on state management. This keeps the stores simple and the behavior explicit at the component level.

**Alternatives Considered**:
- Store-level automatic reorder: Rejected - couples state to UI behavior
- Separate reorder service: Rejected - over-engineering for simple logic
- Component-level logic: Selected - explicit, testable, follows existing patterns

### 5. How to handle the case where a task becomes fixed but already has a time?

**Decision**: When a task's type changes to "fixed", use its existing `plannedStart` time for chronological positioning. If the task has no valid time (edge case), the EditTaskDialog already requires a time when type is "fixed".

**Rationale**: This aligns with the existing EditTaskDialog behavior which requires a start time for fixed tasks. The time picker is already integrated.

**Alternatives Considered**:
- Prompt for time if missing: Not needed - UI already handles this
- Use current time as default: Not needed - dialog already requires time
- Use existing `plannedStart`: Selected - simplest, covers all cases

## Implementation Patterns

### Pattern: Conditional Reorder on Type Change

```typescript
function handleTaskUpdate(taskId: string, updates: Partial<Task>) {
  const task = getTask(taskId);
  const wasFixed = task.type === 'fixed';
  const isNowFixed = updates.type === 'fixed';

  // Apply the update first
  updateTask(taskId, updates);

  // Only reorder if becoming fixed (not if staying fixed or becoming flexible)
  if (!wasFixed && isNowFixed) {
    const newPosition = findChronologicalPosition(taskId);
    if (newPosition !== currentPosition) {
      moveTask(taskId, newPosition);
      scrollToTask(taskId);
    }
  }
  // If becoming flexible, do nothing - task stays in place
}
```

### Pattern: Scroll and Highlight

```typescript
function scrollToTaskWithHighlight(taskId: string) {
  const element = document.querySelector(`[data-task-id="${taskId}"]`);
  if (!element) return;

  // Check if already in viewport
  const rect = element.getBoundingClientRect();
  const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;

  if (!inViewport) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Always highlight regardless of scroll
  element.classList.add('highlight-reposition');
  setTimeout(() => {
    element.classList.remove('highlight-reposition');
  }, 1500);
}
```

## Dependencies

No new dependencies required. All functionality can be implemented with:
- Existing `scheduleCalculator.ts` for chronological position
- Native `scrollIntoView()` for scrolling
- Tailwind CSS for highlight animation
- Existing store patterns for state updates

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scroll animation janky on low-end devices | Low | Medium | Use native `scrollIntoView` with browser optimization |
| User rapidly toggles type causing multiple reorders | Low | Low | Debounce is already in place for schedule calculations |
| Highlight not visible in some themes | Low | Low | Use amber color that contrasts with both light/dark modes |
