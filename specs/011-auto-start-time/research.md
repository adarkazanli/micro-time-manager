# Research: Automatic Start Time Calculation

**Feature**: 011-auto-start-time
**Date**: 2025-12-26

## Research Summary

This document captures research findings and design decisions for implementing automatic start time calculation in the Micro Time Manager application.

---

## 1. Existing Codebase Analysis

### Current Projection Service

**Decision**: Extend the existing `projection.ts` service rather than replace it.

**Rationale**: The current `projection.ts` already handles:
- Calculating projected start times for tasks based on current progress
- Respecting fixed task constraints (fixed tasks wait for their scheduled time)
- Risk level calculation for fixed tasks
- Buffer time calculations

The existing `calculateProjectedStart()` and `createProjectedTasks()` functions provide a solid foundation. We need to:
1. Add a configurable schedule start time (currently hardcoded to "now")
2. Add task interruption/resumption logic when fixed tasks interrupt flexible tasks
3. Add overnight overflow detection and warning

**Alternatives considered**:
- Creating a completely new scheduling service: Rejected because it would duplicate existing logic and violate DRY principle.
- Replacing projection.ts entirely: Rejected because it would break existing ImpactPanel functionality.

### Current Data Model

The existing `ConfirmedTask` type already has:
- `type: 'fixed' | 'flexible'` - Distinguishes fixed-time from flexible tasks
- `plannedStart: Date` - The scheduled start time
- `plannedDurationSec: number` - Duration in seconds

**Decision**: Add a `calculatedStart` field to distinguish between the user-set planned time and the system-calculated start time.

**Rationale**: For flexible tasks, `plannedStart` should be auto-calculated. For fixed tasks, `plannedStart` is user-defined. Having a separate `calculatedStart` field for display purposes allows us to:
- Preserve original planned times
- Show calculated times in the UI
- Track when fixed tasks cause delays

**Alternative considered**:
- Storing only calculated times: Rejected because we need to preserve original planned times for fixed tasks.

---

## 2. Schedule Start Time Configuration

### UI Placement

**Decision**: Add ScheduleStartPicker component to the schedule preview/import workflow.

**Rationale**: The schedule start time should be configurable:
1. During schedule import (before confirming tasks)
2. On the main view when no session is active

**Alternatives considered**:
- Settings panel only: Rejected because start time often varies by day.
- Per-task start time editing: Rejected as too complex; only fixed tasks need user-set times.

### Default Behavior

**Decision**: Default to "Start Now" with option to set a specific time.

**Rationale**: Most users want to start immediately. The UI should:
1. Show "Start Now" as the default/prominent option
2. Provide a time picker for setting a specific start time
3. Store the preference in the session (not globally)

---

## 3. Task Interruption Algorithm

### Core Algorithm

**Decision**: Implement a single-pass O(n) algorithm that:
1. Iterates through tasks in order
2. Tracks "next available time" as a running cursor
3. For fixed tasks: max(nextAvailable, fixedStartTime)
4. For flexible tasks interrupted by fixed: split into segments

**Rationale**: Per spec requirement, the algorithm must be O(n) efficient. A single forward pass with a time cursor achieves this.

**Pseudocode**:
```
function calculateSchedule(tasks, scheduleStartTime):
  cursor = scheduleStartTime
  results = []

  for each task in tasks:
    if task.type === 'fixed':
      if cursor < task.plannedStart:
        // Fixed task in future - fill gap or wait
        taskStart = task.plannedStart
      else:
        // We're running late - fixed task starts at cursor (will be late)
        taskStart = cursor
    else:
      // Flexible task starts at cursor
      taskStart = cursor

    taskEnd = taskStart + task.duration

    // Check if a fixed task interrupts this task
    nextFixed = findNextFixedTask(tasks, currentIndex)
    if nextFixed and taskEnd > nextFixed.plannedStart:
      // Task will be interrupted
      segment1End = nextFixed.plannedStart
      remainingDuration = taskEnd - segment1End
      // Mark task as interrupted, store remaining duration

    cursor = taskEnd
    results.push({ task, start: taskStart, end: taskEnd, ... })

  return results
```

### Interruption Display

**Decision**: When a task is interrupted, display it as a single task with "remaining" time indicator.

**Rationale**:
- Simpler UI than showing multiple segments
- Matches user mental model of "this task will pause and resume"
- Existing `ImpactTaskRow` can be extended to show remaining time

**Alternative considered**:
- Split into multiple visual rows: Rejected as too complex and confusing.

---

## 4. Overflow Warning

### Detection

**Decision**: Compare the final task's calculated end time against midnight.

**Rationale**: Simple comparison gives O(1) check at end of calculation.

### Warning Display

**Decision**: Show a banner/indicator at the bottom of the task list when overflow detected.

**Rationale**:
- Non-intrusive but visible
- Doesn't block user workflow (per spec clarification)
- Can show "Schedule extends past midnight" message

---

## 5. Fixed Task Visual Indicator

### Current Implementation

The existing codebase already has:
- `FixedTaskWarning.svelte` component for warning when fixed tasks are at risk
- Risk level coloring (green/yellow/red) in `ImpactTaskRow`

**Decision**: Add a pin/lock icon to fixed tasks in all views.

**Rationale**:
- Consistent with common scheduling app patterns
- Distinguishes fixed from flexible at a glance
- Icon can be placed next to task name

---

## 6. Conflict Warning

### Overlap Detection

**Decision**: Check for fixed task time overlaps during the scheduling calculation.

**Rationale**:
- Single pass can detect overlaps by comparing fixed task times
- Store conflicts in the calculation result for display

### Warning Display

**Decision**: Show inline warning on conflicting tasks with option to proceed.

**Rationale**:
- Per spec: warnings are non-blocking
- User can see conflicts and choose to resolve or ignore
- Similar to existing `hasWarning` field on `DraftTask`

---

## 7. Performance Considerations

### Debouncing

**Decision**: Use 300ms debounce for recalculation during rapid edits.

**Rationale**:
- Prevents excessive recalculation during typing
- 300ms is short enough to feel responsive
- Matches existing patterns in the codebase

### Recalculation Triggers

Recalculation should occur when:
1. Task added/removed
2. Task duration changed
3. Task reordered
4. Schedule start time changed
5. Fixed task start time changed

**Decision**: Implement reactive recalculation using Svelte 5 `$derived` state.

**Rationale**:
- Automatic dependency tracking
- No manual trigger management needed
- Consistent with existing store patterns

---

## 8. Testing Strategy

### Unit Tests

1. `scheduleCalculator.test.ts`:
   - Sequential task scheduling from start time
   - Fixed task respecting scheduled time
   - Task interruption by fixed task
   - Multiple consecutive fixed tasks
   - Overnight overflow detection
   - Conflict detection between fixed tasks

2. `projection.test.ts` (extend existing):
   - Integration with new calculator
   - Risk level with new scheduling

### Component Tests

1. `ScheduleStartPicker.test.ts`:
   - "Start Now" default behavior
   - Time picker functionality
   - Value persistence

---

## Decisions Summary

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| Service architecture | Extend `projection.ts`, add `scheduleCalculator.ts` | Reuse existing logic, separation of concerns |
| Data model | Add `calculatedStart` to display layer | Preserve planned times, show calculated times |
| Start time UI | ScheduleStartPicker component | Configurable per-session, not global |
| Algorithm | Single-pass O(n) with time cursor | Performance requirement |
| Interruption display | Single task with "remaining" indicator | Simpler UI |
| Fixed task indicator | Pin/lock icon | Industry standard pattern |
| Conflict warnings | Inline, non-blocking | Per spec clarification |
| Recalculation | Reactive with 300ms debounce | Responsive yet efficient |
