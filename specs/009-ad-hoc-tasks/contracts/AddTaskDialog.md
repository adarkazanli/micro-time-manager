# Contract: AddTaskDialog Component

**Feature**: 009-ad-hoc-tasks
**Date**: 2025-12-20
**Module**: `src/lib/components/AddTaskDialog.svelte`

## Component Interface

```typescript
interface Props {
  /** Whether the dialog is open */
  open: boolean;

  /** Callback when dialog should close */
  onClose: () => void;

  /** Callback when task is successfully created */
  onTaskCreated?: (task: ConfirmedTask) => void;
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | Yes | Controls dialog visibility |
| `onClose` | `() => void` | Yes | Called when dialog should close (Cancel, Escape, backdrop click) |
| `onTaskCreated` | `(task: ConfirmedTask) => void` | No | Called after successful task creation |

## Internal State

```typescript
// Form fields
let name = $state('');
let duration = $state('');
let type = $state<TaskType>('flexible');
let startTime = $state('');

// Validation
let nameError = $state('');
let durationError = $state('');
let startTimeError = $state('');

// Warnings (non-blocking)
let warnings = $state<string[]>([]);
```

## Form Fields

| Field | Input Type | Default | Validation |
|-------|-----------|---------|------------|
| Task Name | text | `''` | Required, 1-200 chars |
| Duration | text | `''` | Required, valid duration format |
| Type | button group | `'flexible'` | Required |
| Start Time | time | `''` | Required when type is 'fixed' |

## Behavior

### Type Selection (Context-Based Default)

Per clarification Q1, type defaults based on start time entry:

```typescript
$effect(() => {
  if (startTime && startTime.length > 0) {
    type = 'fixed';
  }
});
```

### Validation Flow

```typescript
function validate(): boolean {
  let valid = true;
  warnings = [];

  // Name validation
  const trimmedName = name.trim();
  if (!trimmedName) {
    nameError = 'Task name is required';
    valid = false;
  } else if (trimmedName.length > 200) {
    nameError = 'Task name too long (max 200 characters)';
    valid = false;
  } else {
    nameError = '';
  }

  // Duration validation
  const parsedDuration = parseDuration(duration);
  if (parsedDuration === null || parsedDuration <= 0) {
    durationError = 'Invalid duration (e.g., "30m", "1h 30m")';
    valid = false;
  } else if (parsedDuration > 86400) {
    durationError = 'Duration cannot exceed 24 hours';
    valid = false;
  } else {
    durationError = '';
  }

  // Start time validation (fixed tasks only)
  if (type === 'fixed') {
    if (!startTime) {
      startTimeError = 'Start time required for fixed tasks';
      valid = false;
    } else {
      startTimeError = '';
      // Warning checks (non-blocking)
      const parsedTime = parseTimeToDate(startTime);
      if (parsedTime < new Date()) {
        warnings.push('This task\'s scheduled time has already passed');
      }
      // Check overlap with existing fixed tasks
      const overlap = checkFixedTaskOverlap(parsedTime, parsedDuration);
      if (overlap) {
        warnings.push(`Overlaps with "${overlap.name}" at ${formatTime(overlap.plannedStart)}`);
      }
    }
  } else {
    startTimeError = '';
  }

  return valid;
}
```

### Submit Handler

```typescript
function handleSubmit() {
  if (!validate()) return;

  const parsedDuration = parseDuration(duration)!;
  const taskStartTime = type === 'fixed'
    ? parseTimeToDate(startTime)
    : undefined;

  try {
    const task = sessionStore.addTask({
      name: name.trim(),
      durationSec: parsedDuration,
      type,
      startTime: taskStartTime
    });

    if (task) {
      onTaskCreated?.(task);
      resetForm();
      onClose();
    }
  } catch (error) {
    // Handle unexpected errors
    nameError = error.message;
  }
}
```

### Keyboard Handling

```typescript
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    onClose();
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
}
```

### Form Reset

```typescript
function resetForm() {
  name = '';
  duration = '';
  type = 'flexible';
  startTime = '';
  nameError = '';
  durationError = '';
  startTimeError = '';
  warnings = [];
}
```

## UI Structure

```svelte
{#if open}
  <div class="dialog-backdrop" role="dialog" aria-modal="true">
    <div class="dialog-content">
      <h2>Add Task</h2>

      <form onsubmit={handleSubmit}>
        <!-- Task Name -->
        <div class="form-group">
          <label for="task-name">Task Name</label>
          <input id="task-name" type="text" bind:value={name} />
          {#if nameError}<span class="error">{nameError}</span>{/if}
        </div>

        <!-- Duration -->
        <div class="form-group">
          <label for="duration">Duration</label>
          <input id="duration" type="text" bind:value={duration}
                 placeholder="e.g., 30m, 1h 30m" />
          {#if durationError}<span class="error">{durationError}</span>{/if}
        </div>

        <!-- Type -->
        <div class="form-group">
          <label>Type</label>
          <div class="type-buttons">
            <button type="button" class:selected={type === 'flexible'}
                    onclick={() => type = 'flexible'}>Flexible</button>
            <button type="button" class:selected={type === 'fixed'}
                    onclick={() => type = 'fixed'}>Fixed</button>
          </div>
        </div>

        <!-- Start Time (conditional) -->
        {#if type === 'fixed'}
          <div class="form-group">
            <label for="start-time">Start Time</label>
            <input id="start-time" type="time" bind:value={startTime} />
            {#if startTimeError}<span class="error">{startTimeError}</span>{/if}
          </div>
        {/if}

        <!-- Warnings -->
        {#if warnings.length > 0}
          <div class="warnings">
            {#each warnings as warning}
              <p class="warning">⚠️ {warning}</p>
            {/each}
          </div>
        {/if}

        <!-- Actions -->
        <div class="dialog-actions">
          <button type="button" onclick={onClose}>Cancel</button>
          <button type="submit">Add Task</button>
        </div>
      </form>
    </div>
  </div>
{/if}
```

## Styling

Follow existing patterns from `EditTaskDialog.svelte`:
- Tailwind CSS utility classes
- Dialog backdrop with blur
- Form input styles matching existing forms
- Error messages in red
- Warning messages in yellow/amber

## Accessibility

- `role="dialog"` and `aria-modal="true"` on backdrop
- `aria-labelledby` linking to dialog title
- Form labels associated with inputs
- Focus trap within dialog when open
- Escape key closes dialog
- Enter key submits form

## Events

| Event | Trigger | Action |
|-------|---------|--------|
| Escape key | Keydown in dialog | Call `onClose()` |
| Enter key | Keydown in dialog | Submit form |
| Backdrop click | Click outside content | Call `onClose()` |
| Cancel button | Click | Call `onClose()` |
| Submit button | Click or Enter | Validate and create task |
