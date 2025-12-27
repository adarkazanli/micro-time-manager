# Component Contracts: Fixed Task Reorder Behavior

**Feature**: 012-fixed-task-reorder
**Date**: 2025-12-27

## Modified Components

### SchedulePreview.svelte

**Current Responsibility**: Display and manage the pre-session task list with drag-drop reordering.

**New Behavior**: When a task is updated via `onUpdateTask` and the type changes from flexible to fixed, reorder the task to its chronological position and trigger scroll/highlight.

#### Props (unchanged)

```typescript
interface Props {
  tasks: ConfirmedTask[];
  readonly?: boolean;
  onUpdateTasks?: (tasks: ConfirmedTask[]) => void;
  onUpdateTask?: (taskId: string, updates: Partial<ConfirmedTask>) => void;
  // ... existing props
}
```

#### New Internal State

```typescript
let highlightedTaskId = $state<string | null>(null);
```

#### New Handler Logic

```typescript
function handleTaskUpdate(taskId: string, updates: Partial<ConfirmedTask>) {
  const task = tasks.find(t => t.taskId === taskId);
  if (!task) return;

  const wasFixed = task.type === 'fixed';
  const isNowFixed = updates.type === 'fixed';

  // Apply the update
  onUpdateTask?.(taskId, updates);

  // Reorder only when becoming fixed (not when staying fixed or becoming flexible)
  if (!wasFixed && isNowFixed && updates.plannedStart) {
    const newTasks = reorderTaskChronologically(tasks, taskId, updates.plannedStart);
    onUpdateTasks?.(newTasks);
    scrollToTaskAndHighlight(taskId);
  }
}
```

---

### ImpactPanel.svelte

**Current Responsibility**: Display the task list during an active session with runtime projection.

**New Behavior**: Same reorder behavior as SchedulePreview when task type changes to fixed.

#### Props (unchanged)

```typescript
interface Props {
  tasks: ConfirmedTask[];
  progress: TaskProgress[];
  currentIndex: number;
  elapsedMs: number;
  onUpdateTask?: (taskId: string, updates: Partial<ConfirmedTask>) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  // ... existing props
}
```

#### New Internal State

```typescript
let highlightedTaskId = $state<string | null>(null);
```

#### New Handler Logic

```typescript
function handleSaveTask(updates: Partial<ConfirmedTask>) {
  if (!editingTask) return;

  const wasFixed = editingTask.type === 'fixed';
  const isNowFixed = updates.type === 'fixed';

  onUpdateTask?.(editingTask.taskId, updates);

  // Reorder only when becoming fixed
  if (!wasFixed && isNowFixed && updates.plannedStart) {
    const currentIndex = tasks.findIndex(t => t.taskId === editingTask.taskId);
    const newIndex = findChronologicalPosition(tasks, editingTask.taskId, updates.plannedStart);

    if (currentIndex !== newIndex && onReorder) {
      onReorder(currentIndex, newIndex);
      scrollToTaskAndHighlight(editingTask.taskId);
    }
  }
}
```

---

### TaskRow.svelte

**Current Responsibility**: Render a single task row with edit/delete actions.

**New Behavior**: Support a `highlighted` prop for visual highlight animation.

#### Props

```typescript
interface Props {
  task: ConfirmedTask;
  index: number;
  calculatedStart?: Date;
  interruption?: InterruptionInfo | null;
  editable?: boolean;
  highlighted?: boolean;  // NEW: Triggers highlight animation
  onUpdate?: (updates: Partial<ConfirmedTask>) => void;
  onDelete?: () => void;
  // ... existing props
}
```

#### New CSS Class

```css
.task-row.highlighted {
  animation: highlight-pulse 1.5s ease-out;
}

@keyframes highlight-pulse {
  0% {
    background-color: theme('colors.amber.200');
  }
  100% {
    background-color: transparent;
  }
}

/* Dark mode */
:global(.dark) .task-row.highlighted {
  animation: highlight-pulse-dark 1.5s ease-out;
}

@keyframes highlight-pulse-dark {
  0% {
    background-color: theme('colors.amber.800');
  }
  100% {
    background-color: transparent;
  }
}
```

#### Data Attribute

Add `data-task-id` for scroll targeting:

```svelte
<div
  class="task-row"
  class:highlighted={highlighted}
  data-task-id={task.taskId}
>
```

---

## New Utility Function

### scrollToTaskAndHighlight

**Location**: `src/lib/utils/scroll.ts` (new file) or inline in components

```typescript
/**
 * Scrolls to a task element and applies a temporary highlight.
 *
 * @param taskId - The task ID to scroll to
 * @param setHighlightedId - State setter for highlighted task ID
 * @param highlightDurationMs - Duration of highlight in ms (default: 1500)
 */
export function scrollToTaskAndHighlight(
  taskId: string,
  setHighlightedId: (id: string | null) => void,
  highlightDurationMs: number = 1500
): void {
  // Find the element
  const element = document.querySelector(`[data-task-id="${taskId}"]`);
  if (!element) return;

  // Check if element is in viewport
  const rect = element.getBoundingClientRect();
  const inViewport = (
    rect.top >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  );

  // Scroll if needed
  if (!inViewport) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  // Apply highlight
  setHighlightedId(taskId);
  setTimeout(() => {
    setHighlightedId(null);
  }, highlightDurationMs);
}
```

---

## Reorder Utility Function

### reorderTaskChronologically

**Location**: `src/lib/utils/taskOrder.ts` (new file) or inline

```typescript
/**
 * Returns a new task array with the specified task moved to its
 * chronologically correct position based on start time.
 *
 * @param tasks - Current task array
 * @param taskId - ID of task to reorder
 * @param newStartTime - The new start time for the task
 * @returns New array with task at correct position
 */
export function reorderTaskChronologically(
  tasks: ConfirmedTask[],
  taskId: string,
  newStartTime: Date
): ConfirmedTask[] {
  const taskIndex = tasks.findIndex(t => t.taskId === taskId);
  if (taskIndex === -1) return tasks;

  const task = tasks[taskIndex];
  const updatedTask = { ...task, plannedStart: newStartTime, type: 'fixed' as const };

  // Remove task from current position
  const remaining = [...tasks.slice(0, taskIndex), ...tasks.slice(taskIndex + 1)];

  // Find insertion point among all tasks based on start time
  // Fixed tasks should be ordered by their plannedStart
  let insertIndex = remaining.length; // Default to end

  for (let i = 0; i < remaining.length; i++) {
    const compareTask = remaining[i];
    const compareTime = compareTask.plannedStart.getTime();

    if (newStartTime.getTime() < compareTime) {
      insertIndex = i;
      break;
    }
  }

  // Insert at new position
  return [
    ...remaining.slice(0, insertIndex),
    updatedTask,
    ...remaining.slice(insertIndex)
  ];
}
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User edits task type                         │
│                    (flexible → fixed)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EditTaskDialog                               │
│                    - User selects "Fixed" type                  │
│                    - User sets start time                       │
│                    - Calls onSave(updates)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SchedulePreview / ImpactPanel                      │
│              - Detects type change (flexible → fixed)           │
│              - Calls reorderTaskChronologically()               │
│              - Updates task list                                │
│              - Calls scrollToTaskAndHighlight()                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TaskRow                                 │
│                    - Receives highlighted=true                  │
│                    - Displays highlight animation               │
│                    - Has data-task-id for scroll target         │
└─────────────────────────────────────────────────────────────────┘
```
