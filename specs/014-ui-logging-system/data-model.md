# Data Model: UI Logging System

**Feature**: 014-ui-logging-system
**Date**: 2026-01-03

## Entities

### LogEntry

Represents a single logged UI interaction.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier for the log entry |
| `timestamp` | string (ISO 8601) | Yes | When the action occurred, with millisecond precision |
| `action` | LogAction | Yes | The type of action performed (enum) |
| `taskId` | string \| null | No | Current task ID when action occurred |
| `taskName` | string \| null | No | Current task name when action occurred |
| `elapsedMs` | number \| null | No | Timer elapsed time in ms when action occurred |
| `sessionStatus` | SessionStatus | Yes | Session state: 'idle' \| 'running' \| 'complete' |
| `parameters` | Record<string, unknown> | No | Action-specific additional data |

### LogAction (Enum)

Defined action types for FR-002 compliance:

| Value | Description | Parameters |
|-------|-------------|------------|
| `START_DAY` | Start Day button pressed | none |
| `COMPLETE_TASK` | Complete Task button pressed | `taskId`, `elapsedMs` |
| `START_TASK` | Start/Resume Task pressed | `targetTaskId`, `previousElapsedMs` |
| `END_DAY` | End Day button pressed | none |
| `INTERRUPT` | Interrupt button pressed | `taskId` |
| `RESUME_INTERRUPT` | Resume from Interrupt pressed | `interruptionDurationMs` |
| `ADD_TASK` | Add Task dialog submitted | `taskName`, `taskType`, `duration` |
| `REORDER_TASK` | Task reorder action | `fromIndex`, `toIndex` |
| `EDIT_TASK` | Edit Task action | `taskId`, `changedFields` |
| `UNCOMPLETE_TASK` | Uncomplete Task action | `taskId` |
| `BACK_TO_IMPORT` | Back to Import pressed | none |
| `START_NEW_DAY` | Start New Day pressed | none |

### LogStore State

Runtime state managed by the logStore:

| Field | Type | Description |
|-------|------|-------------|
| `entries` | LogEntry[] | All log entries, newest first |
| `isLoaded` | boolean | Whether logs have been loaded from storage |

## Relationships

```
┌─────────────────┐
│    LogEntry     │
├─────────────────┤
│ id              │
│ timestamp       │
│ action ─────────┼──> LogAction (enum)
│ taskId          │──> ConfirmedTask.taskId (optional reference)
│ taskName        │
│ elapsedMs       │
│ sessionStatus ──┼──> SessionStatus ('idle'|'running'|'complete')
│ parameters      │
└─────────────────┘
```

## Validation Rules

### LogEntry

1. `id` MUST be a valid UUID v4 string
2. `timestamp` MUST be a valid ISO 8601 string with milliseconds
3. `action` MUST be one of the defined LogAction enum values
4. `sessionStatus` MUST be one of: 'idle', 'running', 'complete'
5. `parameters` keys and values MUST be JSON-serializable
6. `taskId` and `taskName` SHOULD both be present or both be null

### Storage

1. Total entries MUST NOT exceed 1000
2. When adding entry that would exceed limit, oldest entries MUST be removed first
3. Entries MUST be stored in chronological order (oldest first in storage, newest first in display)

## State Transitions

LogEntry creation is a point-in-time capture; entries are immutable after creation.

```
[No Logs] ─── logAction() ───> [1 Entry]
    │                              │
    │                              │ logAction()
    │                              ▼
    │                         [N Entries]
    │                              │
    │                              │ logAction() when N=1000
    │                              ▼
    │                   [1000 Entries] (oldest pruned)
    │                              │
    │                              │ clearLogs()
    └──────────────────────────────┘
```

## localStorage Schema

**Key**: `tm_logs`

**Format**:
```json
{
  "version": 1,
  "entries": [
    {
      "id": "uuid-string",
      "timestamp": "2026-01-03T10:30:00.123Z",
      "action": "START_TASK",
      "taskId": "task-uuid",
      "taskName": "Morning Standup",
      "elapsedMs": 0,
      "sessionStatus": "running",
      "parameters": {
        "targetTaskId": "task-uuid-2",
        "previousElapsedMs": 300000
      }
    }
  ]
}
```

**Migration**: Schema version enables future format changes. Initial version is 1.

## Type Definitions (TypeScript)

```typescript
// To be added to src/lib/types/index.ts

export type LogAction =
  | 'START_DAY'
  | 'COMPLETE_TASK'
  | 'START_TASK'
  | 'END_DAY'
  | 'INTERRUPT'
  | 'RESUME_INTERRUPT'
  | 'ADD_TASK'
  | 'REORDER_TASK'
  | 'EDIT_TASK'
  | 'UNCOMPLETE_TASK'
  | 'BACK_TO_IMPORT'
  | 'START_NEW_DAY';

export interface LogEntry {
  id: string;
  timestamp: string;
  action: LogAction;
  taskId: string | null;
  taskName: string | null;
  elapsedMs: number | null;
  sessionStatus: SessionStatus;
  parameters: Record<string, unknown>;
}

export interface LogStorage {
  version: number;
  entries: LogEntry[];
}

// Constants
export const STORAGE_KEY_LOGS = 'tm_logs';
export const MAX_LOG_ENTRIES = 1000;
export const LOG_SCHEMA_VERSION = 1;
```
