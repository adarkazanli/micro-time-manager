# Quickstart: Automatic Start Time Calculation

**Feature**: 011-auto-start-time
**Date**: 2025-12-26

## Overview

This feature adds automatic calculation of task start times based on sequence and duration, with support for fixed-time appointments that cannot be moved.

## Key Concepts

### Flexible vs Fixed Tasks

- **Flexible tasks**: Start time is automatically calculated based on position in the list
- **Fixed tasks**: Start at a specific user-defined time, other tasks schedule around them

### Schedule Start Time

Users can choose:
- **Start Now**: Schedule begins at the current time
- **Custom Time**: Schedule begins at a specific time (e.g., 9:30 AM)

### Task Interruption

When a fixed task is scheduled during a flexible task's duration, the flexible task:
1. Pauses when the fixed task starts
2. Resumes after the fixed task completes
3. Shows remaining time in the UI

## Quick Implementation Guide

### 1. Using the Schedule Calculator

```typescript
import { calculateSchedule } from '$lib/services/scheduleCalculator';
import type { ScheduleConfig } from '$lib/types';

// Calculate schedule starting now
const result = calculateSchedule(tasks, {
  mode: 'now',
  customStartTime: null
});

// Calculate schedule starting at 9:30 AM
const result = calculateSchedule(tasks, {
  mode: 'custom',
  customStartTime: new Date('2025-12-26T09:30:00')
});

// Access results
result.scheduledTasks.forEach(st => {
  console.log(`${st.task.name}:`);
  console.log(`  Starts: ${st.calculatedStart}`);
  console.log(`  Ends: ${st.calculatedEnd}`);
  if (st.isInterrupted) {
    console.log(`  Interrupted at: ${st.pauseTime}`);
    console.log(`  Remaining: ${st.remainingDurationSec}s`);
  }
});

// Check for issues
if (result.hasOverflow) {
  console.warn('Schedule extends past midnight');
}
result.conflicts.forEach(c => {
  console.warn(`Conflict: ${c.message}`);
});
```

### 2. Using ScheduleStartPicker

```svelte
<script lang="ts">
  import ScheduleStartPicker from '$lib/components/ScheduleStartPicker.svelte';
  import type { ScheduleConfig } from '$lib/types';

  let config: ScheduleConfig = $state({
    mode: 'now',
    customStartTime: null
  });
</script>

<ScheduleStartPicker
  bind:config
  disabled={sessionActive}
/>
```

### 3. Displaying Calculated Times

```svelte
<script lang="ts">
  import { calculateSchedule } from '$lib/services/scheduleCalculator';
  import FixedTaskIndicator from '$lib/components/FixedTaskIndicator.svelte';

  const result = $derived(calculateSchedule(tasks, scheduleConfig));
</script>

{#each result.scheduledTasks as st}
  <div class="task-row">
    {#if st.task.type === 'fixed'}
      <FixedTaskIndicator size="sm" />
    {/if}
    <span class="time">{formatTime(st.calculatedStart)}</span>
    <span class="name">{st.task.name}</span>
    {#if st.isInterrupted}
      <span class="badge">
        ⏸️ Pauses at {formatTime(st.pauseTime)}
      </span>
    {/if}
  </div>
{/each}

{#if result.hasOverflow}
  <ScheduleOverflowWarning scheduleEndTime={result.scheduleEndTime} />
{/if}
```

### 4. Adding a Fixed Task

```svelte
<script lang="ts">
  import { sessionStore } from '$lib/stores/sessionStore.svelte';

  function addFixedTask() {
    sessionStore.addTask({
      name: 'Team Meeting',
      durationSec: 3600, // 1 hour
      type: 'fixed',
      startTime: new Date('2025-12-26T14:00:00')
    });
  }

  function addFlexibleTask() {
    sessionStore.addTask({
      name: 'Code Review',
      durationSec: 1800, // 30 minutes
      type: 'flexible'
      // No startTime - will be auto-calculated
    });
  }
</script>
```

## File Locations

| File | Purpose |
|------|---------|
| `src/lib/services/scheduleCalculator.ts` | Core scheduling algorithm |
| `src/lib/components/ScheduleStartPicker.svelte` | Start time configuration UI |
| `src/lib/components/ScheduleOverflowWarning.svelte` | Midnight overflow warning |
| `src/lib/components/FixedTaskIndicator.svelte` | Pin icon for fixed tasks |
| `src/lib/components/ConflictWarning.svelte` | Fixed task conflict warning |
| `src/lib/types/index.ts` | Type definitions |

## Testing

Run the schedule calculator tests:

```bash
npm test -- scheduleCalculator
```

Key test scenarios:
- Sequential task scheduling
- Fixed task respecting scheduled time
- Task interruption by fixed task
- Overnight overflow detection
- Fixed task conflict detection

## Common Patterns

### Reactive Recalculation

```svelte
<script lang="ts">
  // Schedule recalculates automatically when tasks or config change
  const schedule = $derived(calculateSchedule(tasks, config));
</script>
```

### Handling Interruptions in UI

```svelte
{#if scheduledTask.isInterrupted}
  <div class="interruption-info">
    <span>Works until {formatTime(scheduledTask.pauseTime)}</span>
    <span>({formatDuration(scheduledTask.durationBeforePauseSec)})</span>
    <span>Continues after fixed task</span>
    <span>({formatDuration(scheduledTask.remainingDurationSec)} remaining)</span>
  </div>
{/if}
```

### Conflict Resolution UI

```svelte
{#each schedule.conflicts as conflict}
  <ConflictWarning {conflict} on:dismiss={() => dismissConflict(conflict)} />
{/each}
```
