/**
 * Shared TypeScript types for Micro Time Manager
 * Based on data-model.md specifications for 001-schedule-import and 002-day-tracking
 */

// =============================================================================
// Enums and Literals
// =============================================================================

/** Task type - determines if task time is movable */
export type TaskType = 'fixed' | 'flexible';

/** Import workflow state */
export type ImportStatus = 'idle' | 'parsing' | 'preview' | 'error' | 'ready';

/** Task status (post-confirmation) */
export type TaskStatus = 'pending' | 'active' | 'complete';

/** Timer visual state based on remaining time */
export type TimerColor = 'green' | 'yellow' | 'red';

/** Day session execution status */
export type SessionStatus = 'idle' | 'running' | 'complete';

/** Individual task progress status */
export type ProgressStatus = 'pending' | 'active' | 'complete' | 'missed';

/** Supported file extensions */
export type SupportedFileType = '.xlsx' | '.xls' | '.csv';

/** Risk level for fixed task indicators in impact panel */
export type RiskLevel = 'green' | 'yellow' | 'red';

/** Display status for task styling in impact panel */
export type DisplayStatus = 'completed' | 'current' | 'pending';

// =============================================================================
// Core Entities
// =============================================================================

/**
 * A task in preview state before confirmation.
 * Editable and reorderable.
 */
export interface DraftTask {
	/** Unique identifier (UUID v4) */
	id: string;
	/** Task name from spreadsheet (1-200 chars) */
	name: string;
	/** Planned start time (Date object for today) */
	startTime: Date;
	/** Duration in seconds (1-86400) */
	durationSeconds: number;
	/** Fixed or flexible */
	type: TaskType;
	/** Display order (0-based) */
	sortOrder: number;
	/** True if task overlaps another or is in past */
	hasWarning: boolean;
}

/**
 * A task after schedule confirmation.
 * Persisted to localStorage.
 */
export interface ConfirmedTask {
	/** Unique identifier (preserved from DraftTask.id) */
	taskId: string;
	/** Task name (immutable after confirm) */
	name: string;
	/** Planned start time */
	plannedStart: Date;
	/** Planned duration in seconds */
	plannedDurationSec: number;
	/** Fixed or flexible */
	type: TaskType;
	/** Execution order (final order from preview) */
	sortOrder: number;
	/** Completion state */
	status: TaskStatus;
}

/**
 * A validation error found during parsing.
 */
export interface ValidationError {
	/** Row number in spreadsheet (1-based, header is row 1) */
	row: number;
	/** Column name */
	column: string;
	/** The invalid value (truncated to 50 chars) */
	value: string;
	/** Human-readable error message */
	message: string;
}

/**
 * Runtime state for the import workflow.
 * Not persisted.
 */
export interface ImportState {
	/** Current workflow state */
	status: ImportStatus;
	/** Uploaded file reference */
	file: File | null;
	/** Upload timestamp */
	uploadedAt: Date | null;
	/** Parsed tasks in preview */
	tasks: DraftTask[];
	/** Validation errors */
	errors: ValidationError[];
}

// =============================================================================
// Day Tracking Entities (002-day-tracking)
// =============================================================================

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
	completedAt: string | null;
	/** Current execution state */
	status: ProgressStatus;
}

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

// =============================================================================
// Impact Panel Entities (003-impact-panel)
// =============================================================================

/**
 * Task with projected timing information for impact display.
 * Computed at runtime, not persisted.
 */
export interface ProjectedTask {
	/** Reference to original ConfirmedTask */
	task: ConfirmedTask;
	/** Projected start time based on current progress */
	projectedStart: Date;
	/** Projected end time (projectedStart + duration) */
	projectedEnd: Date;
	/** Risk level for fixed tasks (null for flexible) */
	riskLevel: RiskLevel | null;
	/** Seconds of buffer before scheduled start (negative = late) */
	bufferSec: number;
	/** Visual status for styling */
	displayStatus: DisplayStatus;
	/** Whether this task can be dragged (flexible + not completed/current) */
	isDraggable: boolean;
}

/**
 * Complete state for the impact panel.
 * Derived from session state and timer.
 */
export interface ImpactPanelState {
	/** All tasks with projections */
	projectedTasks: ProjectedTask[];
	/** Count of fixed tasks at each risk level */
	riskSummary: {
		green: number;
		yellow: number;
		red: number;
	};
	/** Whether any reordering is possible */
	canReorder: boolean;
}

// =============================================================================
// Parse Result Types
// =============================================================================

/** Successful parse result */
export interface ParseSuccess {
	success: true;
	tasks: DraftTask[];
}

/** Failed parse result */
export interface ParseFailure {
	success: false;
	errors: ValidationError[];
}

/** Result of parsing a file */
export type ParseResult = ParseSuccess | ParseFailure;

// =============================================================================
// Constants
// =============================================================================

/** Required column names (case-insensitive matching) */
export const REQUIRED_COLUMNS = ['Task Name', 'Start Time', 'Duration', 'Type'] as const;

/** Maximum file size in bytes (1MB) */
export const MAX_FILE_SIZE = 1024 * 1024;

/** Maximum tasks per schedule */
export const MAX_TASKS = 50;

/** Maximum duration in seconds (24 hours) */
export const MAX_DURATION_SECONDS = 86400;

/** Maximum task name length */
export const MAX_TASK_NAME_LENGTH = 200;

/** localStorage key for confirmed tasks */
export const STORAGE_KEY_TASKS = 'tm_tasks';

/** localStorage key for schema version */
export const STORAGE_KEY_SCHEMA = 'tm_schema_version';

/** localStorage key for day session */
export const STORAGE_KEY_SESSION = 'tm_session';

/** localStorage key for active tab info */
export const STORAGE_KEY_TAB = 'tm_active_tab';

/** Current schema version */
export const CURRENT_SCHEMA_VERSION = 4;

// =============================================================================
// Day Tracking Constants (002-day-tracking)
// =============================================================================

/** Warning threshold - timer turns yellow at 5 minutes remaining (ms) */
export const WARNING_THRESHOLD_MS = 300000;

/** Tab is considered stale after this many ms without heartbeat */
export const TAB_STALE_THRESHOLD_MS = 5000;

/** How often to send tab heartbeat (ms) */
export const TAB_HEARTBEAT_INTERVAL_MS = 2000;

/** How often to persist timer state to localStorage (ms) */
export const PERSIST_INTERVAL_MS = 5000;

// =============================================================================
// Interruption Tracking Types (004-interruption-tracking)
// =============================================================================

/** Category for classifying interruptions */
export type InterruptionCategory = 'Phone' | 'Luci' | 'Colleague' | 'Personal' | 'Other';

/**
 * A single interruption event during task execution.
 * Created when user clicks "Interrupt", finalized on "Resume".
 */
export interface Interruption {
	/** Unique identifier (UUID v4) */
	interruptionId: string;
	/** Reference to the task that was interrupted */
	taskId: string;
	/** When the interruption started (ISO 8601 string) */
	startedAt: string;
	/** When the interruption ended (ISO 8601 string), null if ongoing */
	endedAt: string | null;
	/** Duration in seconds (calculated on end), 0 if ongoing */
	durationSec: number;
	/** Optional category selected by user */
	category: InterruptionCategory | null;
	/** Optional note added by user (max 200 chars) */
	note: string | null;
}

/**
 * Aggregated interruption data for a single task.
 * Computed at runtime from Interruption[].
 */
export interface InterruptionSummary {
	/** Reference to task */
	taskId: string;
	/** Total number of interruptions for this task */
	count: number;
	/** Total interruption time in seconds */
	totalDurationSec: number;
}

/**
 * Runtime state for the interruption store.
 * Manages active interruption and history.
 */
export interface InterruptionState {
	/** Whether an interruption is currently active */
	isInterrupted: boolean;
	/** The currently active interruption, null if not interrupted */
	activeInterruption: Interruption | null;
	/** Elapsed milliseconds on current interruption (for display) */
	elapsedMs: number;
	/** All interruptions for the current session */
	interruptions: Interruption[];
}

/**
 * Shape for persisting interruption state to localStorage.
 * Includes pausedTaskElapsedMs to restore the task timer position.
 */
export interface PersistedInterruptionState {
	/** All interruptions (completed and active) */
	interruptions: Interruption[];
	/** Elapsed ms on task timer when interrupted (for resume) */
	pausedTaskElapsedMs: number;
}

// =============================================================================
// Interruption Tracking Constants (004-interruption-tracking)
// =============================================================================

/** localStorage key for interruptions */
export const STORAGE_KEY_INTERRUPTIONS = 'tm_interruptions';

/** Maximum note length */
export const MAX_INTERRUPTION_NOTE_LENGTH = 200;

/** Interruption categories for UI iteration */
export const INTERRUPTION_CATEGORIES: InterruptionCategory[] = [
	'Phone',
	'Luci',
	'Colleague',
	'Personal',
	'Other'
];

// =============================================================================
// Note Capture Types (005-note-capture)
// =============================================================================

/**
 * A quick note captured during task execution.
 * Created when user saves a note, can be edited after creation.
 */
export interface Note {
	/** Unique identifier (UUID v4) */
	noteId: string;
	/** Note content (max 500 characters) */
	content: string;
	/** When the note was created (ISO 8601 string) */
	createdAt: string;
	/** When the note was last updated (ISO 8601 string), null if never edited */
	updatedAt: string | null;
	/** Reference to the task during which note was created, null if no active task */
	taskId: string | null;
}

// =============================================================================
// Note Capture Constants (005-note-capture)
// =============================================================================

/** localStorage key for notes */
export const STORAGE_KEY_NOTES = 'tm_notes';

/** Maximum note content length */
export const MAX_NOTE_LENGTH = 500;

/** Character count threshold for yellow warning (remaining chars) */
export const NOTE_CHAR_WARNING_THRESHOLD = 50;

/** Character count threshold for red danger (remaining chars) */
export const NOTE_CHAR_DANGER_THRESHOLD = 10;

// =============================================================================
// Analytics Types (006-analytics-dashboard)
// =============================================================================

/**
 * Rating tier for concentration score.
 * Based on thresholds: Excellent (≥90%), Good (80-89%), Fair (70-79%), Needs improvement (<70%)
 */
export type ConcentrationRating = 'Excellent' | 'Good' | 'Fair' | 'Needs improvement';

/**
 * Day-level analytics summary.
 * Computed from sessionStore and interruptionStore data, not persisted.
 */
export interface AnalyticsSummary {
	/** Total planned time across all tasks (seconds) */
	totalPlannedSec: number;
	/** Total actual time spent on tasks (seconds) */
	totalActualSec: number;
	/** Number of completed tasks */
	tasksCompleted: number;
	/** Total number of tasks in schedule */
	totalTasks: number;
	/** Schedule adherence percentage (planned/actual × 100) */
	scheduleAdherence: number;
	/** Concentration score percentage (0-100) */
	concentrationScore: number;
	/** Human-readable concentration rating */
	concentrationRating: ConcentrationRating;
	/** Total number of interruptions across all tasks */
	totalInterruptionCount: number;
	/** Total interruption time across all tasks (seconds) */
	totalInterruptionSec: number;
}

/**
 * Performance metrics for a single task.
 * Computed by joining task, progress, and interruption data.
 */
export interface TaskPerformance {
	/** Task identifier (from ConfirmedTask) */
	taskId: string;
	/** Task name for display */
	taskName: string;
	/** Planned duration (seconds) */
	plannedDurationSec: number;
	/** Actual duration (seconds), 0 if not complete */
	actualDurationSec: number;
	/** Variance: actual - planned (positive = over, negative = under) */
	varianceSec: number;
	/** Number of interruptions during this task */
	interruptionCount: number;
	/** Total interruption time for this task (seconds) */
	interruptionSec: number;
	/** Task completion status */
	status: ProgressStatus;
}

// =============================================================================
// Analytics Constants (006-analytics-dashboard)
// =============================================================================

/** Concentration score threshold for "Excellent" rating (≥90%) */
export const CONCENTRATION_EXCELLENT_THRESHOLD = 90;

/** Concentration score threshold for "Good" rating (≥80%) */
export const CONCENTRATION_GOOD_THRESHOLD = 80;

/** Concentration score threshold for "Fair" rating (≥70%) */
export const CONCENTRATION_FAIR_THRESHOLD = 70;

// =============================================================================
// Data Export Types (007-data-export)
// =============================================================================

/** Export format options */
export type ExportFormat = 'excel' | 'csv';

/**
 * Task data row for export.
 * Represents a single task in the Tasks export sheet/file.
 */
export interface TaskExportRow {
	/** Task name from ConfirmedTask */
	taskName: string;
	/** Task type (fixed or flexible) */
	type: 'fixed' | 'flexible';
	/** Planned start time in HH:MM:SS format */
	plannedStart: string;
	/** Actual start time in HH:MM:SS format */
	actualStart: string;
	/** Planned duration in HH:MM:SS format */
	plannedDuration: string;
	/** Actual duration in HH:MM:SS format */
	actualDuration: string;
	/** Variance (actual - planned) in +/-HH:MM:SS format */
	variance: string;
	/** Count of interruptions during this task */
	interruptionCount: number;
	/** Total interruption time in HH:MM:SS format */
	interruptionTime: string;
	/** Status display string: Complete, In Progress, Pending, Missed */
	status: string;
}

/**
 * Interruption data row for export.
 * Represents a single interruption in the Interruptions export sheet/file.
 */
export interface InterruptionExportRow {
	/** Task name (lookup from taskId) */
	task: string;
	/** Start time in HH:MM:SS format */
	startTime: string;
	/** End time in HH:MM:SS format (or 'In Progress') */
	endTime: string;
	/** Duration in HH:MM:SS format */
	duration: string;
	/** Category or empty string */
	category: string;
	/** Note content or empty string */
	note: string;
}

/**
 * Note data row for export.
 * Represents a single note in the Notes export sheet/file.
 */
export interface NoteExportRow {
	/** Creation time in HH:MM:SS format */
	time: string;
	/** Task name or empty if no association */
	task: string;
	/** Note content */
	content: string;
}

/**
 * Summary metric row for export.
 * Key-value pair for the Summary export sheet/file.
 */
export interface SummaryExportRow {
	/** Metric name */
	metric: string;
	/** Formatted value */
	value: string;
}

/**
 * Result of an export operation.
 * Used to communicate success/failure to the UI for user feedback.
 */
export interface ExportResult {
	/** Whether the export succeeded */
	success: boolean;
	/** Error message if failed, undefined if successful */
	error?: string;
	/** Number of files downloaded (for CSV this is 4, for Excel this is 1) */
	filesDownloaded?: number;
}
