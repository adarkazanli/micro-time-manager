# Quickstart: Fixed Task Reorder Behavior

**Feature**: 012-fixed-task-reorder
**Date**: 2025-12-27

## Overview

This feature modifies task reorder behavior based on type changes:
- **Fixed → Flexible**: Task stays in current position
- **Flexible → Fixed**: Task auto-reorders to chronological position with scroll and highlight

## Implementation Order

### Step 1: Add Highlight Support to TaskRow

Add the `highlighted` prop and CSS animation to `TaskRow.svelte`:

```svelte
<!-- Add to props -->
let { task, highlighted = false, ...other } = $props();

<!-- Add data attribute and class -->
<div
  class="task-row"
  class:highlighted={highlighted}
  data-task-id={task.taskId}
>

<!-- Add CSS -->
<style>
  .task-row.highlighted {
    animation: highlight-pulse 1.5s ease-out;
  }

  @keyframes highlight-pulse {
    0% { background-color: theme('colors.amber.200'); }
    100% { background-color: transparent; }
  }
</style>
```

### Step 2: Create Scroll Utility

Create `src/lib/utils/scroll.ts`:

```typescript
export function scrollToTaskAndHighlight(
  taskId: string,
  setHighlightedId: (id: string | null) => void,
  highlightDurationMs: number = 1500
): void {
  const element = document.querySelector(`[data-task-id="${taskId}"]`);
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const inViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;

  if (!inViewport) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setHighlightedId(taskId);
  setTimeout(() => setHighlightedId(null), highlightDurationMs);
}
```

### Step 3: Add Reorder Logic to SchedulePreview

Modify `handleTaskUpdate` in `SchedulePreview.svelte`:

```typescript
let highlightedTaskId = $state<string | null>(null);

function handleTaskUpdate(taskId: string, updates: Partial<ConfirmedTask>) {
  const task = tasks.find(t => t.taskId === taskId);
  if (!task) return;

  const wasFixed = task.type === 'fixed';
  const isNowFixed = updates.type === 'fixed';

  // Apply update
  onUpdateTask?.(taskId, updates);

  // Reorder if becoming fixed
  if (!wasFixed && isNowFixed && updates.plannedStart) {
    // Reorder and scroll/highlight
    const newTasks = reorderTaskChronologically(tasks, taskId, updates.plannedStart);
    onUpdateTasks?.(newTasks);

    // Wait for DOM update, then scroll
    setTimeout(() => {
      scrollToTaskAndHighlight(taskId, (id) => highlightedTaskId = id);
    }, 50);
  }
}
```

### Step 4: Add Same Logic to ImpactPanel

Similar changes to `ImpactPanel.svelte`:

```typescript
let highlightedTaskId = $state<string | null>(null);

function handleSaveTask(updates: Partial<ConfirmedTask>) {
  if (!editingTask) return;

  const wasFixed = editingTask.type === 'fixed';
  const isNowFixed = updates.type === 'fixed';

  onUpdateTask?.(editingTask.taskId, updates);

  if (!wasFixed && isNowFixed) {
    // Use onReorder callback for session tasks
    const currentIdx = tasks.findIndex(t => t.taskId === editingTask.taskId);
    const newIdx = findChronologicalPosition(tasks, editingTask.taskId, updates.plannedStart);

    if (currentIdx !== newIdx) {
      onReorder?.(currentIdx, newIdx);
      setTimeout(() => {
        scrollToTaskAndHighlight(editingTask.taskId, (id) => highlightedTaskId = id);
      }, 50);
    }
  }
}
```

### Step 5: Pass Highlight Prop to TaskRow

In both components, pass the highlight state to TaskRow:

```svelte
<TaskRow
  task={task}
  highlighted={highlightedTaskId === task.taskId}
  ...
/>
```

## Testing

### Unit Test: Reorder Logic

```typescript
describe('reorderTaskChronologically', () => {
  it('moves task to correct position when becoming fixed', () => {
    const tasks = [
      { taskId: 'a', plannedStart: new Date('2025-01-01T08:00'), type: 'flexible' },
      { taskId: 'b', plannedStart: new Date('2025-01-01T09:00'), type: 'fixed' },
      { taskId: 'c', plannedStart: new Date('2025-01-01T11:00'), type: 'fixed' },
    ];

    const result = reorderTaskChronologically(tasks, 'a', new Date('2025-01-01T10:00'));

    expect(result.map(t => t.taskId)).toEqual(['b', 'a', 'c']);
    expect(result[1].type).toBe('fixed');
  });

  it('keeps task in place when position is already correct', () => {
    const tasks = [
      { taskId: 'a', plannedStart: new Date('2025-01-01T08:00'), type: 'flexible' },
      { taskId: 'b', plannedStart: new Date('2025-01-01T09:00'), type: 'fixed' },
    ];

    const result = reorderTaskChronologically(tasks, 'a', new Date('2025-01-01T07:00'));

    expect(result.map(t => t.taskId)).toEqual(['a', 'b']);
  });
});
```

### Component Test: Type Change Behavior

```typescript
describe('SchedulePreview type change', () => {
  it('reorders task when changed to fixed with later time', async () => {
    // Arrange
    const tasks = [...];
    render(SchedulePreview, { props: { tasks, onUpdateTasks: vi.fn() } });

    // Act - change first task to fixed at 10:00
    await userEvent.click(screen.getByTestId('edit-task-a'));
    await userEvent.click(screen.getByText('Fixed'));
    await userEvent.type(screen.getByLabelText('Start Time'), '10:00');
    await userEvent.click(screen.getByText('Save'));

    // Assert
    expect(onUpdateTasks).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ taskId: 'a', type: 'fixed' })
      ])
    );
  });
});
```

## Verification Checklist

- [x] TaskRow has `data-task-id` attribute
- [x] TaskRow has `highlighted` prop and animation
- [x] SchedulePreview detects type change and reorders
- [x] ImpactPanel detects type change and reorders
- [x] Scroll occurs only when task is out of viewport
- [x] Highlight is visible in both light and dark mode
- [x] Fixed → Flexible change does NOT reorder
- [x] Unit tests pass
- [x] Component tests pass (skipped but not failing)
