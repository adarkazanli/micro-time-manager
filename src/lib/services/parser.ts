/**
 * File Parser Service
 *
 * Parses Excel and CSV files containing schedule data.
 * All processing is client-side using SheetJS.
 */

import * as XLSX from 'xlsx';
import { parseDuration } from '$lib/utils/duration';
import { parseTime } from '$lib/utils/time';
import type {
	DraftTask,
	ValidationError,
	ParseResult,
	SupportedFileType,
	TaskType
} from '$lib/types';
import {
	REQUIRED_COLUMNS,
	MAX_FILE_SIZE,
	MAX_TASK_NAME_LENGTH,
	MAX_DURATION_SECONDS
} from '$lib/types';

/**
 * Supported file extensions
 */
const SUPPORTED_EXTENSIONS: SupportedFileType[] = ['.xlsx', '.xls', '.csv'];

/**
 * Generate a UUID v4
 */
function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf('.');
	if (lastDot === -1) return '';
	return filename.substring(lastDot).toLowerCase();
}

/**
 * Check if file type is supported
 */
export function isValidFileType(file: File): boolean {
	const ext = getFileExtension(file.name);
	return SUPPORTED_EXTENSIONS.includes(ext as SupportedFileType);
}

/**
 * Check if file size is within limit
 */
export function isValidFileSize(file: File): boolean {
	return file.size <= MAX_FILE_SIZE;
}

/**
 * Get list of supported file extensions
 */
export function getSupportedExtensions(): SupportedFileType[] {
	return [...SUPPORTED_EXTENSIONS];
}

/**
 * Get accept string for file input
 */
export function getAcceptString(): string {
	return SUPPORTED_EXTENSIONS.join(',');
}

/**
 * Truncate string to max length for error display
 */
function truncateValue(value: unknown, maxLength: number = 50): string {
	const str = String(value ?? '');
	if (str.length <= maxLength) return str;
	return str.substring(0, maxLength - 3) + '...';
}

/**
 * Normalize column name for matching (case-insensitive, trimmed)
 */
function normalizeColumnName(name: string): string {
	return name.trim().toLowerCase();
}

/**
 * Find column index by name (case-insensitive)
 */
function findColumnIndex(
	headers: string[],
	columnName: string
): number {
	const normalized = normalizeColumnName(columnName);
	return headers.findIndex(
		(h) => normalizeColumnName(String(h)) === normalized
	);
}

/**
 * Parse task type string
 */
function parseTaskType(value: string): TaskType | null {
	const normalized = value.trim().toLowerCase();
	if (normalized === 'fixed' || normalized === 'flexible') {
		return normalized;
	}
	return null;
}

/**
 * Parse a schedule file
 */
export async function parseScheduleFile(file: File): Promise<ParseResult> {
	const errors: ValidationError[] = [];

	// Validate file type
	if (!isValidFileType(file)) {
		errors.push({
			row: 0,
			column: 'File',
			value: getFileExtension(file.name) || 'unknown',
			message: `Unsupported file type. Please use .xlsx, .xls, or .csv files.`
		});
		return { success: false, errors };
	}

	// Validate file size
	if (!isValidFileSize(file)) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
		errors.push({
			row: 0,
			column: 'File',
			value: `${sizeMB}MB`,
			message: `File exceeds 1MB limit. Please use a smaller file.`
		});
		return { success: false, errors };
	}

	// Read file as ArrayBuffer
	let data: ArrayBuffer;
	try {
		data = await file.arrayBuffer();
	} catch {
		errors.push({
			row: 0,
			column: 'File',
			value: file.name,
			message: 'Failed to read file. Please try again.'
		});
		return { success: false, errors };
	}

	// Parse with SheetJS
	let workbook: XLSX.WorkBook;
	try {
		workbook = XLSX.read(data, { type: 'array' });
	} catch {
		errors.push({
			row: 0,
			column: 'File',
			value: file.name,
			message: 'Failed to parse file. Please ensure it is a valid spreadsheet.'
		});
		return { success: false, errors };
	}

	// Get first sheet
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) {
		errors.push({
			row: 0,
			column: 'File',
			value: file.name,
			message: 'No sheets found in file.'
		});
		return { success: false, errors };
	}

	const sheet = workbook.Sheets[sheetName];

	// Convert to array of arrays (header: 1)
	const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
		header: 1,
		defval: ''
	});

	if (rows.length === 0) {
		errors.push({
			row: 0,
			column: 'File',
			value: file.name,
			message: 'File is empty. Please add headers and data.'
		});
		return { success: false, errors };
	}

	// Get headers from first row
	const headers = rows[0].map(String);

	// Find required column indices
	const columnIndices: Record<string, number> = {};
	for (const colName of REQUIRED_COLUMNS) {
		const index = findColumnIndex(headers, colName);
		if (index === -1) {
			errors.push({
				row: 1,
				column: colName,
				value: '',
				message: `Required column '${colName}' not found.`
			});
		} else {
			columnIndices[colName] = index;
		}
	}

	// If missing required columns, return errors
	if (errors.length > 0) {
		return { success: false, errors };
	}

	// Check for data rows
	const dataRows = rows.slice(1).filter((row) =>
		row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
	);

	if (dataRows.length === 0) {
		errors.push({
			row: 0,
			column: 'File',
			value: file.name,
			message: 'No tasks found. Please add at least one task row.'
		});
		return { success: false, errors };
	}

	// Parse each data row
	const tasks: DraftTask[] = [];
	const taskNameIdx = columnIndices['Task Name'];
	const startTimeIdx = columnIndices['Start Time'];
	const durationIdx = columnIndices['Duration'];
	const typeIdx = columnIndices['Type'];

	for (let i = 0; i < dataRows.length; i++) {
		const row = dataRows[i];
		const rowNum = i + 2; // 1-based, skip header

		// Task Name
		const rawName = String(row[taskNameIdx] ?? '').trim();
		if (!rawName) {
			errors.push({
				row: rowNum,
				column: 'Task Name',
				value: '',
				message: `Row ${rowNum}: Task Name cannot be empty.`
			});
		} else if (rawName.length > MAX_TASK_NAME_LENGTH) {
			errors.push({
				row: rowNum,
				column: 'Task Name',
				value: truncateValue(rawName),
				message: `Row ${rowNum}: Task Name exceeds ${MAX_TASK_NAME_LENGTH} characters.`
			});
		}

		// Type (parse early to check if start time is required)
		const rawType = String(row[typeIdx] ?? '').trim();
		const taskType = rawType ? parseTaskType(rawType) : null;

		// Start Time - only required for fixed tasks (flexible tasks get calculated start times)
		const rawTime = String(row[startTimeIdx] ?? '').trim();
		const startTime = rawTime ? parseTime(rawTime) : null;
		const isFixed = taskType === 'fixed';

		if (!rawTime && isFixed) {
			// Fixed tasks require a start time
			errors.push({
				row: rowNum,
				column: 'Start Time',
				value: '',
				message: `Row ${rowNum}: Start Time is required for fixed tasks.`
			});
		} else if (rawTime && !startTime) {
			// If a time was provided but couldn't be parsed
			errors.push({
				row: rowNum,
				column: 'Start Time',
				value: truncateValue(rawTime),
				message: `Row ${rowNum}: Invalid time format '${truncateValue(rawTime)}'.`
			});
		}

		// Duration
		const rawDuration = String(row[durationIdx] ?? '').trim();
		const durationSeconds = rawDuration ? parseDuration(rawDuration) : null;
		if (!rawDuration) {
			errors.push({
				row: rowNum,
				column: 'Duration',
				value: '',
				message: `Row ${rowNum}: Duration cannot be empty.`
			});
		} else if (durationSeconds === null) {
			errors.push({
				row: rowNum,
				column: 'Duration',
				value: truncateValue(rawDuration),
				message: `Row ${rowNum}: Invalid duration format '${truncateValue(rawDuration)}'.`
			});
		} else if (durationSeconds <= 0) {
			errors.push({
				row: rowNum,
				column: 'Duration',
				value: truncateValue(rawDuration),
				message: `Row ${rowNum}: Duration must be greater than 0.`
			});
		} else if (durationSeconds > MAX_DURATION_SECONDS) {
			errors.push({
				row: rowNum,
				column: 'Duration',
				value: truncateValue(rawDuration),
				message: `Row ${rowNum}: Duration cannot exceed 24 hours.`
			});
		}

		// Type validation (already parsed above for start time check)
		if (!rawType) {
			errors.push({
				row: rowNum,
				column: 'Type',
				value: '',
				message: `Row ${rowNum}: Type cannot be empty.`
			});
		} else if (!taskType) {
			errors.push({
				row: rowNum,
				column: 'Type',
				value: truncateValue(rawType),
				message: `Row ${rowNum}: Type must be 'fixed' or 'flexible', got '${truncateValue(rawType)}'.`
			});
		}

		// If this row has no errors, create a DraftTask
		// For flexible tasks without start time, use a placeholder (will be calculated by schedule calculator)
		const hasValidStartTime = startTime || (taskType === 'flexible' && !rawTime);
		if (rawName && hasValidStartTime && durationSeconds && durationSeconds > 0 && taskType) {
			// For flexible tasks without explicit start time, use current time as placeholder
			// The actual start time will be calculated by the schedule calculator
			const effectiveStartTime = startTime || new Date();
			tasks.push({
				id: generateId(),
				name: rawName,
				startTime: effectiveStartTime,
				durationSeconds,
				type: taskType,
				sortOrder: i,
				hasWarning: false
			});
		}
	}

	// If there were validation errors, return them
	if (errors.length > 0) {
		return { success: false, errors };
	}

	// Sort tasks by start time
	tasks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

	// Update sort order after sorting
	tasks.forEach((task, index) => {
		task.sortOrder = index;
	});

	return { success: true, tasks };
}
