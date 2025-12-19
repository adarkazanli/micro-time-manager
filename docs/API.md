# API Reference

This document describes the public interfaces, Svelte stores, and service modules for Micro Time Manager.

## Table of Contents

- [Stores](#stores)
  - [Timer Store](#timer-store)
  - [Tasks Store](#tasks-store)
  - [Interruptions Store](#interruptions-store)
  - [Notes Store](#notes-store)
  - [Settings Store](#settings-store)
- [Services](#services)
  - [Storage Service](#storage-service)
  - [Timer Service](#timer-service)
  - [File Parser Service](#file-parser-service)
  - [Exporter Service](#exporter-service)
  - [Analytics Service](#analytics-service)
- [Types](#types)
- [Events](#events)

---

## Stores

All stores use Svelte 5 runes for reactivity.

### Timer Store

Manages countdown timer state with precision timing.

**Location:** `src/lib/stores/timerStore.svelte.ts`

```typescript
interface TimerStore {
  /** Elapsed milliseconds on current task */
  readonly elapsedMs: number;

  /** Remaining milliseconds (negative = overtime) */
  readonly remainingMs: number;

  /** Display color: 'green' | 'yellow' | 'red' */
  readonly color: TimerColor;

  /** Whether timer is actively running */
  readonly isRunning: boolean;

  /** Formatted display time (e.g., "12:34" or "-2:15") */
  readonly displayTime: string;

  /**
   * Start the timer
   * @param plannedDurationSec - Task duration in seconds
   * @param initialElapsedMs - Optional starting elapsed time (for recovery)
   */
  start(plannedDurationSec: number, initialElapsedMs?: number): void;

  /** Stop the timer and return elapsed milliseconds */
  stop(): number;

  /** Reset timer state */
  reset(): void;
}
```

**Usage Example:**

```svelte
<script>
  import { timerStore } from '$lib/stores/timerStore.svelte';
</script>

<div class="timer" class:overtime={timerStore.remainingMs < 0}>
  <span style="color: {timerStore.color}">{timerStore.displayTime}</span>
</div>
```

---

### Session Store

Manages day session state, task progress, and current task tracking.

**Location:** `src/lib/stores/sessionStore.svelte.ts`

```typescript
interface SessionStore {
  /** Current session or null */
  readonly session: DaySession | null;

  /** Session status: 'idle' | 'running' | 'complete' */
  readonly status: SessionStatus;

  /** Current task's ConfirmedTask or null */
  readonly currentTask: ConfirmedTask | null;

  /** Current task's progress record or null */
  readonly currentProgress: TaskProgress | null;

  /** 0-based index of current task */
  readonly currentTaskIndex: number;

  /** Total number of tasks */
  readonly totalTasks: number;

  /** Current lag in seconds (positive = behind) */
  readonly lagSec: number;

  /** Formatted lag display (e.g., "2:30 behind" or "1:15 ahead") */
  readonly lagDisplay: string;

  /** Warning for at-risk fixed tasks or null */
  readonly fixedTaskWarning: FixedTaskWarning | null;

  /** Start a new day session */
  startDay(tasks: ConfirmedTask[]): void;

  /** Complete current task and advance to next */
  completeTask(elapsedMs: number): DaySummary | null;

  /** End the day early and get summary */
  endDay(elapsedMs: number): DaySummary;

  /** Restore session from localStorage (for page refresh) */
  restore(session: DaySession, tasks: ConfirmedTask[]): void;

  /** Reorder tasks (drag-and-drop) */
  reorderTasks(fromIndex: number, toIndex: number): boolean;

  /** Update a task's properties */
  updateTask(taskId: string, updates: Partial<ConfirmedTask>): boolean;

  /** Reset to initial state */
  reset(): void;
}
```

**Usage Example:**

```svelte
<script>
  import { sessionStore } from '$lib/stores/sessionStore.svelte';
</script>

{#if sessionStore.status === 'running'}
  <CurrentTask task={sessionStore.currentTask} />
  <LagIndicator lagSec={sessionStore.lagSec} display={sessionStore.lagDisplay} />
{/if}
```

---

### Import Store

Manages the schedule import workflow.

**Location:** `src/lib/stores/importStore.ts`

```typescript
interface ImportStore {
  /** Subscribable store with ImportState */
  subscribe: Subscriber<ImportState>;

  /** Upload and parse a file */
  uploadFile(file: File): Promise<void>;

  /** Update a single draft task */
  updateTask(id: string, changes: Partial<DraftTask>): void;

  /** Reorder tasks during preview */
  reorderTasks(fromIndex: number, toIndex: number): void;

  /** Confirm schedule and save to localStorage */
  confirmSchedule(): ConfirmedTask[];

  /** Reset to initial state */
  reset(): void;
}

interface ImportState {
  status: 'idle' | 'parsing' | 'preview' | 'error' | 'ready';
  file: File | null;
  uploadedAt: Date | null;
  tasks: DraftTask[];
  errors: ValidationError[];
}
```

**Usage Example:**

```svelte
<script>
  import { importStore } from '$lib/stores/importStore';

  async function handleFile(file: File) {
    await importStore.uploadFile(file);
  }
</script>

{#if $importStore.status === 'preview'}
  <SchedulePreview tasks={$importStore.tasks} />
{:else if $importStore.status === 'error'}
  <ValidationErrors errors={$importStore.errors} />
{/if}
```

---

### Notes Store (Planned)

*Not yet implemented.*

Manages quick notes.

```typescript
// src/lib/stores/notes.ts

interface Note {
  noteId: string;
  taskId: string | null;
  createdAt: Date;
  updatedAt: Date;
  content: string;
}

interface NotesState {
  notes: Note[];
}

interface NotesStore {
  /** Current state (readonly) */
  readonly state: NotesState;

  /**
   * Create a new note
   * @param content - Note content
   * @param taskId - Optional associated task
   */
  create(content: string, taskId?: string): Note;

  /**
   * Update an existing note
   * @param noteId - Note to update
   * @param content - New content
   */
  update(noteId: string, content: string): void;

  /**
   * Delete a note
   * @param noteId - Note to delete
   */
  delete(noteId: string): void;

  /**
   * Get notes for a specific task
   * @param taskId - Task ID
   */
  getForTask(taskId: string): Note[];

  /**
   * Search notes by content
   * @param query - Search string
   */
  search(query: string): Note[];

  /**
   * Clear all notes (reset)
   */
  clear(): void;
}
```

---

### Settings Store (Planned)

*Not yet implemented.*

User preferences and configuration.

```typescript
// src/lib/stores/settings.ts

interface Settings {
  /** Theme preference */
  theme: 'light' | 'dark' | 'system';
  /** Seconds before task end to warn */
  warningThresholdSec: number;
  /** Minutes before fixed task to alert */
  fixedTaskAlertMin: number;
  /** Enable sound alerts */
  soundEnabled: boolean;
  /** Enable vibration on mobile */
  vibrationEnabled: boolean;
}

interface SettingsStore {
  /** Current settings (readonly) */
  readonly settings: Settings;

  /**
   * Update a setting
   * @param key - Setting key
   * @param value - New value
   */
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;

  /**
   * Reset to defaults
   */
  resetToDefaults(): void;
}
```

---

## Services

### Storage Service

Abstracts localStorage operations with error handling and schema versioning.

```typescript
// src/lib/services/storage.ts

interface StorageService {
  /**
   * Save data to localStorage
   * @param key - Storage key
   * @param data - Data to serialize and store
   */
  save<T>(key: string, data: T): void;

  /**
   * Load data from localStorage
   * @param key - Storage key
   * @param defaultValue - Value if key doesn't exist
   */
  load<T>(key: string, defaultValue: T): T;

  /**
   * Remove a key from localStorage
   * @param key - Storage key
   */
  remove(key: string): void;

  /**
   * Clear all app data from localStorage
   */
  clearAll(): void;

  /**
   * Get current storage usage
   * @returns Bytes used
   */
  getUsage(): number;

  /**
   * Check if storage is near quota
   * @param thresholdPercent - Warning threshold (default 90%)
   */
  isNearQuota(thresholdPercent?: number): boolean;
}
```

**Storage Keys:**

| Key | Description |
|-----|-------------|
| `tm_session` | Current session metadata |
| `tm_tasks` | Task list |
| `tm_interruptions` | Interruption log |
| `tm_notes` | Notes |
| `tm_settings` | User settings |
| `tm_schema_version` | Data schema version for migrations |

---

### Timer Service

Low-level timer operations with drift correction.

```typescript
// src/lib/services/timer.ts

interface TimerService {
  /**
   * Start precision timer
   * @param onTick - Callback with elapsed seconds
   * @returns Stop function
   */
  start(onTick: (elapsedSec: number) => void): () => void;

  /**
   * Get high-precision timestamp
   * @returns Milliseconds from performance.now()
   */
  now(): number;

  /**
   * Calculate elapsed time between timestamps
   * @param start - Start timestamp
   * @param end - End timestamp (default: now)
   * @returns Elapsed seconds
   */
  elapsed(start: number, end?: number): number;

  /**
   * Format seconds to display string
   * @param seconds - Total seconds (can be negative)
   * @param format - 'short' (MM:SS) or 'long' (HH:MM:SS)
   */
  format(seconds: number, format?: 'short' | 'long'): string;
}
```

---

### File Parser Service

Parses Excel and CSV files.

```typescript
// src/lib/services/parser.ts

interface ParseResult {
  success: boolean;
  tasks?: Task[];
  errors?: ParseError[];
}

interface ParseError {
  row: number;
  column: string;
  message: string;
}

interface FileParserService {
  /**
   * Parse an uploaded file
   * @param file - File object from input
   * @returns Parse result with tasks or errors
   */
  parse(file: File): Promise<ParseResult>;

  /**
   * Validate file type
   * @param file - File to check
   */
  isValidFileType(file: File): boolean;

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[];
}
```

**Supported Formats:**

| Extension | MIME Type |
|-----------|-----------|
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `.xls` | `application/vnd.ms-excel` |
| `.csv` | `text/csv` |

---

### Exporter Service

Generates export files.

```typescript
// src/lib/services/exporter.ts

interface ExportData {
  tasks: Task[];
  interruptions: Interruption[];
  notes: Note[];
  summary: SessionSummary;
}

interface SessionSummary {
  totalPlannedSec: number;
  totalActualSec: number;
  totalInterruptionSec: number;
  interruptionCount: number;
  concentrationScore: number;
  scheduleAdherence: number;
  tasksCompleted: number;
  tasksTotal: number;
}

interface ExporterService {
  /**
   * Export data to Excel workbook
   * @param data - Data to export
   * @param filename - Output filename (without extension)
   */
  toExcel(data: ExportData, filename?: string): void;

  /**
   * Export data to CSV
   * @param data - Data to export
   * @param filename - Output filename (without extension)
   */
  toCSV(data: ExportData, filename?: string): void;

  /**
   * Generate export data from current state
   */
  gatherData(): ExportData;
}
```

---

### Analytics Service

Calculates metrics and scores.

```typescript
// src/lib/services/analytics.ts

interface AnalyticsService {
  /**
   * Calculate concentration score
   * @param workTimeSec - Total work time
   * @param interruptionTimeSec - Total interruption time
   * @returns Percentage (0-100)
   */
  calculateConcentrationScore(
    workTimeSec: number,
    interruptionTimeSec: number
  ): number;

  /**
   * Calculate schedule adherence
   * @param plannedSec - Total planned time
   * @param actualSec - Total actual time
   * @returns Percentage (can exceed 100%)
   */
  calculateScheduleAdherence(
    plannedSec: number,
    actualSec: number
  ): number;

  /**
   * Get task variance
   * @param task - Task to analyze
   * @returns Variance in seconds (positive = over, negative = under)
   */
  getTaskVariance(task: Task): number;

  /**
   * Compute all analytics for current session
   */
  computeSessionSummary(): SessionSummary;
}
```

---

## Types

Common type definitions used across the application.

```typescript
// src/lib/types/index.ts

/** Task type - fixed tasks cannot be moved */
type TaskType = 'fixed' | 'flexible';

/** Task status */
type TaskStatus = 'pending' | 'active' | 'complete';

/** Interruption categories */
type InterruptionCategory = 'phone' | 'colleague' | 'personal' | 'other';

/** Theme options */
type Theme = 'light' | 'dark' | 'system';

/** Timer display format */
type TimeFormat = 'short' | 'long';

/** File export format */
type ExportFormat = 'xlsx' | 'csv';
```

---

## Events

Custom events dispatched by components.

| Event | Payload | Source |
|-------|---------|--------|
| `timer:tick` | `{ remainingSeconds: number }` | TimerDisplay |
| `timer:complete` | `{ taskId: string }` | TimerDisplay |
| `timer:overrun` | `{ taskId: string, overrunSeconds: number }` | TimerDisplay |
| `task:start` | `{ task: Task }` | TaskCard |
| `task:complete` | `{ task: Task }` | TaskCard |
| `interruption:start` | `{ taskId: string }` | InterruptButton |
| `interruption:end` | `{ interruption: Interruption }` | InterruptButton |
| `note:create` | `{ note: Note }` | NoteInput |
| `file:parsed` | `{ tasks: Task[] }` | FileUploader |
| `file:error` | `{ errors: ParseError[] }` | FileUploader |
| `export:complete` | `{ filename: string }` | ExportButton |

---

**Document Version:** 1.1
**Last Updated:** 2025-12-18

See also:
- [Architecture](ARCHITECTURE.md)
- [Data Schema](DATA_SCHEMA.md)
