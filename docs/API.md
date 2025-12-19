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

### Interruption Store

Manages interruption tracking state for pausing/resuming tasks.

**Location:** `src/lib/stores/interruptionStore.svelte.ts`

```typescript
interface InterruptionStore {
  /** Whether currently in interrupted state */
  readonly isInterrupted: boolean;

  /** Current active interruption or null */
  readonly activeInterruption: Interruption | null;

  /** Elapsed milliseconds during current interruption */
  readonly elapsedMs: number;

  /** All completed interruptions in current session */
  readonly interruptions: Interruption[];

  /**
   * Start a new interruption for a task
   * @param taskId - ID of the task being interrupted
   * @returns The created interruption record
   */
  startInterruption(taskId: string): Interruption;

  /**
   * End the current interruption
   * @returns The completed interruption record
   * @throws If no active interruption
   */
  endInterruption(): Interruption;

  /**
   * Update an interruption's category and note
   * @param interruptionId - ID of interruption to update
   * @param updates - Category and/or note to set
   */
  updateInterruption(
    interruptionId: string,
    updates: { category?: InterruptionCategory | null; note?: string | null }
  ): void;

  /**
   * Get summary stats for a specific task
   * @param taskId - Task to get summary for
   * @returns Count and total duration of interruptions
   */
  getTaskSummary(taskId: string): InterruptionSummary;

  /**
   * Auto-end current interruption (for task/session completion)
   * @returns Completed interruption or null if none active
   */
  autoEndInterruption(): Interruption | null;

  /**
   * Restore interruption state from localStorage
   * @param saved - Previously saved interruptions
   */
  restore(saved: Interruption[]): void;

  /** Reset to initial state */
  reset(): void;
}
```

**Types:**

```typescript
/** Interruption categories */
type InterruptionCategory = 'Phone' | 'Luci' | 'Colleague' | 'Personal' | 'Other';

interface Interruption {
  interruptionId: string;
  taskId: string;
  startedAt: string; // ISO timestamp
  endedAt: string | null;
  durationSec: number;
  category: InterruptionCategory | null;
  note: string | null;
}

interface InterruptionSummary {
  taskId: string;
  count: number;
  totalDurationSec: number;
}
```

**Usage Example:**

```svelte
<script>
  import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
</script>

{#if interruptionStore.isInterrupted}
  <InterruptionTimer elapsedMs={interruptionStore.elapsedMs} />
  <button onclick={() => interruptionStore.endInterruption()}>Resume</button>
{:else}
  <button onclick={() => interruptionStore.startInterruption(currentTaskId)}>
    Interrupt
  </button>
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

### Notes Store

Manages note capture state including input visibility, notes list, search/filter state, and persistence.

**Location:** `src/lib/stores/noteStore.svelte.ts`

```typescript
interface NoteStore {
  /** All notes */
  readonly notes: Note[];

  /** Whether note input field is open */
  readonly isInputOpen: boolean;

  /** Whether notes view panel is open */
  readonly isViewOpen: boolean;

  /** Current search query */
  readonly searchQuery: string;

  /** Current task filter (null = all tasks) */
  readonly taskFilter: string | null;

  /** Notes filtered by search/task, sorted newest-first */
  readonly filteredNotes: Note[];

  /** Open the note input field */
  openInput(): void;

  /** Close the note input field */
  closeInput(): void;

  /**
   * Add a new note
   * @param content - Note content (max 500 chars, trimmed)
   * @param taskId - Optional task association
   * @returns The created note
   * @throws If content is empty or exceeds max length
   */
  addNote(content: string, taskId?: string | null): Note;

  /**
   * Update an existing note's content
   * @param noteId - Note to update
   * @param content - New content (max 500 chars, trimmed)
   * @throws If note not found, content empty, or exceeds max length
   */
  updateNote(noteId: string, content: string): void;

  /**
   * Delete a note
   * @param noteId - Note to delete
   * @throws If note not found
   */
  deleteNote(noteId: string): void;

  /** Toggle notes view panel visibility */
  toggleView(): void;

  /**
   * Set search query for filtering notes
   * @param query - Search string (case-insensitive)
   */
  setSearchQuery(query: string): void;

  /**
   * Set task filter
   * @param taskId - Task ID to filter by, or null for all
   */
  setTaskFilter(taskId: string | null): void;

  /** Clear all filters (search and task) */
  clearFilters(): void;

  /**
   * Restore notes from saved data (session recovery)
   * @param saved - Array of saved notes
   */
  restore(saved: Note[]): void;

  /** Reset all note state and clear storage */
  reset(): void;
}
```

**Types:**

```typescript
interface Note {
  noteId: string;        // UUID v4
  content: string;       // Note text (max 500 chars)
  createdAt: string;     // ISO 8601 timestamp
  updatedAt: string | null; // ISO 8601 timestamp or null if never edited
  taskId: string | null; // Associated task ID or null for general notes
}

/** Maximum note content length */
const MAX_NOTE_LENGTH = 500;

/** Character count warning threshold (yellow) */
const NOTE_CHAR_WARNING_THRESHOLD = 50;

/** Character count danger threshold (red) */
const NOTE_CHAR_DANGER_THRESHOLD = 10;
```

**Usage Example:**

```svelte
<script>
  import { noteStore } from '$lib/stores/noteStore.svelte';

  function handleSave(content: string) {
    noteStore.addNote(content, currentTaskId);
  }
</script>

{#if noteStore.isInputOpen}
  <NoteInput onSave={handleSave} onCancel={() => noteStore.closeInput()} />
{/if}

<button onclick={() => noteStore.openInput()}>Add Note</button>
<button onclick={() => noteStore.toggleView()}>
  View Notes ({noteStore.notes.length})
</button>

{#if noteStore.isViewOpen}
  <NotesView tasks={tasks} onClose={() => noteStore.toggleView()} />
{/if}
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

### Export Service

Handles data export to Excel and CSV formats with comprehensive error handling.

**Location:** `src/lib/services/export.ts`

#### Main Export Functions

```typescript
/**
 * Export session data to Excel file and trigger download.
 * Creates a multi-sheet workbook (Tasks, Interruptions, Notes, Summary).
 * @returns ExportResult indicating success or failure
 */
function exportToExcel(
  tasks: ConfirmedTask[],
  progress: TaskProgress[],
  interruptions: Interruption[],
  notes: Note[],
  summary: AnalyticsSummary,
  sessionStart: string,
  sessionEnd: string | null
): ExportResult;

/**
 * Export session data to CSV files and trigger downloads.
 * Downloads four separate CSV files.
 * @returns ExportResult indicating success or failure
 */
function exportToCSV(
  tasks: ConfirmedTask[],
  progress: TaskProgress[],
  interruptions: Interruption[],
  notes: Note[],
  summary: AnalyticsSummary,
  sessionStart: string,
  sessionEnd: string | null
): ExportResult;
```

#### Data Preparation Functions

```typescript
/**
 * Prepare tasks data for export.
 * Calculates actual start times, variance, and aggregates interruption stats per task.
 */
function prepareTasksExport(
  tasks: ConfirmedTask[],
  progress: TaskProgress[],
  interruptions: Interruption[],
  sessionStart: string
): TaskExportRow[];

/**
 * Prepare interruptions data for export.
 * Maps task IDs to names and formats timestamps.
 */
function prepareInterruptionsExport(
  interruptions: Interruption[],
  tasks: ConfirmedTask[]
): InterruptionExportRow[];

/**
 * Prepare notes data for export.
 * Associates notes with task names and formats timestamps.
 */
function prepareNotesExport(
  notes: Note[],
  tasks: ConfirmedTask[]
): NoteExportRow[];

/**
 * Prepare summary metrics for export.
 * Creates key-value pairs of all analytics metrics.
 */
function prepareSummaryExport(
  summary: AnalyticsSummary,
  sessionStart: string,
  sessionEnd: string | null
): SummaryExportRow[];
```

#### Helper Functions

```typescript
/**
 * Generate Excel workbook from session data.
 * @returns XLSX.WorkBook with four sheets
 */
function generateExcelWorkbook(...): XLSX.WorkBook;

/**
 * Generate CSV content from headers and data.
 * Properly escapes values per RFC 4180.
 */
function generateCSV(headers: string[], data: (string | number)[][]): string;

/**
 * Generate filename for export.
 * Format: YYYY-MM-DD_productivity.xlsx or YYYY-MM-DD_[type].csv
 */
function getExportFilename(
  sessionStart: string,
  format: ExportFormat,
  dataType?: 'tasks' | 'interruptions' | 'notes' | 'summary'
): string;

/**
 * Trigger browser file download from a Blob.
 */
function downloadBlob(blob: Blob, filename: string): void;
```

#### Types

```typescript
interface ExportResult {
  success: boolean;
  error?: string;
  filesDownloaded?: number; // 1 for Excel, 4 for CSV
}

type ExportFormat = 'excel' | 'csv';

interface TaskExportRow {
  taskName: string;
  type: string;
  plannedStart: string;      // HH:MM:SS
  actualStart: string;       // HH:MM:SS
  plannedDuration: string;   // HH:MM:SS
  actualDuration: string;    // HH:MM:SS
  variance: string;          // +/-HH:MM:SS
  interruptionCount: number;
  interruptionTime: string;  // HH:MM:SS
  status: string;
}

interface InterruptionExportRow {
  task: string;
  startTime: string;         // HH:MM:SS
  endTime: string;           // HH:MM:SS or "In Progress"
  duration: string;          // HH:MM:SS
  category: string;
  note: string;
}

interface NoteExportRow {
  time: string;              // HH:MM:SS
  task: string;
  content: string;
}

interface SummaryExportRow {
  metric: string;
  value: string;
}
```

#### Usage Example

```svelte
<script>
  import { exportToExcel, exportToCSV } from '$lib/services/export';
  import { sessionStore } from '$lib/stores/sessionStore.svelte';
  import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
  import { noteStore } from '$lib/stores/noteStore.svelte';
  import { calculateAnalyticsSummary } from '$lib/services/analytics';

  function handleExport(format: 'excel' | 'csv') {
    if (!sessionStore.session) return;

    const summary = calculateAnalyticsSummary(
      sessionStore.session.taskProgress,
      interruptionStore.interruptions
    );

    const result = format === 'excel'
      ? exportToExcel(
          tasks,
          sessionStore.session.taskProgress,
          interruptionStore.interruptions,
          noteStore.notes,
          summary,
          sessionStore.session.startedAt,
          sessionStore.session.endedAt
        )
      : exportToCSV(/* same parameters */);

    if (!result.success) {
      console.error(result.error);
      // Show error to user
    }
  }
</script>
```

---

### Analytics Service

Pure functions for calculating productivity metrics. No state management—all calculations are derived from input data.

**Location:** `src/lib/services/analytics.ts`

```typescript
// src/lib/services/analytics.ts

/**
 * Get concentration rating based on score.
 * @param score - Concentration score percentage (0-100)
 * @returns Human-readable rating tier
 */
function getConcentrationRating(score: number): ConcentrationRating;
// Returns: 'Excellent' (>=90), 'Good' (80-89), 'Fair' (70-79), 'Needs improvement' (<70)

/**
 * Calculate day-level analytics summary from task progress and interruptions.
 * @param taskProgress - Array of task progress records from session
 * @param interruptions - Array of interruption records from session
 * @returns Aggregated analytics summary
 */
function calculateAnalyticsSummary(
  taskProgress: readonly TaskProgress[],
  interruptions: readonly Interruption[]
): AnalyticsSummary;

/**
 * Calculate per-task performance metrics.
 * @param tasks - Array of confirmed tasks
 * @param taskProgress - Array of task progress records
 * @param interruptions - Array of interruption records
 * @returns Array of per-task performance metrics
 */
function calculateTaskPerformance(
  tasks: readonly ConfirmedTask[],
  taskProgress: readonly TaskProgress[],
  interruptions: readonly Interruption[]
): TaskPerformance[];
```

**Types:**

```typescript
type ConcentrationRating = 'Excellent' | 'Good' | 'Fair' | 'Needs improvement';

interface AnalyticsSummary {
  totalPlannedSec: number;      // Sum of all task durations
  totalActualSec: number;       // Time spent on completed tasks
  tasksCompleted: number;       // Number of completed tasks
  totalTasks: number;           // Total tasks in schedule
  scheduleAdherence: number;    // planned/actual × 100 (higher = better)
  concentrationScore: number;   // (work - interruption) / work × 100
  concentrationRating: ConcentrationRating;
  totalInterruptionCount: number;
  totalInterruptionSec: number;
}

interface TaskPerformance {
  taskId: string;
  taskName: string;
  plannedDurationSec: number;
  actualDurationSec: number;
  varianceSec: number;          // actual - planned (positive = over)
  interruptionCount: number;
  interruptionSec: number;
  status: ProgressStatus;
}

/** Concentration score thresholds */
const CONCENTRATION_EXCELLENT_THRESHOLD = 90;
const CONCENTRATION_GOOD_THRESHOLD = 80;
const CONCENTRATION_FAIR_THRESHOLD = 70;
```

**Usage Example:**

```svelte
<script>
  import { sessionStore } from '$lib/stores/sessionStore.svelte';
  import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
  import { calculateAnalyticsSummary, calculateTaskPerformance } from '$lib/services/analytics';

  const summary = $derived(
    calculateAnalyticsSummary(sessionStore.taskProgress, interruptionStore.interruptions)
  );

  const taskPerformance = $derived(
    calculateTaskPerformance(
      sessionStore.tasks,
      sessionStore.taskProgress,
      interruptionStore.interruptions
    )
  );
</script>

<div>Concentration: {summary.concentrationScore}% ({summary.concentrationRating})</div>
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

**Document Version:** 1.2
**Last Updated:** 2025-12-19

See also:
- [Architecture](ARCHITECTURE.md)
- [Data Schema](DATA_SCHEMA.md)
