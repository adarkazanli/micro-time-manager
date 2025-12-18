/**
 * Parser Service Contract
 *
 * This file defines the public interface for the file parsing service.
 * Implementation should follow this contract exactly.
 *
 * @module parser
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Task type - determines if task time is movable
 */
export type TaskType = 'fixed' | 'flexible';

/**
 * A parsed task before confirmation
 */
export interface DraftTask {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Task name from spreadsheet */
  name: string;
  /** Planned start time (Date object for today) */
  startTime: Date;
  /** Duration in seconds */
  durationSeconds: number;
  /** Fixed or flexible */
  type: TaskType;
  /** Display order (0-based) */
  sortOrder: number;
  /** True if task overlaps another or is in past */
  hasWarning: boolean;
}

/**
 * A validation error found during parsing
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
 * Result of parsing a file
 */
export type ParseResult =
  | { success: true; tasks: DraftTask[] }
  | { success: false; errors: ValidationError[] };

/**
 * Supported file types
 */
export type SupportedFileType = '.xlsx' | '.xls' | '.csv';

// =============================================================================
// Parser Service Interface
// =============================================================================

/**
 * File Parser Service
 *
 * Parses Excel and CSV files containing schedule data.
 * All processing is client-side using SheetJS.
 *
 * @example
 * ```typescript
 * const result = await parseScheduleFile(file);
 * if (result.success) {
 *   console.log(`Parsed ${result.tasks.length} tasks`);
 * } else {
 *   console.error(`Found ${result.errors.length} errors`);
 * }
 * ```
 */
export interface ParserService {
  /**
   * Parse a schedule file
   *
   * @param file - File object from input or drag-drop
   * @returns ParseResult with tasks or errors
   * @throws Never - all errors returned in result
   */
  parseScheduleFile(file: File): Promise<ParseResult>;

  /**
   * Check if file type is supported
   *
   * @param file - File to check
   * @returns true if .xlsx, .xls, or .csv
   */
  isValidFileType(file: File): boolean;

  /**
   * Check if file size is within limit
   *
   * @param file - File to check
   * @returns true if <= 1MB
   */
  isValidFileSize(file: File): boolean;

  /**
   * Get list of supported file extensions
   *
   * @returns Array of extensions with dots
   */
  getSupportedExtensions(): SupportedFileType[];

  /**
   * Get accept string for file input
   *
   * @returns String for input accept attribute
   */
  getAcceptString(): string;
}

// =============================================================================
// Duration Parser Interface
// =============================================================================

/**
 * Duration Parser
 *
 * Parses duration strings in multiple formats.
 *
 * Supported formats:
 * - Seconds: "30s" → 30
 * - Minutes: "30m" → 1800
 * - Hours: "2h" → 7200
 * - Combined: "1h 30m" → 5400
 * - MM:SS: "30:00" → 1800
 * - HH:MM:SS: "01:30:00" → 5400
 *
 * @example
 * ```typescript
 * parseDuration("30m")      // 1800
 * parseDuration("1h 30m")   // 5400
 * parseDuration("01:30:00") // 5400
 * parseDuration("invalid")  // null
 * ```
 */
export interface DurationParser {
  /**
   * Parse duration string to seconds
   *
   * @param input - Duration string
   * @returns Seconds or null if invalid
   */
  parseDuration(input: string): number | null;

  /**
   * Format seconds as human-readable duration
   *
   * @param seconds - Duration in seconds
   * @returns Formatted string (e.g., "1h 30m")
   */
  formatDuration(seconds: number): string;
}

// =============================================================================
// Time Parser Interface
// =============================================================================

/**
 * Time Parser
 *
 * Parses time strings in 12-hour and 24-hour formats.
 *
 * Supported formats:
 * - 24-hour: "09:00", "14:30", "09:00:00"
 * - 12-hour: "9:00 AM", "2:30 PM"
 *
 * @example
 * ```typescript
 * parseTime("09:00")    // Date for today at 09:00
 * parseTime("2:30 PM")  // Date for today at 14:30
 * parseTime("25:00")    // null (invalid)
 * ```
 */
export interface TimeParser {
  /**
   * Parse time string to Date for today
   *
   * @param input - Time string
   * @returns Date object or null if invalid
   */
  parseTime(input: string): Date | null;

  /**
   * Format Date as time string
   *
   * @param date - Date object
   * @param format - '12h' or '24h' (default: '24h')
   * @returns Formatted time string
   */
  formatTime(date: Date, format?: '12h' | '24h'): string;
}

// =============================================================================
// Template Generator Interface
// =============================================================================

/**
 * Template Generator
 *
 * Generates downloadable schedule template files.
 */
export interface TemplateGenerator {
  /**
   * Download schedule template
   *
   * Creates and triggers download of Excel template with:
   * - Header row: Task Name, Start Time, Duration, Type
   * - 3 example rows demonstrating format
   *
   * @param filename - Output filename (default: 'schedule-template.xlsx')
   */
  downloadTemplate(filename?: string): void;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Required column names (case-insensitive matching)
 */
export const REQUIRED_COLUMNS = [
  'Task Name',
  'Start Time',
  'Duration',
  'Type',
] as const;

/**
 * Maximum file size in bytes (1MB)
 */
export const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Maximum tasks per schedule
 */
export const MAX_TASKS = 50;

/**
 * Maximum duration in seconds (24 hours)
 */
export const MAX_DURATION_SECONDS = 86400;

/**
 * Maximum task name length
 */
export const MAX_TASK_NAME_LENGTH = 200;
