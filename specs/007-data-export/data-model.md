# Data Model: Data Export

**Feature**: 007-data-export
**Date**: 2025-12-19

## Overview

This feature exports existing session data to file formats. It does not introduce new persisted entities but defines computed export structures.

## Export Data Structures

### TaskExportRow

Represents a single task row in the Tasks export sheet/file.

```typescript
interface TaskExportRow {
  taskName: string;              // Task name from ConfirmedTask
  type: 'fixed' | 'flexible';    // Task type
  plannedStart: string;          // HH:MM:SS format
  actualStart: string;           // HH:MM:SS format (from completedAt of previous task or session start)
  plannedDuration: string;       // HH:MM:SS format
  actualDuration: string;        // HH:MM:SS format
  variance: string;              // +/-HH:MM:SS format (actual - planned)
  interruptionCount: number;     // Count of interruptions during this task
  interruptionTime: string;      // HH:MM:SS format (total interruption duration)
  status: string;                // 'Complete', 'In Progress', 'Pending', 'Missed'
}
```

**Field Derivations**:
| Field | Source | Computation |
|-------|--------|-------------|
| taskName | `ConfirmedTask.name` | Direct |
| type | `ConfirmedTask.type` | Direct |
| plannedStart | `ConfirmedTask.plannedStart` | `formatTime(date)` |
| actualStart | Previous task completion or session start | Computed from timeline |
| plannedDuration | `ConfirmedTask.plannedDurationSec` | `formatDuration(sec)` |
| actualDuration | `TaskProgress.actualDurationSec` | `formatDuration(sec)` |
| variance | `actualDurationSec - plannedDurationSec` | `formatVariance(sec)` |
| interruptionCount | Count interruptions where `taskId` matches | Aggregation |
| interruptionTime | Sum interruption durations for task | `formatDuration(totalSec)` |
| status | `TaskProgress.status` | Map to display string |

---

### InterruptionExportRow

Represents a single interruption row in the Interruptions export sheet/file.

```typescript
interface InterruptionExportRow {
  task: string;                  // Task name (lookup from taskId)
  startTime: string;             // HH:MM:SS format
  endTime: string;               // HH:MM:SS format (or 'In Progress')
  duration: string;              // HH:MM:SS format
  category: string;              // Category or empty
  note: string;                  // Note content or empty
}
```

**Field Derivations**:
| Field | Source | Computation |
|-------|--------|-------------|
| task | `Interruption.taskId` → `ConfirmedTask.name` | Lookup |
| startTime | `Interruption.startedAt` | `formatTime(iso)` |
| endTime | `Interruption.endedAt` | `formatTime(iso)` or 'In Progress' |
| duration | `Interruption.durationSec` or computed | `formatDuration(sec)` |
| category | `Interruption.category` | Direct or empty string |
| note | `Interruption.note` | Direct or empty string |

---

### NoteExportRow

Represents a single note row in the Notes export sheet/file.

```typescript
interface NoteExportRow {
  time: string;                  // HH:MM:SS format (creation time)
  task: string;                  // Task name or empty if no association
  content: string;               // Note content
}
```

**Field Derivations**:
| Field | Source | Computation |
|-------|--------|-------------|
| time | `Note.createdAt` | `formatTime(iso)` |
| task | `Note.taskId` → `ConfirmedTask.name` | Lookup or empty |
| content | `Note.content` | Direct |

---

### SummaryExportRow

Key-value pairs for the Summary export sheet/file.

```typescript
interface SummaryExportRow {
  metric: string;                // Metric name
  value: string;                 // Formatted value
}

// Rows in order:
const summaryRows: SummaryExportRow[] = [
  { metric: 'Session Date', value: '2025-12-19' },
  { metric: 'Session Start', value: '09:00:00' },
  { metric: 'Session End', value: '17:30:00' },
  { metric: 'Total Planned Time', value: '08:00:00' },
  { metric: 'Total Actual Time', value: '08:25:00' },
  { metric: 'Total Interruption Time', value: '00:45:00' },
  { metric: 'Interruption Count', value: '12' },
  { metric: 'Concentration Score', value: '91.1%' },
  { metric: 'Schedule Adherence', value: '94.8%' },
  { metric: 'Tasks Completed', value: '8 of 10' },
];
```

**Field Derivations**:
| Metric | Source | Computation |
|--------|--------|-------------|
| Session Date | `sessionStore.startedAt` | `formatDate(iso)` |
| Session Start | `sessionStore.startedAt` | `formatTime(iso)` |
| Session End | `sessionStore.endedAt` or now | `formatTime(iso)` |
| Total Planned Time | `AnalyticsSummary.totalPlannedSec` | `formatDuration(sec)` |
| Total Actual Time | `AnalyticsSummary.totalActualSec` | `formatDuration(sec)` |
| Total Interruption Time | `AnalyticsSummary.totalInterruptionSec` | `formatDuration(sec)` |
| Interruption Count | `AnalyticsSummary.totalInterruptionCount` | Direct |
| Concentration Score | `AnalyticsSummary.concentrationScore` | `${score.toFixed(1)}%` |
| Schedule Adherence | `AnalyticsSummary.scheduleAdherence` | `${adherence.toFixed(1)}%` |
| Tasks Completed | `AnalyticsSummary` | `${completed} of ${total}` |

---

## Export Format Type

```typescript
type ExportFormat = 'excel' | 'csv';
```

---

## Existing Entities (Reference)

These entities already exist and are read-only for export purposes.

### ConfirmedTask (from sessionStore.tasks)
```typescript
interface ConfirmedTask {
  taskId: string;
  name: string;
  type: 'fixed' | 'flexible';
  plannedStart: Date;
  plannedDurationSec: number;
  sortOrder: number;
  status: TaskStatus;
}
```

### TaskProgress (from sessionStore.taskProgress)
```typescript
interface TaskProgress {
  taskId: string;
  plannedDurationSec: number;
  actualDurationSec: number;
  completedAt: string | null;
  status: ProgressStatus;
}
```

### Interruption (from interruptionStore.interruptions)
```typescript
interface Interruption {
  interruptionId: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  category: InterruptionCategory | null;
  note: string | null;
}
```

### Note (from noteStore.notes)
```typescript
interface Note {
  noteId: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  taskId: string | null;
}
```

### AnalyticsSummary (from analytics service)
```typescript
interface AnalyticsSummary {
  totalPlannedSec: number;
  totalActualSec: number;
  tasksCompleted: number;
  totalTasks: number;
  scheduleAdherence: number;
  concentrationScore: number;
  concentrationRating: ConcentrationRating;
  totalInterruptionCount: number;
  totalInterruptionSec: number;
}
```

---

## Validation Rules

1. **Task Name**: Max 200 characters (existing constraint)
2. **Note Content**: Max 500 characters (existing constraint)
3. **Interruption Note**: Max 200 characters (existing constraint)
4. **Time Values**: Must be valid ISO 8601 strings before formatting
5. **Duration Values**: Must be non-negative integers (seconds)

---

## State Transitions

Not applicable - export is a stateless read-only operation on existing data.
