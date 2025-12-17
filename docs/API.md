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

All stores follow Svelte 5 runes conventions and are reactive.

### Timer Store

Manages the countdown timer state.

```typescript
// src/lib/stores/timer.ts

interface TimerState {
  /** Remaining seconds (negative = overrun) */
  remainingSeconds: number;
  /** Total planned seconds for current task */
  plannedSeconds: number;
  /** Whether timer is actively counting down */
  isRunning: boolean;
  /** Whether timer is paused (interruption) */
  isPaused: boolean;
  /** High-precision timestamp of last tick */
  lastTickTime: number;
}

interface TimerStore {
  /** Current timer state (readonly) */
  readonly state: TimerState;

  /**
   * Start the timer for a task
   * @param durationSeconds - Total seconds to count down
   */
  start(durationSeconds: number): void;

  /**
   * Pause the timer (for interruption)
   */
  pause(): void;

  /**
   * Resume from paused state
   */
  resume(): void;

  /**
   * Stop and reset the timer
   */
  stop(): void;

  /**
   * Get formatted time string
   * @returns Formatted time (e.g., "05:30" or "-02:15")
   */
  getFormattedTime(): string;

  /**
   * Check if timer is in overrun state
   */
  isOverrun(): boolean;
}
```

**Usage Example:**

```svelte
<script>
  import { timerStore } from '$lib/stores/timer';

  // Reactive access to state
  $: remaining = timerStore.state.remainingSeconds;
  $: formatted = timerStore.getFormattedTime();
</script>

<div class:overrun={timerStore.isOverrun()}>
  {formatted}
</div>
```

---

### Tasks Store

Manages the task list and current task state.

```typescript
// src/lib/stores/tasks.ts

interface Task {
  taskId: string;
  name: string;
  type: 'fixed' | 'flexible';
  plannedStart: Date;
  actualStart: Date | null;
  plannedDurationSec: number;
  actualDurationSec: number;
  status: 'pending' | 'active' | 'complete';
  sortOrder: number;
  interruptionCount: number;
  totalInterruptionSec: number;
}

interface TasksState {
  /** All tasks in order */
  tasks: Task[];
  /** Currently active task ID */
  currentTaskId: string | null;
  /** Schedule lag in seconds (positive = behind) */
  lagSeconds: number;
}

interface TasksStore {
  /** Current tasks state (readonly) */
  readonly state: TasksState;

  /**
   * Load tasks from parsed import data
   * @param tasks - Array of task objects
   */
  loadTasks(tasks: Task[]): void;

  /**
   * Get the current active task
   */
  getCurrentTask(): Task | null;

  /**
   * Get the next task in queue
   */
  getNextTask(): Task | null;

  /**
   * Start tracking a specific task
   * @param taskId - Task ID to activate
   */
  startTask(taskId: string): void;

  /**
   * Complete the current task and advance
   * @returns The next task, or null if no more tasks
   */
  completeCurrentTask(): Task | null;

  /**
   * Update actual duration for current task
   * @param seconds - Seconds to add
   */
  addActualTime(seconds: number): void;

  /**
   * Reorder flexible tasks
   * @param taskId - Task to move
   * @param newIndex - New position in list
   */
  reorderTask(taskId: string, newIndex: number): void;

  /**
   * Calculate current schedule lag
   * @returns Lag in seconds (positive = behind schedule)
   */
  calculateLag(): number;

  /**
   * Get upcoming fixed tasks
   * @param withinMinutes - Time window to check
   */
  getUpcomingFixedTasks(withinMinutes: number): Task[];

  /**
   * Clear all tasks (reset)
   */
  clear(): void;
}
```

**Usage Example:**

```svelte
<script>
  import { tasksStore } from '$lib/stores/tasks';

  $: currentTask = tasksStore.getCurrentTask();
  $: lag = tasksStore.state.lagSeconds;
</script>

{#if currentTask}
  <TaskCard task={currentTask} />
  <LagIndicator seconds={lag} />
{/if}
```

---

### Interruptions Store

Tracks interruption events.

```typescript
// src/lib/stores/interruptions.ts

interface Interruption {
  interruptionId: string;
  taskId: string;
  startTime: Date;
  endTime: Date | null;
  durationSec: number;
  category: 'phone' | 'colleague' | 'personal' | 'other';
  note: string;
}

interface InterruptionsState {
  /** All interruptions */
  interruptions: Interruption[];
  /** Currently active interruption */
  activeInterruption: Interruption | null;
}

interface InterruptionsStore {
  /** Current state (readonly) */
  readonly state: InterruptionsState;

  /**
   * Start a new interruption
   * @param taskId - Task being interrupted
   */
  startInterruption(taskId: string): Interruption;

  /**
   * End the active interruption
   * @param category - Optional category
   * @param note - Optional note
   */
  endInterruption(category?: string, note?: string): void;

  /**
   * Get interruptions for a specific task
   * @param taskId - Task ID to filter by
   */
  getForTask(taskId: string): Interruption[];

  /**
   * Get total interruption time for a task
   * @param taskId - Task ID
   * @returns Total seconds
   */
  getTotalTimeForTask(taskId: string): number;

  /**
   * Get interruption count for current session
   */
  getTotalCount(): number;

  /**
   * Get total interruption time for current session
   * @returns Total seconds
   */
  getTotalTime(): number;

  /**
   * Clear all interruptions (reset)
   */
  clear(): void;
}
```

---

### Notes Store

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

### Settings Store

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

**Document Version:** 1.0
**Last Updated:** 2025-12-17

See also:
- [Architecture](ARCHITECTURE.md)
- [Data Schema](DATA_SCHEMA.md)
