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

### Session

**Key:** `tm_session`

```typescript
interface Session {
  sessionId: string;      // UUID v4
  startTime: string;      // ISO 8601 datetime
  endTime: string | null; // ISO 8601 datetime or null if active
  status: 'active' | 'paused' | 'complete';
}
```

**Example:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2025-12-17T09:00:00.000Z",
  "endTime": null,
  "status": "active"
}
```

---

### Tasks

**Key:** `tm_tasks`

```typescript
interface Task {
  taskId: string;           // UUID v4
  name: string;             // Task name from import
  type: 'fixed' | 'flexible';
  plannedStart: string;     // ISO 8601 datetime
  actualStart: string | null;
  plannedDurationSec: number;
  actualDurationSec: number;
  status: 'pending' | 'active' | 'complete';
  sortOrder: number;        // 0-based index
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
    "actualStart": "2025-12-17T09:02:30.000Z",
    "plannedDurationSec": 1800,
    "actualDurationSec": 2100,
    "status": "complete",
    "sortOrder": 0
  },
  {
    "taskId": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "name": "Team standup",
    "type": "fixed",
    "plannedStart": "2025-12-17T09:30:00.000Z",
    "actualStart": null,
    "plannedDurationSec": 900,
    "actualDurationSec": 0,
    "status": "pending",
    "sortOrder": 1
  }
]
```

---

### Interruptions

**Key:** `tm_interruptions`

```typescript
interface Interruption {
  interruptionId: string;   // UUID v4
  taskId: string;           // Reference to task
  startTime: string;        // ISO 8601 datetime
  endTime: string | null;   // ISO 8601 datetime or null if active
  durationSec: number;      // Calculated duration
  category: 'phone' | 'colleague' | 'personal' | 'other';
  note: string;             // Optional description
}
```

**Example:**

```json
[
  {
    "interruptionId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "startTime": "2025-12-17T09:15:00.000Z",
    "endTime": "2025-12-17T09:17:30.000Z",
    "durationSec": 150,
    "category": "phone",
    "note": "Client callback - urgent"
  }
]
```

---

### Notes

**Key:** `tm_notes`

```typescript
interface Note {
  noteId: string;           // UUID v4
  taskId: string | null;    // Optional task association
  createdAt: string;        // ISO 8601 datetime
  updatedAt: string;        // ISO 8601 datetime
  content: string;          // Note text
}
```

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

### Settings

**Key:** `tm_settings`

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

**Current Version:** `1`

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

Exports generate an Excel workbook (`.xlsx`) with multiple sheets.

### Sheet 1: Tasks

| Column | Description | Example |
|--------|-------------|---------|
| Task Name | Name of the task | "Email review" |
| Type | Fixed or Flexible | "flexible" |
| Planned Start | HH:MM:SS | "09:00:00" |
| Actual Start | HH:MM:SS | "09:02:30" |
| Planned Duration | HH:MM:SS | "00:30:00" |
| Actual Duration | HH:MM:SS | "00:35:00" |
| Variance | +/- HH:MM:SS | "+00:05:00" |
| Interruptions | Count | 2 |
| Interruption Time | HH:MM:SS | "00:04:30" |
| Status | Complete/Incomplete | "Complete" |

### Sheet 2: Interruptions

| Column | Description | Example |
|--------|-------------|---------|
| Task | Associated task name | "Email review" |
| Start Time | HH:MM:SS | "09:15:00" |
| End Time | HH:MM:SS | "09:17:30" |
| Duration | HH:MM:SS | "00:02:30" |
| Category | Type of interruption | "phone" |
| Note | User description | "Client callback" |

### Sheet 3: Notes

| Column | Description | Example |
|--------|-------------|---------|
| Time | HH:MM:SS | "09:16:00" |
| Task | Associated task (if any) | "Email review" |
| Content | Note text | "Call back John..." |

### Sheet 4: Summary

| Metric | Value |
|--------|-------|
| Session Date | 2025-12-17 |
| Session Start | 09:00:00 |
| Session End | 17:30:00 |
| Total Planned Time | 08:00:00 |
| Total Actual Time | 08:25:00 |
| Total Interruption Time | 00:45:00 |
| Interruption Count | 12 |
| Concentration Score | 91.1% |
| Schedule Adherence | 94.8% |
| Tasks Completed | 8 of 8 |

### CSV Export

When exporting to CSV, separate files are generated:
- `{date}_tasks.csv`
- `{date}_interruptions.csv`
- `{date}_notes.csv`
- `{date}_summary.csv`

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

**Document Version:** 1.0
**Last Updated:** 2025-12-17

See also:
- [Architecture](ARCHITECTURE.md)
- [API Reference](API.md)
