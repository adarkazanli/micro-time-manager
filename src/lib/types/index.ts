/**
 * Shared TypeScript types for Schedule Import feature
 * Based on data-model.md specification
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

/** Supported file extensions */
export type SupportedFileType = '.xlsx' | '.xls' | '.csv';

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

/** Current schema version */
export const CURRENT_SCHEMA_VERSION = 1;
