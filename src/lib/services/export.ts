/**
 * Export Service
 *
 * Feature: 007-data-export
 * Tasks: T015-T019, T031-T037
 *
 * Provides data preparation functions for exporting session data
 * to Excel and CSV formats.
 */

import * as XLSX from 'xlsx';
import {
	formatDurationHHMMSS,
	formatVarianceHHMMSS,
	formatTimeHHMMSS,
	formatDateYYYYMMDD,
	escapeCSVValue
} from '$lib/utils/formatters';
import type {
	ConfirmedTask,
	TaskProgress,
	Interruption,
	Note,
	AnalyticsSummary,
	TaskExportRow,
	InterruptionExportRow,
	NoteExportRow,
	SummaryExportRow,
	ExportFormat,
	ExportResult
} from '$lib/types';

// =============================================================================
// T015: prepareTasksExport
// =============================================================================

/**
 * Map task status to display-friendly string.
 */
function mapStatusToDisplay(status: TaskProgress['status']): string {
	switch (status) {
		case 'complete':
			return 'Complete';
		case 'active':
			return 'In Progress';
		case 'pending':
			return 'Pending';
		case 'missed':
			return 'Missed';
		default:
			return 'Unknown';
	}
}

/**
 * Prepare tasks data for export.
 *
 * @param tasks - Array of confirmed tasks
 * @param progress - Array of task progress records
 * @param interruptions - Array of interruptions for calculating per-task interruption stats
 * @param sessionStart - ISO string of session start time
 * @returns Array of TaskExportRow ready for export
 */
export function prepareTasksExport(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	interruptions: Interruption[],
	sessionStart: string
): TaskExportRow[] {
	if (tasks.length === 0) {
		return [];
	}

	// Create progress lookup by taskId
	const progressMap = new Map<string, TaskProgress>();
	for (const p of progress) {
		progressMap.set(p.taskId, p);
	}

	// Group interruptions by taskId
	const interruptionsByTask = new Map<string, Interruption[]>();
	for (const int of interruptions) {
		const existing = interruptionsByTask.get(int.taskId) || [];
		existing.push(int);
		interruptionsByTask.set(int.taskId, existing);
	}

	// Track previous task completion for actualStart calculation
	let prevCompletedAt: string | null = sessionStart;

	return tasks.map((task) => {
		const taskProgress = progressMap.get(task.taskId);
		const taskInterruptions = interruptionsByTask.get(task.taskId) || [];

		// Calculate interruption aggregates
		const interruptionCount = taskInterruptions.length;
		const interruptionTotalSec = taskInterruptions.reduce((sum, int) => sum + int.durationSec, 0);

		// Get actual duration from progress, default to 0
		const actualDurationSec = taskProgress?.actualDurationSec ?? 0;
		const plannedDurationSec = task.plannedDurationSec;

		// Calculate variance (actual - planned)
		const varianceSec = actualDurationSec - plannedDurationSec;

		// Get status from progress, default to 'pending'
		const status = taskProgress?.status ?? 'pending';

		// Calculate actual start from previous task completion or session start
		const actualStart = prevCompletedAt
			? formatTimeHHMMSS(prevCompletedAt)
			: '';

		// Update prevCompletedAt for next task
		if (taskProgress?.completedAt) {
			prevCompletedAt = taskProgress.completedAt;
		}

		return {
			taskName: task.name,
			type: task.type,
			plannedStart: formatTimeHHMMSS(task.plannedStart),
			actualStart,
			plannedDuration: formatDurationHHMMSS(plannedDurationSec),
			actualDuration: formatDurationHHMMSS(actualDurationSec),
			variance: formatVarianceHHMMSS(varianceSec),
			interruptionCount,
			interruptionTime: formatDurationHHMMSS(interruptionTotalSec),
			status: mapStatusToDisplay(status)
		};
	});
}

// =============================================================================
// T016: prepareInterruptionsExport
// =============================================================================

/**
 * Prepare interruptions data for export.
 *
 * @param interruptions - Array of interruptions
 * @param tasks - Array of tasks for looking up task names
 * @returns Array of InterruptionExportRow ready for export
 */
export function prepareInterruptionsExport(
	interruptions: Interruption[],
	tasks: ConfirmedTask[]
): InterruptionExportRow[] {
	if (interruptions.length === 0) {
		return [];
	}

	// Create task name lookup
	const taskNameMap = new Map<string, string>();
	for (const task of tasks) {
		taskNameMap.set(task.taskId, task.name);
	}

	return interruptions.map((int) => ({
		task: taskNameMap.get(int.taskId) || '',
		startTime: formatTimeHHMMSS(int.startedAt),
		endTime: int.endedAt ? formatTimeHHMMSS(int.endedAt) : 'In Progress',
		duration: formatDurationHHMMSS(int.durationSec),
		category: int.category ?? '',
		note: int.note ?? ''
	}));
}

// =============================================================================
// T017: prepareNotesExport
// =============================================================================

/**
 * Prepare notes data for export.
 *
 * @param notes - Array of notes
 * @param tasks - Array of tasks for looking up task names
 * @returns Array of NoteExportRow ready for export
 */
export function prepareNotesExport(notes: Note[], tasks: ConfirmedTask[]): NoteExportRow[] {
	if (notes.length === 0) {
		return [];
	}

	// Create task name lookup
	const taskNameMap = new Map<string, string>();
	for (const task of tasks) {
		taskNameMap.set(task.taskId, task.name);
	}

	return notes.map((note) => ({
		time: formatTimeHHMMSS(note.createdAt),
		task: note.taskId ? taskNameMap.get(note.taskId) ?? '' : '',
		content: note.content
	}));
}

// =============================================================================
// T018: prepareSummaryExport
// =============================================================================

/**
 * Prepare summary data for export.
 *
 * @param summary - Analytics summary data
 * @param sessionStart - ISO string of session start time
 * @param sessionEnd - ISO string of session end time (null if in progress)
 * @returns Array of SummaryExportRow with metric name-value pairs
 */
export function prepareSummaryExport(
	summary: AnalyticsSummary,
	sessionStart: string,
	sessionEnd: string | null
): SummaryExportRow[] {
	const endTime = sessionEnd ? formatTimeHHMMSS(sessionEnd) : formatTimeHHMMSS(new Date());

	return [
		{ metric: 'Session Date', value: getSessionDate(sessionStart) },
		{ metric: 'Session Start', value: formatTimeHHMMSS(sessionStart) },
		{ metric: 'Session End', value: endTime },
		{ metric: 'Total Planned Time', value: formatDurationHHMMSS(summary.totalPlannedSec) },
		{ metric: 'Total Actual Time', value: formatDurationHHMMSS(summary.totalActualSec) },
		{ metric: 'Total Interruption Time', value: formatDurationHHMMSS(summary.totalInterruptionSec) },
		{ metric: 'Interruption Count', value: summary.totalInterruptionCount.toString() },
		{ metric: 'Concentration Score', value: `${summary.concentrationScore.toFixed(1)}%` },
		{ metric: 'Schedule Adherence', value: `${summary.scheduleAdherence.toFixed(1)}%` },
		{ metric: 'Tasks Completed', value: `${summary.tasksCompleted} of ${summary.totalTasks}` }
	];
}

// =============================================================================
// T019: getSessionDate
// =============================================================================

/**
 * Extract the date portion from a session start timestamp.
 *
 * @param sessionStart - ISO 8601 datetime string
 * @returns Date string in YYYY-MM-DD format
 */
export function getSessionDate(sessionStart: string): string {
	return formatDateYYYYMMDD(sessionStart);
}

// =============================================================================
// T031-T035: Excel Workbook Generation
// =============================================================================

/**
 * Column headers for Tasks sheet
 */
const TASKS_HEADERS = [
	'Task Name',
	'Type',
	'Planned Start',
	'Actual Start',
	'Planned Duration',
	'Actual Duration',
	'Variance',
	'Interruptions',
	'Interruption Time',
	'Status'
];

/**
 * Column headers for Interruptions sheet
 */
const INTERRUPTIONS_HEADERS = ['Task', 'Start Time', 'End Time', 'Duration', 'Category', 'Note'];

/**
 * Column headers for Notes sheet
 */
const NOTES_HEADERS = ['Time', 'Task', 'Content'];

/**
 * Column headers for Summary sheet
 */
const SUMMARY_HEADERS = ['Metric', 'Value'];

/**
 * Convert TaskExportRow to array for sheet row.
 */
function taskRowToArray(row: TaskExportRow): (string | number)[] {
	return [
		row.taskName,
		row.type,
		row.plannedStart,
		row.actualStart,
		row.plannedDuration,
		row.actualDuration,
		row.variance,
		row.interruptionCount,
		row.interruptionTime,
		row.status
	];
}

/**
 * Convert InterruptionExportRow to array for sheet row.
 */
function interruptionRowToArray(row: InterruptionExportRow): string[] {
	return [row.task, row.startTime, row.endTime, row.duration, row.category, row.note];
}

/**
 * Convert NoteExportRow to array for sheet row.
 */
function noteRowToArray(row: NoteExportRow): string[] {
	return [row.time, row.task, row.content];
}

/**
 * Convert SummaryExportRow to array for sheet row.
 */
function summaryRowToArray(row: SummaryExportRow): string[] {
	return [row.metric, row.value];
}

/**
 * Generate an Excel workbook with all session data.
 *
 * @param tasks - Array of confirmed tasks
 * @param progress - Array of task progress records
 * @param interruptions - Array of interruptions
 * @param notes - Array of notes
 * @param summary - Analytics summary
 * @param sessionStart - ISO string of session start time
 * @param sessionEnd - ISO string of session end time (null if in progress)
 * @returns XLSX WorkBook object
 */
export function generateExcelWorkbook(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	interruptions: Interruption[],
	notes: Note[],
	summary: AnalyticsSummary,
	sessionStart: string,
	sessionEnd: string | null
): XLSX.WorkBook {
	// Prepare data for each sheet
	const tasksData = prepareTasksExport(tasks, progress, interruptions, sessionStart);
	const interruptionsData = prepareInterruptionsExport(interruptions, tasks);
	const notesData = prepareNotesExport(notes, tasks);
	const summaryData = prepareSummaryExport(summary, sessionStart, sessionEnd);

	// Create workbook
	const workbook = XLSX.utils.book_new();

	// T032: Create Tasks sheet
	const tasksSheet = XLSX.utils.aoa_to_sheet([
		TASKS_HEADERS,
		...tasksData.map(taskRowToArray)
	]);
	XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

	// T033: Create Interruptions sheet
	const interruptionsSheet = XLSX.utils.aoa_to_sheet([
		INTERRUPTIONS_HEADERS,
		...interruptionsData.map(interruptionRowToArray)
	]);
	XLSX.utils.book_append_sheet(workbook, interruptionsSheet, 'Interruptions');

	// T034: Create Notes sheet
	const notesSheet = XLSX.utils.aoa_to_sheet([
		NOTES_HEADERS,
		...notesData.map(noteRowToArray)
	]);
	XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');

	// T035: Create Summary sheet
	const summarySheet = XLSX.utils.aoa_to_sheet([
		SUMMARY_HEADERS,
		...summaryData.map(summaryRowToArray)
	]);
	XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

	return workbook;
}

// =============================================================================
// T036-T037: File Export Functions
// =============================================================================

/**
 * Generate filename for export based on session date and format.
 *
 * @param sessionStart - ISO string of session start time
 * @param format - Export format ('excel' or 'csv')
 * @param dataType - For CSV, the type of data (tasks, interruptions, notes, summary)
 * @returns Filename string
 */
export function getExportFilename(
	sessionStart: string,
	format: ExportFormat,
	dataType?: 'tasks' | 'interruptions' | 'notes' | 'summary'
): string {
	const date = getSessionDate(sessionStart);

	if (format === 'excel') {
		return `${date}_productivity.xlsx`;
	}

	// CSV format
	return `${date}_${dataType}.csv`;
}

/**
 * Trigger file download in browser.
 *
 * @param blob - File blob to download
 * @param filename - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Export session data to Excel file and trigger download.
 *
 * @param tasks - Array of confirmed tasks
 * @param progress - Array of task progress records
 * @param interruptions - Array of interruptions
 * @param notes - Array of notes
 * @param summary - Analytics summary
 * @param sessionStart - ISO string of session start time
 * @param sessionEnd - ISO string of session end time (null if in progress)
 * @returns ExportResult indicating success or failure with error message
 */
export function exportToExcel(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	interruptions: Interruption[],
	notes: Note[],
	summary: AnalyticsSummary,
	sessionStart: string,
	sessionEnd: string | null
): ExportResult {
	try {
		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		const filename = getExportFilename(sessionStart, 'excel');

		// Write workbook and trigger download
		XLSX.writeFile(workbook, filename);

		return { success: true, filesDownloaded: 1 };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error occurred';
		console.error('Excel export failed:', err);
		return { success: false, error: `Excel export failed: ${message}` };
	}
}

// =============================================================================
// T042-T043: CSV Export Functions
// =============================================================================

/**
 * Interface for CSV export data structure.
 */
interface CSVExportData {
	headers: string[];
	data: string[][];
}

/**
 * Interface for all CSV data prepared for export.
 */
interface AllCSVData {
	tasks: CSVExportData;
	interruptions: CSVExportData;
	notes: CSVExportData;
	summary: CSVExportData;
}

/**
 * Generate CSV content from headers and data rows.
 *
 * @param headers - Array of column headers
 * @param data - 2D array of row data
 * @returns CSV string
 */
export function generateCSV(headers: string[], data: (string | number)[][]): string {
	// Create header row
	const headerRow = headers.map(escapeCSVValue).join(',');

	// Create data rows
	const dataRows = data.map((row) => row.map((cell) => escapeCSVValue(String(cell))).join(','));

	// Combine with newlines
	return [headerRow, ...dataRows].join('\n') + '\n';
}

/**
 * Prepare all session data for CSV export.
 *
 * @param tasks - Array of confirmed tasks
 * @param progress - Array of task progress records
 * @param interruptions - Array of interruptions
 * @param notes - Array of notes
 * @param summary - Analytics summary
 * @param sessionStart - ISO string of session start time
 * @param sessionEnd - ISO string of session end time (null if in progress)
 * @returns Object containing prepared data for all four CSV files
 */
export function prepareCSVExportData(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	interruptions: Interruption[],
	notes: Note[],
	summary: AnalyticsSummary,
	sessionStart: string,
	sessionEnd: string | null
): AllCSVData {
	// Prepare tasks data
	const tasksData = prepareTasksExport(tasks, progress, interruptions, sessionStart);
	const tasksCSV: CSVExportData = {
		headers: TASKS_HEADERS,
		data: tasksData.map(taskRowToArray).map((row) => row.map(String))
	};

	// Prepare interruptions data
	const interruptionsData = prepareInterruptionsExport(interruptions, tasks);
	const interruptionsCSV: CSVExportData = {
		headers: INTERRUPTIONS_HEADERS,
		data: interruptionsData.map(interruptionRowToArray)
	};

	// Prepare notes data
	const notesData = prepareNotesExport(notes, tasks);
	const notesCSV: CSVExportData = {
		headers: NOTES_HEADERS,
		data: notesData.map(noteRowToArray)
	};

	// Prepare summary data
	const summaryData = prepareSummaryExport(summary, sessionStart, sessionEnd);
	const summaryCSV: CSVExportData = {
		headers: SUMMARY_HEADERS,
		data: summaryData.map(summaryRowToArray)
	};

	return {
		tasks: tasksCSV,
		interruptions: interruptionsCSV,
		notes: notesCSV,
		summary: summaryCSV
	};
}

/**
 * Export session data to CSV files and trigger downloads.
 * Downloads four separate CSV files: tasks, interruptions, notes, summary.
 *
 * @param tasks - Array of confirmed tasks
 * @param progress - Array of task progress records
 * @param interruptions - Array of interruptions
 * @param notes - Array of notes
 * @param summary - Analytics summary
 * @param sessionStart - ISO string of session start time
 * @param sessionEnd - ISO string of session end time (null if in progress)
 * @returns ExportResult indicating success or failure with error message
 */
export function exportToCSV(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	interruptions: Interruption[],
	notes: Note[],
	summary: AnalyticsSummary,
	sessionStart: string,
	sessionEnd: string | null
): ExportResult {
	try {
		const csvData = prepareCSVExportData(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		// Download tasks CSV
		const tasksCSV = generateCSV(csvData.tasks.headers, csvData.tasks.data);
		const tasksBlob = new Blob([tasksCSV], { type: 'text/csv;charset=utf-8;' });
		downloadBlob(tasksBlob, getExportFilename(sessionStart, 'csv', 'tasks'));

		// Download interruptions CSV
		const interruptionsCSV = generateCSV(csvData.interruptions.headers, csvData.interruptions.data);
		const interruptionsBlob = new Blob([interruptionsCSV], { type: 'text/csv;charset=utf-8;' });
		downloadBlob(interruptionsBlob, getExportFilename(sessionStart, 'csv', 'interruptions'));

		// Download notes CSV
		const notesCSV = generateCSV(csvData.notes.headers, csvData.notes.data);
		const notesBlob = new Blob([notesCSV], { type: 'text/csv;charset=utf-8;' });
		downloadBlob(notesBlob, getExportFilename(sessionStart, 'csv', 'notes'));

		// Download summary CSV
		const summaryCSV = generateCSV(csvData.summary.headers, csvData.summary.data);
		const summaryBlob = new Blob([summaryCSV], { type: 'text/csv;charset=utf-8;' });
		downloadBlob(summaryBlob, getExportFilename(sessionStart, 'csv', 'summary'));

		return { success: true, filesDownloaded: 4 };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error occurred';
		console.error('CSV export failed:', err);
		return { success: false, error: `CSV export failed: ${message}` };
	}
}
