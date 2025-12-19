# Data Schema

This document describes the data structures used for localStorage persistence and file import/export formats.

## Table of Contents

- [localStorage Schema](#localstorage-schema)
  - [Session](#session)
  - [Tasks](#tasks)
  - [Interruptions](#interruptions)
  - [Notes](#notes)
  - [Settings](#settings)
- [Schema Versioning](#schema-versioning)
- [Import File Format](#import-file-format)
- [Export File Format](#export-file-format)

---

## localStorage Schema

All data is stored in the browser's localStorage under keys prefixed with `tm_`.

### Day Session

**Key:** `tm_session`

```typescript
interface DaySession {
  sessionId: string;           // UUID v4
  startedAt: string;           // ISO 8601 datetime
  endedAt: string | null;      // ISO 8601 datetime or null if active
  status: 'idle' | 'running' | 'complete';
  currentTaskIndex: number;    // 0-based index of current task
  currentTaskElapsedMs: number; // Milliseconds spent on current task
  lastPersistedAt: number;     // Epoch ms, for recovery
  totalLagSec: number;         // Cumulative lag (negative = ahead)
  taskProgress: TaskProgress[]; // Progress records for all tasks
}

interface TaskProgress {
  taskId: string;              // Reference to ConfirmedTask
  plannedDurationSec: number;
  actualDurationSec: number;
  completedAt: string | null;  // ISO 8601 datetime
  status: 'pending' | 'active' | 'complete' | 'missed';
}
```

**Example:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "startedAt": "2025-12-17T09:00:00.000Z",
  "endedAt": null,
  "status": "running",
  "currentTaskIndex": 1,
  "currentTaskElapsedMs": 450000,
  "lastPersistedAt": 1702810000000,
  "totalLagSec": 120,
  "taskProgress": [
    {
      "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "plannedDurationSec": 1800,
      "actualDurationSec": 1920,
      "completedAt": "2025-12-17T09:32:00.000Z",
      "status": "complete"
    },
    {
      "taskId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "plannedDurationSec": 900,
      "actualDurationSec": 450,
      "completedAt": null,
      "status": "active"
    }
  ]
}
```

---

### Tasks (Confirmed)

**Key:** `tm_tasks`

```typescript
interface ConfirmedTask {
  taskId: string;           // UUID v4
  name: string;             // Task name from import
  type: 'fixed' | 'flexible';
  plannedStart: string;     // ISO 8601 datetime (serialized Date)
  plannedDurationSec: number;
  sortOrder: number;        // 0-based index
  status: 'pending' | 'active' | 'complete';
}
```

**Example:**

```json
[
  {
    "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Email review",
    "type": "flexible",
    "plannedStart": "2025-12-17T09:00:00.000Z",
    "plannedDurationSec": 1800,
    "sortOrder": 0,
    "status": "pending"
  },
  {
    "taskId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "name": "Team standup",
    "type": "fixed",
    "plannedStart": "2025-12-17T09:30:00.000Z",
    "plannedDurationSec": 900,
    "sortOrder": 1,
    "status": "pending"
  }
]
```

---

### Interruptions

**Key:** `tm_interruptions`

```typescript
type InterruptionCategory = 'Phone' | 'Luci' | 'Colleague' | 'Personal' | 'Other';

interface Interruption {
  interruptionId: string;       // UUID v4
  taskId: string;               // Reference to task being interrupted
  startedAt: string;            // ISO 8601 datetime
  endedAt: string | null;       // ISO 8601 datetime or null if active
  durationSec: number;          // Calculated duration in seconds
  category: InterruptionCategory | null;  // Optional category
  note: string | null;          // Optional description (max 200 chars)
}
```

**Example:**

```json
[
  {
    "interruptionId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "startedAt": "2025-12-17T09:15:00.000Z",
    "endedAt": "2025-12-17T09:17:30.000Z",
    "durationSec": 150,
    "category": "Phone",
    "note": "Client callback - urgent"
  },
  {
    "interruptionId": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "startedAt": "2025-12-17T10:30:00.000Z",
    "endedAt": "2025-12-17T10:32:00.000Z",
    "durationSec": 120,
    "category": null,
    "note": null
  }
]
```

**Constants:**

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_INTERRUPTION_NOTE_LENGTH` | 200 | Maximum characters for note |
| `INTERRUPTION_CATEGORIES` | `['Phone', 'Luci', 'Colleague', 'Personal', 'Other']` | Valid categories |

---

### Notes

**Key:** `tm_notes`

```typescript
interface Note {
  noteId: string;              // UUID v4
  taskId: string | null;       // Optional task association
  createdAt: string;           // ISO 8601 datetime
  updatedAt: string | null;    // ISO 8601 datetime (null if never edited)
  content: string;             // Note text (max 500 characters)
}
```

**Constants:**

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_NOTE_LENGTH` | 500 | Maximum characters for note content |
| `NOTE_CHAR_WARNING_THRESHOLD` | 50 | Show yellow warning when chars remaining < 50 |
| `NOTE_CHAR_DANGER_THRESHOLD` | 10 | Show red warning when chars remaining < 10 |

**Example:**

```json
[
  {
    "noteId": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "createdAt": "2025-12-17T09:16:00.000Z",
    "updatedAt": "2025-12-17T09:16:00.000Z",
    "content": "Call back John at 555-1234 re: project timeline"
  }
]
```

---

### Settings (Planned)

**Key:** `tm_settings` *(not yet implemented)*

```typescript
interface Settings {
  theme: 'light' | 'dark' | 'system';
  warningThresholdSec: number;  // Seconds before task end to warn
  fixedTaskAlertMin: number;    // Minutes before fixed task to alert
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
```

**Example:**

```json
{
  "theme": "system",
  "warningThresholdSec": 300,
  "fixedTaskAlertMin": 10,
  "soundEnabled": true,
  "vibrationEnabled": true
}
```

**Defaults:**

| Setting | Default Value |
|---------|---------------|
| `theme` | `"system"` |
| `warningThresholdSec` | `300` (5 minutes) |
| `fixedTaskAlertMin` | `10` |
| `soundEnabled` | `true` |
| `vibrationEnabled` | `true` |

---

## Schema Versioning

**Key:** `tm_schema_version`

```typescript
interface SchemaVersion {
  version: number;
  migratedAt: string;  // ISO 8601 datetime
}
```

**Current Version:** `4`

### Version History

| Version | Changes |
|---------|---------|
| 1 | Initial schema |
| 2 | Added session persistence |
| 3 | Added interruption tracking (`tm_interruptions` storage key) |
| 4 | Added note capture (`tm_notes` storage key) |

### Migration Strategy

When the schema changes:

1. Increment the version number
2. Add a migration function in `src/lib/services/migrations.ts`
3. The storage service runs migrations on app load

```typescript
// Example migration
const migrations: Record<number, (data: any) => any> = {
  2: (data) => {
    // Add new field with default value
    return {
      ...data,
      newField: 'default'
    };
  }
};
```

---

## Import File Format

### Required Columns

| Column | Type | Required | Example |
|--------|------|----------|---------|
| Task Name | String | Yes | "Email review" |
| Start Time | Time | Yes | "09:00", "9:00 AM", "09:00:00" |
| Duration | String | Yes | "30m", "1h 30m", "01:30:00", "90" |
| Type | String | Yes | "fixed", "flexible" |

### Duration Formats Supported

| Format | Example | Parsed As |
|--------|---------|-----------|
| Seconds only | `"90"` | 90 seconds |
| Minutes short | `"30m"` | 30 minutes |
| Hours short | `"1h"` | 1 hour |
| Combined short | `"1h 30m"` | 1 hour 30 minutes |
| HH:MM:SS | `"01:30:00"` | 1 hour 30 minutes |
| MM:SS | `"30:00"` | 30 minutes |

### Time Formats Supported

| Format | Example |
|--------|---------|
| 24-hour | `"09:00"`, `"14:30"` |
| 24-hour with seconds | `"09:00:00"` |
| 12-hour | `"9:00 AM"`, `"2:30 PM"` |

### Sample Import File

| Task Name | Start Time | Duration | Type |
|-----------|------------|----------|------|
| Email review | 09:00 | 30m | flexible |
| Team standup | 09:30 | 15m | fixed |
| Project work | 09:45 | 2h | flexible |
| Lunch | 12:00 | 1h | fixed |
| Client call | 13:00 | 30m | fixed |
| Documentation | 13:30 | 1h 30m | flexible |
| Code review | 15:00 | 45m | flexible |
| Planning | 15:45 | 30m | flexible |

---

## Export File Format

Exports are available in two formats: Excel (single workbook) and CSV (multiple files).

### Excel Export (.xlsx)

Generates a single workbook named `YYYY-MM-DD_productivity.xlsx` with four sheets.

### CSV Export

Generates four separate files:
- `YYYY-MM-DD_tasks.csv`
- `YYYY-MM-DD_interruptions.csv`
- `YYYY-MM-DD_notes.csv`
- `YYYY-MM-DD_summary.csv`

### Export Row Types

```typescript
interface TaskExportRow {
  taskName: string;          // Task name
  type: string;              // "fixed" or "flexible"
  plannedStart: string;      // HH:MM:SS format
  actualStart: string;       // HH:MM:SS format
  plannedDuration: string;   // HH:MM:SS format
  actualDuration: string;    // HH:MM:SS format
  variance: string;          // +/-HH:MM:SS format
  interruptionCount: number; // Integer count
  interruptionTime: string;  // HH:MM:SS format
  status: string;            // Complete/In Progress/Pending/Missed
}

interface InterruptionExportRow {
  task: string;              // Task name (looked up from taskId)
  startTime: string;         // HH:MM:SS format
  endTime: string;           // HH:MM:SS format or "In Progress"
  duration: string;          // HH:MM:SS format
  category: string;          // Category or empty string
  note: string;              // Note or empty string
}

interface NoteExportRow {
  time: string;              // HH:MM:SS format
  task: string;              // Task name or empty string
  content: string;           // Note content
}

interface SummaryExportRow {
  metric: string;            // Metric name
  value: string;             // Formatted value
}
```

### Sheet/File 1: Tasks

| Column Header | Description | Example |
|---------------|-------------|---------|
| Task Name | Name of the task | "Email review" |
| Type | Fixed or Flexible | "flexible" |
| Planned Start | Scheduled start time (HH:MM:SS) | "09:00:00" |
| Actual Start | When task actually started (HH:MM:SS) | "09:02:30" |
| Planned Duration | Allocated time (HH:MM:SS) | "00:30:00" |
| Actual Duration | Time actually spent (HH:MM:SS) | "00:35:00" |
| Variance | Over/under time with +/- prefix | "+00:05:00" or "-00:02:00" |
| Interruptions | Number of interruptions | 2 |
| Interruption Time | Total interruption duration (HH:MM:SS) | "00:04:30" |
| Status | Task completion status | "Complete", "In Progress", "Pending", "Missed" |

**Actual Start Calculation:**
- First task: Uses session start time
- Subsequent tasks: Uses previous task's completion time (if available)

### Sheet/File 2: Interruptions

| Column Header | Description | Example |
|---------------|-------------|---------|
| Task | Task name during which interruption occurred | "Email review" |
| Start Time | When interruption began (HH:MM:SS) | "09:15:00" |
| End Time | When interruption ended (HH:MM:SS or "In Progress") | "09:17:30" |
| Duration | Length of interruption (HH:MM:SS) | "00:02:30" |
| Category | Interruption category | "Phone", "Luci", "Colleague", "Personal", "Other", or empty |
| Note | Optional description | "Client callback" |

### Sheet/File 3: Notes

| Column Header | Description | Example |
|---------------|-------------|---------|
| Time | When note was created (HH:MM:SS) | "09:16:00" |
| Task | Associated task name (if any) | "Email review" or empty |
| Content | Note text | "Call back John at 555-1234" |

### Sheet/File 4: Summary

| Metric | Description | Example Value |
|--------|-------------|---------------|
| Session Date | Date of the session (YYYY-MM-DD) | "2025-12-19" |
| Session Start | When session began (HH:MM:SS) | "09:00:00" |
| Session End | When session ended (HH:MM:SS) | "17:30:00" |
| Total Planned Time | Sum of all task durations (HH:MM:SS) | "08:00:00" |
| Total Actual Time | Time spent on completed tasks (HH:MM:SS) | "08:25:00" |
| Total Interruption Time | Sum of all interruptions (HH:MM:SS) | "00:45:00" |
| Interruption Count | Total number of interruptions | "12" |
| Concentration Score | Focus metric as percentage | "91.1%" |
| Schedule Adherence | Plan accuracy as percentage | "94.8%" |
| Tasks Completed | Completed vs total tasks | "8 of 8" |

### Time Formatting

| Format | Usage | Example |
|--------|-------|---------|
| HH:MM:SS | Duration and time of day | "01:30:00", "09:00:00" |
| +HH:MM:SS | Positive variance (over time) | "+00:05:00" |
| -HH:MM:SS | Negative variance (under time) | "-00:02:00" |
| YYYY-MM-DD | Session date | "2025-12-19" |
| XX.X% | Percentage metrics | "91.3%" |

### CSV Escaping

CSV files follow RFC 4180 standards:
- Fields containing commas, quotes, or newlines are wrapped in double quotes
- Double quotes within fields are escaped as two double quotes (`""`)
- UTF-8 encoding with proper line endings

---

## Computed Analytics Types

These types are computed at runtime from session and interruption data. They are not persisted to localStorage but are used by the Analytics Dashboard and export functionality.

### AnalyticsSummary

Aggregated day-level metrics computed from `TaskProgress[]` and `Interruption[]`.

```typescript
type ConcentrationRating = 'Excellent' | 'Good' | 'Fair' | 'Needs improvement';

interface AnalyticsSummary {
  totalPlannedSec: number;         // Sum of all plannedDurationSec
  totalActualSec: number;          // Sum of actualDurationSec for completed tasks
  tasksCompleted: number;          // Count of tasks with status 'complete'
  totalTasks: number;              // Total task count
  scheduleAdherence: number;       // (planned / actual) × 100
  concentrationScore: number;      // ((work - interruption) / work) × 100
  concentrationRating: ConcentrationRating;
  totalInterruptionCount: number;
  totalInterruptionSec: number;
}
```

**Concentration Rating Thresholds:**

| Score Range | Rating |
|-------------|--------|
| ≥ 90% | Excellent |
| 80-89% | Good |
| 70-79% | Fair |
| < 70% | Needs improvement |

### TaskPerformance

Per-task metrics computed by joining `ConfirmedTask[]`, `TaskProgress[]`, and `Interruption[]`.

```typescript
interface TaskPerformance {
  taskId: string;
  taskName: string;
  plannedDurationSec: number;
  actualDurationSec: number;
  varianceSec: number;             // actual - planned (positive = over)
  interruptionCount: number;       // Interruptions during this task
  interruptionSec: number;         // Total interruption time for this task
  status: ProgressStatus;
}
```

---

## Storage Limits

| Browser | localStorage Limit |
|---------|-------------------|
| Chrome | 5 MB |
| Firefox | 5 MB |
| Safari | 5 MB |
| Edge | 5 MB |

### Estimated Storage Per Day

| Data Type | Estimated Size |
|-----------|---------------|
| Session | ~200 bytes |
| Tasks (10) | ~2 KB |
| Interruptions (20) | ~3 KB |
| Notes (15) | ~4 KB |
| Settings | ~200 bytes |
| **Total per day** | **~10 KB** |

At this rate, ~500 days of data could be stored before hitting the 5MB limit. The application warns users when storage usage exceeds 90%.

---

**Document Version:** 1.2
**Last Updated:** 2025-12-19

See also:
- [Architecture](ARCHITECTURE.md)
- [API Reference](API.md)
