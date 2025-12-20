# Contract: sessionStore.addTask()

**Feature**: 009-ad-hoc-tasks
**Date**: 2025-12-20
**Module**: `src/lib/stores/sessionStore.svelte.ts`

## Method Signature

```typescript
/**
 * Add an ad-hoc task to the current session.
 *
 * Creates a new task with `isAdHoc: true` flag and inserts it at the
 * appropriate position based on task type:
 * - Fixed tasks: Inserted in chronological order by plannedStart
 * - Flexible tasks: Inserted immediately after the current task
 *
 * @param input - Task creation input
 * @returns The created ConfirmedTask, or null if session not active
 * @throws Error if validation fails
 *
 * @example
 * // Add a flexible task
 * const task = sessionStore.addTask({
 *   name: 'Follow-up email',
 *   durationSec: 900, // 15 minutes
 *   type: 'flexible'
 * });
 *
 * @example
 * // Add a fixed task
 * const task = sessionStore.addTask({
 *   name: 'CEO Call',
 *   durationSec: 1800, // 30 minutes
 *   type: 'fixed',
 *   startTime: new Date('2025-12-20T16:00:00')
 * });
 */
addTask(input: AddTaskInput): ConfirmedTask | null;
```

## Input Type

```typescript
interface AddTaskInput {
  /** Task name (1-200 characters, will be trimmed) */
  name: string;

  /** Duration in seconds (1-86400) */
  durationSec: number;

  /** Task type */
  type: TaskType;

  /** Start time (required for fixed tasks) */
  startTime?: Date;
}
```

## Validation Rules

| Field | Validation | Error Thrown |
|-------|------------|--------------|
| Session | Must be active (`status === 'running'`) | Returns `null` (no throw) |
| `name` | Non-empty after trim | `Error('Task name is required')` |
| `name` | ≤ 200 characters | `Error('Task name too long')` |
| `durationSec` | > 0 | `Error('Duration must be positive')` |
| `durationSec` | ≤ 86400 | `Error('Duration exceeds maximum')` |
| `type` | 'fixed' or 'flexible' | `Error('Invalid task type')` |
| `startTime` | Required when `type === 'fixed'` | `Error('Fixed tasks require start time')` |

## Behavior

### Task ID Generation
- Generate UUID v4 using existing `generateUUID()` helper

### sortOrder Assignment
- Recalculate all sortOrder values after insertion
- Use existing pattern from `reorderTasks()` method

### Insertion Logic

```typescript
// Determine insertion index
let insertIndex: number;

if (input.type === 'fixed') {
  // Insert in chronological order among all tasks
  insertIndex = tasks.findIndex(t =>
    t.plannedStart.getTime() > input.startTime!.getTime()
  );
  if (insertIndex === -1) insertIndex = tasks.length;
} else {
  // Insert after current task
  insertIndex = session.currentTaskIndex + 1;
}

// Create task
const newTask: ConfirmedTask = {
  taskId: generateUUID(),
  name: input.name.trim(),
  plannedStart: input.startTime ?? new Date(),
  plannedDurationSec: input.durationSec,
  type: input.type,
  sortOrder: insertIndex, // Will be recalculated
  status: 'pending',
  isAdHoc: true
};
```

### Progress Record Creation

```typescript
// Create corresponding TaskProgress
const newProgress: TaskProgress = {
  taskId: newTask.taskId,
  plannedDurationSec: input.durationSec,
  actualDurationSec: 0,
  completedAt: null,
  status: 'pending'
};
```

### Persistence
- Call `storage.saveTasks(tasks)` after insertion
- Call `storage.saveSession(session)` after progress array update

## Return Value

- **Success**: Returns the created `ConfirmedTask` object
- **No Session**: Returns `null` (caller should check `sessionStore.isActive` first)

## Side Effects

1. Updates internal `tasks` array
2. Updates `session.taskProgress` array
3. Persists tasks to localStorage
4. Persists session to localStorage
5. Triggers reactive updates in dependent components

## Example Usage

```typescript
// In AddTaskDialog.svelte
function handleSubmit() {
  try {
    const task = sessionStore.addTask({
      name: formName,
      durationSec: parseDuration(formDuration)!,
      type: formType,
      startTime: formType === 'fixed' ? parseTime(formStartTime) : undefined
    });

    if (task) {
      onClose(); // Success - close dialog
    } else {
      error = 'No active session';
    }
  } catch (e) {
    error = e.message;
  }
}
```

## Related Methods

| Method | Description |
|--------|-------------|
| `updateTask()` | Edit existing task properties |
| `reorderTasks()` | Move task to different position |
| `completeTask()` | Mark task as complete |
| `markMissed()` | Mark fixed task as missed |
