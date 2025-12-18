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
export const CURRENT_SCHEMA_VERSION = 2;

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
