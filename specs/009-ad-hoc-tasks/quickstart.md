# Quickstart: Ad-Hoc Task Creation

**Feature**: 009-ad-hoc-tasks
**Date**: 2025-12-20

## Overview

This document provides a quick implementation reference for the ad-hoc task creation feature. It covers the key files to modify, patterns to follow, and verification steps.

## Implementation Order

1. **Type System** → Add `isAdHoc` to ConfirmedTask
2. **Storage Layer** → Update serialization
3. **Store Layer** → Add `addTask()` method
4. **Component** → Create AddTaskDialog
5. **Integration** → Wire up ImpactPanel and keyboard shortcut
6. **Analytics/Export** → Add source column
7. **Tests** → Unit, component, e2e
8. **Documentation** → Update USER_GUIDE, API, DATA_SCHEMA

## Quick Reference

### 1. Type Changes (src/lib/types/index.ts)

```typescript
export interface ConfirmedTask {
  // ... existing fields

  /** True if task was created during session (ad-hoc) */
  isAdHoc?: boolean;
}
```

### 2. Storage Changes (src/lib/services/storage.ts)

```typescript
interface SerializedTask {
  // ... existing fields
  isAdHoc?: boolean;
}

function serializeTask(task: ConfirmedTask): SerializedTask {
  return {
    // ... existing fields
    isAdHoc: task.isAdHoc || undefined // Don't store false
  };
}

function deserializeTask(data: SerializedTask): ConfirmedTask {
  return {
    // ... existing fields
    isAdHoc: data.isAdHoc
  };
}
```

### 3. Store Method (src/lib/stores/sessionStore.svelte.ts)

```typescript
addTask(input: {
  name: string;
  durationSec: number;
  type: TaskType;
  startTime?: Date;
}): ConfirmedTask | null {
  if (!session || session.status !== 'running') return null;

  // Validate input
  const trimmedName = input.name.trim();
  if (!trimmedName) throw new Error('Task name is required');
  if (input.durationSec <= 0 || input.durationSec > 86400) {
    throw new Error('Invalid duration');
  }
  if (input.type === 'fixed' && !input.startTime) {
    throw new Error('Fixed tasks require start time');
  }

  // Create task
  const newTask: ConfirmedTask = {
    taskId: generateUUID(),
    name: trimmedName,
    plannedStart: input.startTime ?? new Date(),
    plannedDurationSec: input.durationSec,
    type: input.type,
    sortOrder: 0, // Recalculated below
    status: 'pending',
    isAdHoc: true
  };

  // Create progress
  const newProgress: TaskProgress = {
    taskId: newTask.taskId,
    plannedDurationSec: input.durationSec,
    actualDurationSec: 0,
    completedAt: null,
    status: 'pending'
  };

  // Find insertion index
  let insertIndex: number;
  if (input.type === 'fixed' && input.startTime) {
    insertIndex = tasks.findIndex(t =>
      t.plannedStart.getTime() > input.startTime!.getTime()
    );
    if (insertIndex === -1) insertIndex = tasks.length;
  } else {
    insertIndex = session.currentTaskIndex + 1;
  }

  // Insert and update sortOrders
  const newTasks = [...tasks];
  const newProgressArr = [...session.taskProgress];
  newTasks.splice(insertIndex, 0, newTask);
  newProgressArr.splice(insertIndex, 0, newProgress);

  for (let i = 0; i < newTasks.length; i++) {
    newTasks[i] = { ...newTasks[i], sortOrder: i };
  }

  // Update state
  tasks = newTasks;
  session = {
    ...session,
    taskProgress: newProgressArr,
    lastPersistedAt: Date.now()
  };

  // Persist
  storage.saveTasks(newTasks);
  storage.saveSession(session);

  return newTask;
}
```

### 4. Component (src/lib/components/AddTaskDialog.svelte)

Copy structure from EditTaskDialog.svelte with these changes:
- Remove `task` prop, add fresh form state
- Change title to "Add Task"
- Make start time conditional on type='fixed'
- Call `sessionStore.addTask()` instead of `onSave()`
- Add warnings for past time / overlap

### 5. Integration (src/lib/components/ImpactPanel.svelte)

```svelte
<script>
  let showAddTaskDialog = $state(false);
</script>

<!-- In header -->
{#if sessionStore.isActive}
  <button onclick={() => showAddTaskDialog = true}>
    + Add Task
  </button>
{/if}

<AddTaskDialog
  open={showAddTaskDialog}
  onClose={() => showAddTaskDialog = false}
/>
```

### 6. Keyboard Shortcut (src/routes/+page.svelte)

```svelte
<script>
  let showAddTaskDialog = $state(false);

  function handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 't') {
      event.preventDefault();
      if (sessionStore.isActive) {
        showAddTaskDialog = true;
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
```

### 7. Analytics (src/lib/services/analytics.ts)

```typescript
// In computeAnalytics()
const adHocTaskCount = tasks.filter(t => t.isAdHoc).length;
const importedTaskCount = tasks.length - adHocTaskCount;
```

### 8. Export (src/lib/services/export.ts)

```typescript
// In task row creation
const source = task.isAdHoc ? 'Ad-Hoc' : 'Imported';

// Add to TaskExportRow
interface TaskExportRow {
  // ... existing
  source: string;
}
```

## Verification Checklist

- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Add Task button visible during active session
- [ ] Add Task button hidden when no session
- [ ] Ctrl/Cmd+T opens dialog during session
- [ ] Ctrl/Cmd+T does nothing when no session
- [ ] Flexible tasks insert after current task
- [ ] Fixed tasks insert in chronological order
- [ ] Warning shown for past start time
- [ ] Warning shown for overlapping fixed tasks
- [ ] Ad-hoc tasks persist across refresh
- [ ] Analytics show ad-hoc vs imported counts
- [ ] Export includes Source column

## Common Pitfalls

1. **Forgetting to update sortOrder**: After insertion, all tasks need sortOrder recalculated
2. **Missing progress record**: New task needs corresponding TaskProgress entry
3. **Type reactivity**: When user enters start time, auto-switch to 'fixed' type
4. **Validation timing**: Validate before calling `addTask()`, not after
5. **Dialog state**: Reset form fields when dialog opens/closes

## Test Scenarios

### Unit Tests (sessionStore)

```typescript
describe('addTask', () => {
  it('returns null if no active session');
  it('throws if name is empty');
  it('throws if duration invalid');
  it('throws if fixed task without start time');
  it('inserts flexible task after current');
  it('inserts fixed task in chronological order');
  it('sets isAdHoc to true');
  it('persists to storage');
});
```

### Component Tests (AddTaskDialog)

```typescript
describe('AddTaskDialog', () => {
  it('renders when open=true');
  it('hides when open=false');
  it('closes on Cancel click');
  it('closes on Escape key');
  it('closes on backdrop click');
  it('validates required fields');
  it('shows start time field for fixed type');
  it('auto-switches type when start time entered');
  it('displays warnings for past time');
  it('calls onClose after successful submission');
});
```

### E2E Tests

```typescript
test('create ad-hoc flexible task', async ({ page }) => {
  // Import schedule, start day
  // Click Add Task
  // Fill name and duration
  // Click Add Task button
  // Verify task appears in schedule
});

test('create ad-hoc fixed task', async ({ page }) => {
  // Import schedule, start day
  // Press Ctrl+T
  // Fill name, duration, select Fixed, enter time
  // Submit
  // Verify task at correct position
});
```
