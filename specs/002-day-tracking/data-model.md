# Data Model: Day Tracking Timer

**Feature**: 002-day-tracking
**Date**: 2025-12-18
**Phase**: 1 (Design)

## Overview

This document defines the data structures for the Day Tracking Timer feature. The model extends the existing 001-schedule-import types and maintains schema version compatibility.

## Entity Relationships

```
┌─────────────────┐         ┌─────────────────┐
│  ConfirmedTask  │         │   DaySession    │
│  (from 001)     │◄────────│                 │
└─────────────────┘    *    │  - sessionId    │
        │                   │  - startedAt    │
        │ 1                 │  - status       │
        ▼                   │  - totalLagSec  │
┌─────────────────┐         └────────┬────────┘
│  TaskProgress   │                  │
│                 │◄─────────────────┘
│  - taskId       │         1..*
│  - status       │
│  - actualSec    │
└─────────────────┘
        │
        │ 0..1 (current task)
        ▼
┌─────────────────┐
│  TimerState     │
│                 │
│  - elapsed      │
│  - remaining    │
│  - displayColor │
└─────────────────┘
```

## Type Definitions

### Enums and Literals

```typescript
/** Timer visual state based on remaining time */
export type TimerColor = 'green' | 'yellow' | 'red';

/** Day session execution status */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'complete';

/** Individual task progress status */
export type ProgressStatus = 'pending' | 'active' | 'complete' | 'missed';
```

### Core Entities

#### TaskProgress

Tracks execution state for each task in the session.

```typescript
/**
 * Runtime state for a single task's execution.
 * Created when session starts, updated during tracking.
 */
export interface TaskProgress {
    /** Reference to ConfirmedTask.taskId */
    taskId: string;

    /** Planned duration from ConfirmedTask (seconds) */
    plannedDurationSec: number;

    /** Actual time spent (seconds), updated on completion */
    actualDurationSec: number;

    /** When task was completed, null if incomplete */
    completedAt: Date | null;

    /** Current execution state */
    status: ProgressStatus;
}
```

**Validation Rules**:
- `taskId` must reference an existing `ConfirmedTask.taskId`
- `plannedDurationSec` must equal `ConfirmedTask.plannedDurationSec`
- `actualDurationSec` >= 0
- `completedAt` must be set when `status === 'complete'`

#### DaySession

Represents a single day's tracking session.

```typescript
/**
 * Complete state for a day's schedule execution.
 * Persisted to localStorage.
 */
export interface DaySession {
    /** Unique session identifier (UUID v4) */
    sessionId: string;

    /** When "Start Day" was clicked (ISO string for persistence) */
    startedAt: string;

    /** When session ended, null if ongoing */
    endedAt: string | null;

    /** Current session state */
    status: SessionStatus;

    /** Index of current task in taskProgress array (0-based) */
    currentTaskIndex: number;

    /** Elapsed time on current task (milliseconds) */
    currentTaskElapsedMs: number;

    /** Last time state was persisted (epoch ms, for recovery) */
    lastPersistedAt: number;

    /** Cumulative lag in seconds (negative = ahead, positive = behind) */
    totalLagSec: number;

    /** Progress records for all tasks */
    taskProgress: TaskProgress[];
}
```

**Validation Rules**:
- `sessionId` must be valid UUID v4
- `startedAt` must be valid ISO 8601 date string
- `currentTaskIndex` must be within `taskProgress` bounds
- `currentTaskElapsedMs` >= 0
- `taskProgress` length must match confirmed schedule task count

#### TimerState

Computed state for UI display (not persisted).

```typescript
/**
 * Derived timer state for display components.
 * Computed from DaySession, not stored directly.
 */
export interface TimerState {
    /** Milliseconds elapsed on current task */
    elapsedMs: number;

    /** Milliseconds remaining (can be negative if overtime) */
    remainingMs: number;

    /** Visual indicator based on remaining time */
    color: TimerColor;

    /** Whether timer is actively counting */
    isRunning: boolean;

    /** Formatted display string (e.g., "12:34" or "-2:15") */
    displayTime: string;
}
```

**Color Thresholds**:
- `green`: remainingMs > 300000 (5 minutes)
- `yellow`: 0 < remainingMs <= 300000
- `red`: remainingMs <= 0

#### TabInfo

Multi-tab coordination state.

```typescript
/**
 * Active tab tracking for multi-tab detection.
 * Stored in localStorage for cross-tab visibility.
 */
export interface TabInfo {
    /** Unique identifier for this browser tab (UUID v4) */
    tabId: string;

    /** When this tab claimed leadership (epoch ms) */
    activeSince: number;

    /** Last heartbeat timestamp (epoch ms) */
    lastHeartbeat: number;
}
```

**Validation Rules**:
- Tab is considered stale if `Date.now() - lastHeartbeat > 5000`
- Heartbeat should be updated every 2000ms by active tab

#### FixedTaskWarning

Warning state for upcoming fixed task conflicts.

```typescript
/**
 * Warning when current pace will miss a fixed task.
 */
export interface FixedTaskWarning {
    /** The fixed task at risk */
    taskId: string;

    /** Task name for display */
    taskName: string;

    /** Projected minutes late */
    minutesLate: number;

    /** Fixed task's planned start time */
    plannedStart: string;
}
```

#### DaySummary

End-of-day completion statistics.

```typescript
/**
 * Summary statistics shown when all tasks are complete.
 */
export interface DaySummary {
    /** Total time planned (seconds) */
    totalPlannedSec: number;

    /** Total time actually spent (seconds) */
    totalActualSec: number;

    /** Final lag (actualSec - plannedSec) */
    finalLagSec: number;

    /** Tasks completed on time */
    tasksOnTime: number;

    /** Tasks completed late */
    tasksLate: number;

    /** Tasks marked as missed */
    tasksMissed: number;

    /** Session duration (startedAt to endedAt) */
    sessionDurationSec: number;
}
```

## Storage Schema

### localStorage Keys

```typescript
// From 001-schedule-import (unchanged)
export const STORAGE_KEY_TASKS = 'tm_tasks';
export const STORAGE_KEY_SCHEMA = 'tm_schema_version';

// New for 002-day-tracking
export const STORAGE_KEY_SESSION = 'tm_session';
export const STORAGE_KEY_TAB = 'tm_active_tab';

// Schema version bump
export const CURRENT_SCHEMA_VERSION = 2;
```

### Storage Format

```json
{
    "tm_schema_version": 2,
    "tm_tasks": [
        {
            "taskId": "uuid",
            "name": "Task name",
            "plannedStart": "2025-12-18T09:00:00.000Z",
            "plannedDurationSec": 1800,
            "type": "flexible",
            "sortOrder": 0,
            "status": "complete"
        }
    ],
    "tm_session": {
        "sessionId": "uuid",
        "startedAt": "2025-12-18T09:00:00.000Z",
        "endedAt": null,
        "status": "running",
        "currentTaskIndex": 1,
        "currentTaskElapsedMs": 45000,
        "lastPersistedAt": 1734523245000,
        "totalLagSec": -120,
        "taskProgress": [
            {
                "taskId": "uuid-1",
                "plannedDurationSec": 1800,
                "actualDurationSec": 1680,
                "completedAt": "2025-12-18T09:28:00.000Z",
                "status": "complete"
            },
            {
                "taskId": "uuid-2",
                "plannedDurationSec": 3600,
                "actualDurationSec": 0,
                "completedAt": null,
                "status": "active"
            }
        ]
    },
    "tm_active_tab": {
        "tabId": "tab-uuid",
        "activeSince": 1734523200000,
        "lastHeartbeat": 1734523245000
    }
}
```

### Schema Migration (v1 → v2)

```typescript
function migrateV1toV2(data: StorageV1): StorageV2 {
    return {
        ...data,
        tm_schema_version: 2,
        tm_session: null,     // No active session
        tm_active_tab: null   // No active tab
    };
}
```

## State Derivations

### Lag Calculation

```typescript
function calculateLag(session: DaySession): number {
    let lagSec = 0;

    for (const progress of session.taskProgress) {
        if (progress.status === 'complete') {
            lagSec += progress.actualDurationSec - progress.plannedDurationSec;
        }
    }

    return lagSec;
}
```

### Fixed Task Warning Detection

```typescript
function detectFixedTaskConflict(
    session: DaySession,
    tasks: ConfirmedTask[]
): FixedTaskWarning | null {
    const currentIndex = session.currentTaskIndex;
    const currentElapsed = session.currentTaskElapsedMs / 1000;
    const currentPlanned = session.taskProgress[currentIndex].plannedDurationSec;

    // Project completion time assuming current task takes full planned time
    let projectedTime = Date.now() + (currentPlanned - currentElapsed) * 1000;

    for (let i = currentIndex + 1; i < tasks.length; i++) {
        const task = tasks[i];

        if (task.type === 'fixed') {
            const fixedStart = new Date(task.plannedStart).getTime();

            if (projectedTime > fixedStart) {
                return {
                    taskId: task.taskId,
                    taskName: task.name,
                    minutesLate: Math.ceil((projectedTime - fixedStart) / 60000),
                    plannedStart: task.plannedStart.toISOString()
                };
            }
        }

        // Add task duration to projected time
        projectedTime += tasks[i].plannedDurationSec * 1000;
    }

    return null;
}
```

### Timer Color Derivation

```typescript
function getTimerColor(remainingMs: number): TimerColor {
    if (remainingMs <= 0) return 'red';
    if (remainingMs <= 300000) return 'yellow';  // 5 minutes
    return 'green';
}
```

## Index Reference

### Types to Export

| Type | File | Purpose |
|------|------|---------|
| `TimerColor` | `types/index.ts` | Timer visual state enum |
| `SessionStatus` | `types/index.ts` | Day session status enum |
| `ProgressStatus` | `types/index.ts` | Task progress status enum |
| `TaskProgress` | `types/index.ts` | Individual task tracking |
| `DaySession` | `types/index.ts` | Complete session state |
| `TimerState` | `types/index.ts` | Derived display state |
| `TabInfo` | `types/index.ts` | Multi-tab coordination |
| `FixedTaskWarning` | `types/index.ts` | Conflict warning |
| `DaySummary` | `types/index.ts` | End-of-day statistics |

### Constants to Export

| Constant | Value | Purpose |
|----------|-------|---------|
| `STORAGE_KEY_SESSION` | `'tm_session'` | localStorage key |
| `STORAGE_KEY_TAB` | `'tm_active_tab'` | localStorage key |
| `WARNING_THRESHOLD_MS` | `300000` | 5 min yellow threshold |
| `TAB_STALE_THRESHOLD_MS` | `5000` | Tab heartbeat timeout |
| `TAB_HEARTBEAT_INTERVAL_MS` | `2000` | Heartbeat frequency |
| `PERSIST_INTERVAL_MS` | `5000` | State save frequency |
