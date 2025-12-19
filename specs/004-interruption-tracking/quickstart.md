# Quickstart: Interruption Tracking

**Feature**: 004-interruption-tracking
**Date**: 2025-12-19

## Overview

This guide provides a quick reference for implementing interruption tracking in the Micro Time Manager application.

## Prerequisites

- Svelte 5.x with runes syntax
- Existing timerStore and sessionStore implementations
- Existing storage service

## Implementation Order

### Phase 1: Core Types & Store

1. **Add types to `src/lib/types/index.ts`**:
   - `InterruptionCategory` type
   - `Interruption` interface
   - `InterruptionSummary` interface
   - `STORAGE_KEY_INTERRUPTIONS` constant
   - `INTERRUPTION_CATEGORIES` array

2. **Create `src/lib/stores/interruptionStore.svelte.ts`**:
   ```typescript
   // State
   let isInterrupted = $state(false);
   let activeInterruption = $state<Interruption | null>(null);
   let elapsedMs = $state(0);
   let interruptions = $state<Interruption[]>([]);

   // Actions
   startInterruption(taskId: string): void
   endInterruption(): Interruption
   updateInterruption(id: string, updates: Partial<Pick<Interruption, 'category' | 'note'>>): void
   getTaskSummary(taskId: string): InterruptionSummary
   reset(): void
   restore(saved: Interruption[]): void
   ```

3. **Extend `src/lib/services/storage.ts`**:
   - `saveInterruptions(interruptions: Interruption[]): boolean`
   - `loadInterruptions(): Interruption[]`
   - `clearInterruptions(): boolean`
   - Update schema version 2 → 3

### Phase 2: UI Components

4. **Create `InterruptButton.svelte`**:
   - Props: `isInterrupted`, `canInterrupt`, `onInterrupt`, `onResume`
   - Shows "Interrupt" or "Resume" based on state
   - Keyboard hint: "I" or "R"

5. **Create `InterruptionTimer.svelte`**:
   - Props: `elapsedMs`
   - Shows interruption duration in MM:SS format
   - Distinct styling (e.g., orange/amber background)

6. **Create `InterruptionSummary.svelte`**:
   - Props: `count`, `totalDurationSec`, `onEditLast`
   - Shows "2 interruptions (5m 30s)"
   - "Edit" link for most recent

7. **Create `EditInterruptionDialog.svelte`**:
   - Props: `interruption`, `open`, `onSave`, `onClose`
   - Category radio buttons
   - Note textarea (max 200 chars)

### Phase 3: Integration

8. **Update `+page.svelte`**:
   - Import interruptionStore
   - Add keyboard listener (I/R keys)
   - Add InterruptButton to timer-column
   - Add InterruptionTimer (when interrupted)
   - Add InterruptionSummary below lag-section
   - Handle auto-end on task/session completion

9. **Update `sessionStore.svelte.ts`**:
   - Check for active interruption in completeTask()
   - Check for active interruption in endDay()

### Phase 4: Testing

10. **Create `tests/unit/interruptionStore.test.ts`**:
    - Test startInterruption()
    - Test endInterruption()
    - Test updateInterruption()
    - Test getTaskSummary()
    - Test edge cases (already interrupted, no task, etc.)

11. **Create `tests/e2e/interruption-tracking.test.ts`**:
    - Test interrupt/resume flow
    - Test keyboard shortcuts
    - Test category/note editing
    - Test summary display

## Key Code Snippets

### Starting an Interruption

```typescript
// In interruptionStore
startInterruption(taskId: string): void {
  if (isInterrupted) throw new Error('Already interrupted');

  const interruption: Interruption = {
    interruptionId: generateUUID(),
    taskId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSec: 0,
    category: null,
    note: null
  };

  activeInterruption = interruption;
  isInterrupted = true;

  // Start interruption timer
  interruptionTimer = createTimer({ onTick: (e) => elapsedMs = e });
  interruptionTimer.start(0);
}
```

### Ending an Interruption

```typescript
// In interruptionStore
endInterruption(): Interruption {
  if (!isInterrupted || !activeInterruption) throw new Error('Not interrupted');

  const elapsed = interruptionTimer?.stop() ?? 0;
  const durationSec = Math.floor(elapsed / 1000);

  const completed: Interruption = {
    ...activeInterruption,
    endedAt: new Date().toISOString(),
    durationSec
  };

  interruptions = [...interruptions, completed];
  activeInterruption = null;
  isInterrupted = false;
  elapsedMs = 0;

  storage.saveInterruptions(interruptions);
  return completed;
}
```

### Page Integration

```svelte
<script lang="ts">
  import { interruptionStore } from '$lib/stores/interruptionStore.svelte';

  function handleInterrupt() {
    const taskId = sessionStore.currentTask?.taskId;
    if (!taskId) return;

    const elapsedMs = timerStore.stop(); // Pause task timer
    interruptionStore.startInterruption(taskId);
    // Store elapsed for resume
    pausedTaskElapsedMs = elapsedMs;
  }

  function handleResume() {
    interruptionStore.endInterruption();
    // Resume task timer from where it left off
    if (sessionStore.currentProgress) {
      timerStore.start(sessionStore.currentProgress.plannedDurationSec, pausedTaskElapsedMs);
    }
  }
</script>
```

## Testing Checklist

- [ ] Interrupt button appears when task is running
- [ ] Resume button appears when interrupted
- [ ] "I" key triggers interrupt
- [ ] "R" key triggers resume
- [ ] Task timer pauses during interruption
- [ ] Interruption timer counts up
- [ ] Task timer resumes at correct position
- [ ] Summary shows count and total time
- [ ] Edit dialog allows category/note
- [ ] Data persists across refresh
- [ ] Auto-ends on task completion
- [ ] Auto-ends on session end

## Documentation Updates Required

1. **API.md**: Add interruptionStore methods and types
2. **USER_GUIDE.md**: Add "Managing Interruptions" section
3. **DATA_SCHEMA.md**: Add Interruption entity and storage key
4. **CHANGELOG.md**: Document new feature
