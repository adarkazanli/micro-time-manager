# Data Model: Automatic Start Time Calculation

**Feature**: 011-auto-start-time
**Date**: 2025-12-26

## Overview

This document defines the data model additions and modifications for the automatic start time calculation feature. All types extend the existing type system in `src/lib/types/index.ts`.

---

## New Types

### ScheduleStartMode

Defines how the schedule start time is determined.

```typescript
/**
 * Mode for determining schedule start time.
 * - 'now': Start immediately from current time
 * - 'custom': Start at a user-specified time
 */
export type ScheduleStartMode = 'now' | 'custom';
```

### ScheduleConfig

Configuration for schedule timing.

```typescript
/**
 * Configuration for schedule start time.
 * Stored in the session to allow per-day customization.
 */
export interface ScheduleConfig {
  /** How the start time is determined */
  mode: ScheduleStartMode;

  /** Custom start time (required when mode is 'custom') */
  customStartTime: Date | null;
}
```

### ScheduledTask

Extended task representation with calculated timing.

```typescript
/**
 * A task with calculated scheduling information.
 * Computed by the schedule calculator, not persisted.
 */
export interface ScheduledTask {
  /** Reference to the original confirmed task */
  task: ConfirmedTask;

  /** Calculated start time based on schedule */
  calculatedStart: Date;

  /** Calculated end time (calculatedStart + duration) */
  calculatedEnd: Date;

  /** Whether this task will be interrupted by a fixed task */
  isInterrupted: boolean;

  /** Time when task will be paused (if interrupted) */
  pauseTime: Date | null;

  /** Duration before interruption in seconds (if interrupted) */
  durationBeforePauseSec: number;

  /** Remaining duration after interruption in seconds (if interrupted) */
  remainingDurationSec: number;
}
```

### ScheduleResult

Complete result of schedule calculation.

```typescript
/**
 * Result of calculating the full schedule.
 * Returned by the schedule calculator service.
 */
export interface ScheduleResult {
  /** All tasks with calculated timings */
  scheduledTasks: ScheduledTask[];

  /** Whether schedule extends past midnight */
  hasOverflow: boolean;

  /** End time of the last task */
  scheduleEndTime: Date;

  /** Fixed task conflicts (overlapping fixed tasks) */
  conflicts: FixedTaskConflict[];
}
```

### FixedTaskConflict

Represents an overlap between two fixed tasks.

```typescript
/**
 * Represents a conflict between two fixed tasks.
 * Created when fixed task times overlap.
 */
export interface FixedTaskConflict {
  /** First task in conflict */
  taskId1: string;

  /** Second task in conflict */
  taskId2: string;

  /** Overlap duration in seconds */
  overlapSec: number;

  /** Human-readable conflict description */
  message: string;
}
```

---

## Modified Types

### DaySession (Extension)

Add schedule configuration to the session.

```typescript
// Additions to existing DaySession interface
export interface DaySession {
  // ... existing fields ...

  /**
   * Schedule start configuration.
   * @new 011-auto-start-time
   */
  scheduleConfig: ScheduleConfig;
}
```

### Settings (Extension)

Add default schedule start time preference.

```typescript
// Additions to existing Settings interface
export interface Settings {
  // ... existing fields ...

  /**
   * Default schedule start time (HH:MM format).
   * Used when creating a new schedule.
   * Empty string means "Start Now" is default.
   * @new 011-auto-start-time
   */
  defaultScheduleStartTime: string;
}
```

---

## New Constants

```typescript
/** localStorage key for schedule config (within session) */
export const STORAGE_KEY_SCHEDULE_CONFIG = 'tm_schedule_config';

/** Midnight in milliseconds from start of day */
export const MIDNIGHT_MS = 24 * 60 * 60 * 1000;
```

---

## Entity Relationships

```
┌─────────────────┐      ┌─────────────────┐
│  ScheduleConfig │──────│   DaySession    │
│                 │  1:1 │                 │
│ - mode          │      │ - scheduleConfig│
│ - customStart   │      │ - tasks[]       │
└─────────────────┘      └────────┬────────┘
                                  │
                                  │ contains
                                  ▼
                         ┌─────────────────┐
                         │ ConfirmedTask   │
                         │                 │
                         │ - taskId        │
                         │ - type          │
                         │ - plannedStart  │
                         │ - duration      │
                         └────────┬────────┘
                                  │
                                  │ calculated to
                                  ▼
                         ┌─────────────────┐
                         │  ScheduledTask  │
                         │                 │
                         │ - task (ref)    │
                         │ - calculatedStart│
                         │ - calculatedEnd │
                         │ - isInterrupted │
                         │ - pauseTime     │
                         │ - remainingDur  │
                         └─────────────────┘
```

---

## State Transitions

### ScheduleConfig States

```
[Initial]
    │
    ▼ User imports/creates schedule
┌─────────────────┐
│ mode: 'now'     │ ──── Default state
│ customStart:null│
└────────┬────────┘
         │
         │ User sets custom time
         ▼
┌─────────────────┐
│ mode: 'custom'  │
│ customStart:Date│
└────────┬────────┘
         │
         │ User clicks "Start Now"
         ▼
┌─────────────────┐
│ mode: 'now'     │
│ customStart:null│
└─────────────────┘
```

### ScheduledTask Interruption States

```
[Normal Task]
isInterrupted: false
pauseTime: null
remainingDurationSec: 0

     │
     │ Fixed task scheduled during this task's duration
     ▼

[Interrupted Task]
isInterrupted: true
pauseTime: Date (when fixed task starts)
durationBeforePauseSec: time worked before pause
remainingDurationSec: time remaining after fixed task ends
```

---

## Validation Rules

### ScheduleConfig

| Field | Rule |
|-------|------|
| mode | Must be 'now' or 'custom' |
| customStartTime | Required when mode is 'custom'; must be a valid Date |
| customStartTime | Should be today's date (validated in UI) |

### ScheduledTask

| Field | Rule |
|-------|------|
| calculatedStart | Must be >= schedule start time |
| calculatedEnd | Must be > calculatedStart |
| pauseTime | If set, must be > calculatedStart and < original calculatedEnd |
| remainingDurationSec | If interrupted, must be > 0 |
| durationBeforePauseSec + remainingDurationSec | Must equal task.plannedDurationSec |

### FixedTaskConflict

| Field | Rule |
|-------|------|
| taskId1, taskId2 | Must reference existing fixed tasks |
| overlapSec | Must be > 0 |

---

## Schema Version

This feature increments the schema version from 6 to 7:

```typescript
export const CURRENT_SCHEMA_VERSION = 7;
```

### Migration from v6 to v7

```typescript
function migrateV6ToV7(session: DaySessionV6): DaySessionV7 {
  return {
    ...session,
    scheduleConfig: {
      mode: 'now',
      customStartTime: null
    }
  };
}
```

Settings migration:

```typescript
function migrateSettingsV1ToV2(settings: SettingsV1): SettingsV2 {
  return {
    ...settings,
    defaultScheduleStartTime: ''  // Empty = "Start Now" default
  };
}
```
