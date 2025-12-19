/**
 * Export Service Tests
 *
 * Feature: 007-data-export
 * Tasks: T010-T014, T029-T030, T040-T041
 *
 * Tests for data preparation and export functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	prepareTasksExport,
	prepareInterruptionsExport,
	prepareNotesExport,
	prepareSummaryExport,
	getSessionDate
} from '$lib/services/export';
import type {
	ConfirmedTask,
	TaskProgress,
	Interruption,
	Note,
	AnalyticsSummary
} from '$lib/types';

// =============================================================================
// Test Data Factories
// =============================================================================

function createMockTask(overrides: Partial<ConfirmedTask> = {}): ConfirmedTask {
	return {
		taskId: 'task-1',
		name: 'Test Task',
		type: 'flexible',
		plannedStart: new Date('2025-12-19T09:00:00'),
		plannedDurationSec: 1800,
		sortOrder: 0,
		status: 'complete',
		...overrides
	};
}

function createMockProgress(overrides: Partial<TaskProgress> = {}): TaskProgress {
	return {
		taskId: 'task-1',
		plannedDurationSec: 1800,
		actualDurationSec: 1920,
		completedAt: '2025-12-19T09:32:00.000Z',
		status: 'complete',
		...overrides
	};
}

function createMockInterruption(overrides: Partial<Interruption> = {}): Interruption {
	return {
		interruptionId: 'int-1',
		taskId: 'task-1',
		startedAt: '2025-12-19T09:15:00.000Z',
		endedAt: '2025-12-19T09:17:30.000Z',
		durationSec: 150,
		category: 'Phone',
		note: 'Client callback',
		...overrides
	};
}

function createMockNote(overrides: Partial<Note> = {}): Note {
	return {
		noteId: 'note-1',
		content: 'Remember to follow up',
		createdAt: '2025-12-19T09:16:00.000Z',
		updatedAt: null,
		taskId: 'task-1',
		...overrides
	};
}

function createMockSummary(overrides: Partial<AnalyticsSummary> = {}): AnalyticsSummary {
	return {
		totalPlannedSec: 28800,
		totalActualSec: 30000,
		tasksCompleted: 8,
		totalTasks: 10,
		scheduleAdherence: 96.0,
		concentrationScore: 91.5,
		concentrationRating: 'Excellent',
		totalInterruptionCount: 5,
		totalInterruptionSec: 450,
		...overrides
	};
}

// =============================================================================
// T011: prepareTasksExport Tests
// =============================================================================

describe('prepareTasksExport', () => {
	it('should return empty array when no tasks', () => {
		const result = prepareTasksExport([], [], [], '2025-12-19T09:00:00.000Z');
		expect(result).toEqual([]);
	});

	it('should format task with correct fields', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions: Interruption[] = [];

		const result = prepareTasksExport(tasks, progress, interruptions, '2025-12-19T09:00:00.000Z');

		expect(result).toHaveLength(1);
		expect(result[0].taskName).toBe('Test Task');
		expect(result[0].type).toBe('flexible');
		expect(result[0].plannedStart).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		expect(result[0].plannedDuration).toBe('00:30:00');
		expect(result[0].actualDuration).toBe('00:32:00');
		expect(result[0].status).toBe('Complete');
	});

	it('should calculate variance correctly', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress({ actualDurationSec: 2100 })]; // 35 min vs 30 planned

		const result = prepareTasksExport(tasks, progress, [], '2025-12-19T09:00:00.000Z');

		expect(result[0].variance).toBe('+00:05:00'); // 5 min over
	});

	it('should show negative variance when under time', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress({ actualDurationSec: 1500 })]; // 25 min vs 30 planned

		const result = prepareTasksExport(tasks, progress, [], '2025-12-19T09:00:00.000Z');

		expect(result[0].variance).toBe('-00:05:00'); // 5 min under
	});

	it('should aggregate interruption count and time', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions = [
			createMockInterruption({ durationSec: 150 }),
			createMockInterruption({ interruptionId: 'int-2', durationSec: 90 })
		];

		const result = prepareTasksExport(tasks, progress, interruptions, '2025-12-19T09:00:00.000Z');

		expect(result[0].interruptionCount).toBe(2);
		expect(result[0].interruptionTime).toBe('00:04:00'); // 240 sec = 4 min
	});

	it('should map status correctly', () => {
		const tasks = [
			createMockTask({ taskId: 'task-1' }),
			createMockTask({ taskId: 'task-2' }),
			createMockTask({ taskId: 'task-3' }),
			createMockTask({ taskId: 'task-4' })
		];
		const progress = [
			createMockProgress({ taskId: 'task-1', status: 'complete' }),
			createMockProgress({ taskId: 'task-2', status: 'active' }),
			createMockProgress({ taskId: 'task-3', status: 'pending' }),
			createMockProgress({ taskId: 'task-4', status: 'missed' })
		];

		const result = prepareTasksExport(tasks, progress, [], '2025-12-19T09:00:00.000Z');

		expect(result[0].status).toBe('Complete');
		expect(result[1].status).toBe('In Progress');
		expect(result[2].status).toBe('Pending');
		expect(result[3].status).toBe('Missed');
	});
});

// =============================================================================
// T012: prepareInterruptionsExport Tests
// =============================================================================

describe('prepareInterruptionsExport', () => {
	it('should return empty array when no interruptions', () => {
		const result = prepareInterruptionsExport([], []);
		expect(result).toEqual([]);
	});

	it('should format interruption with correct fields', () => {
		const tasks = [createMockTask()];
		const interruptions = [createMockInterruption()];

		const result = prepareInterruptionsExport(interruptions, tasks);

		expect(result).toHaveLength(1);
		expect(result[0].task).toBe('Test Task');
		expect(result[0].startTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		expect(result[0].endTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		expect(result[0].duration).toBe('00:02:30'); // 150 sec
		expect(result[0].category).toBe('Phone');
		expect(result[0].note).toBe('Client callback');
	});

	it('should handle null category and note', () => {
		const tasks = [createMockTask()];
		const interruptions = [createMockInterruption({ category: null, note: null })];

		const result = prepareInterruptionsExport(interruptions, tasks);

		expect(result[0].category).toBe('');
		expect(result[0].note).toBe('');
	});

	it('should handle in-progress interruption', () => {
		const tasks = [createMockTask()];
		const interruptions = [createMockInterruption({ endedAt: null, durationSec: 0 })];

		const result = prepareInterruptionsExport(interruptions, tasks);

		expect(result[0].endTime).toBe('In Progress');
	});

	it('should lookup task name by taskId', () => {
		const tasks = [
			createMockTask({ taskId: 'task-1', name: 'First Task' }),
			createMockTask({ taskId: 'task-2', name: 'Second Task' })
		];
		const interruptions = [createMockInterruption({ taskId: 'task-2' })];

		const result = prepareInterruptionsExport(interruptions, tasks);

		expect(result[0].task).toBe('Second Task');
	});
});

// =============================================================================
// T013: prepareNotesExport Tests
// =============================================================================

describe('prepareNotesExport', () => {
	it('should return empty array when no notes', () => {
		const result = prepareNotesExport([], []);
		expect(result).toEqual([]);
	});

	it('should format note with correct fields', () => {
		const tasks = [createMockTask()];
		const notes = [createMockNote()];

		const result = prepareNotesExport(notes, tasks);

		expect(result).toHaveLength(1);
		expect(result[0].time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		expect(result[0].task).toBe('Test Task');
		expect(result[0].content).toBe('Remember to follow up');
	});

	it('should handle note without task association', () => {
		const tasks = [createMockTask()];
		const notes = [createMockNote({ taskId: null })];

		const result = prepareNotesExport(notes, tasks);

		expect(result[0].task).toBe('');
	});

	it('should handle note with unknown taskId', () => {
		const tasks = [createMockTask({ taskId: 'task-1' })];
		const notes = [createMockNote({ taskId: 'unknown-task' })];

		const result = prepareNotesExport(notes, tasks);

		expect(result[0].task).toBe('');
	});
});

// =============================================================================
// T014: prepareSummaryExport Tests
// =============================================================================

describe('prepareSummaryExport', () => {
	it('should return all summary metrics', () => {
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const result = prepareSummaryExport(summary, sessionStart, sessionEnd);

		expect(result).toHaveLength(10);
		expect(result.map((r) => r.metric)).toEqual([
			'Session Date',
			'Session Start',
			'Session End',
			'Total Planned Time',
			'Total Actual Time',
			'Total Interruption Time',
			'Interruption Count',
			'Concentration Score',
			'Schedule Adherence',
			'Tasks Completed'
		]);
	});

	it('should format session date correctly', () => {
		const summary = createMockSummary();
		const result = prepareSummaryExport(summary, '2025-12-19T09:00:00.000Z', '2025-12-19T17:30:00.000Z');

		expect(result[0].value).toBe('2025-12-19');
	});

	it('should format times in HH:MM:SS', () => {
		const summary = createMockSummary({
			totalPlannedSec: 28800, // 8 hours
			totalActualSec: 30600, // 8.5 hours
			totalInterruptionSec: 1800 // 30 min
		});
		const result = prepareSummaryExport(summary, '2025-12-19T09:00:00.000Z', '2025-12-19T17:30:00.000Z');

		expect(result[3].value).toBe('08:00:00'); // Total Planned
		expect(result[4].value).toBe('08:30:00'); // Total Actual
		expect(result[5].value).toBe('00:30:00'); // Interruption Time
	});

	it('should format percentages with one decimal', () => {
		const summary = createMockSummary({
			concentrationScore: 91.567,
			scheduleAdherence: 94.123
		});
		const result = prepareSummaryExport(summary, '2025-12-19T09:00:00.000Z', '2025-12-19T17:30:00.000Z');

		expect(result[7].value).toBe('91.6%');
		expect(result[8].value).toBe('94.1%');
	});

	it('should format tasks completed as X of Y', () => {
		const summary = createMockSummary({
			tasksCompleted: 7,
			totalTasks: 10
		});
		const result = prepareSummaryExport(summary, '2025-12-19T09:00:00.000Z', '2025-12-19T17:30:00.000Z');

		expect(result[9].value).toBe('7 of 10');
	});

	it('should handle null session end (in progress)', () => {
		const summary = createMockSummary();
		const result = prepareSummaryExport(summary, '2025-12-19T09:00:00.000Z', null);

		// Should use current time - just verify it's a valid time format
		expect(result[2].value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
	});
});

// =============================================================================
// getSessionDate Tests
// =============================================================================

describe('getSessionDate', () => {
	it('should extract date from session start', () => {
		const result = getSessionDate('2025-12-19T09:00:00.000Z');
		expect(result).toBe('2025-12-19');
	});

	it('should handle different date formats', () => {
		const result = getSessionDate('2025-01-05T15:30:00.000Z');
		expect(result).toBe('2025-01-05');
	});
});

// =============================================================================
// T029-T030: Excel Export Tests
// =============================================================================

describe('generateExcelWorkbook', () => {
	// Import dynamically to avoid issues with XLSX mock
	let generateExcelWorkbook: typeof import('$lib/services/export').generateExcelWorkbook;

	beforeEach(async () => {
		const exportModule = await import('$lib/services/export');
		generateExcelWorkbook = exportModule.generateExcelWorkbook;
	});

	it('should create a workbook with four sheets', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions = [createMockInterruption()];
		const notes = [createMockNote()];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		expect(workbook.SheetNames).toHaveLength(4);
		expect(workbook.SheetNames).toContain('Tasks');
		expect(workbook.SheetNames).toContain('Interruptions');
		expect(workbook.SheetNames).toContain('Notes');
		expect(workbook.SheetNames).toContain('Summary');
	});

	it('should include task data in Tasks sheet', () => {
		const tasks = [createMockTask({ name: 'Email Review' })];
		const progress = [createMockProgress()];
		const interruptions: Interruption[] = [];
		const notes: Note[] = [];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		// Verify Tasks sheet exists and has data
		expect(workbook.Sheets['Tasks']).toBeDefined();
	});

	it('should include interruption data in Interruptions sheet', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions = [createMockInterruption({ category: 'Phone', note: 'Urgent call' })];
		const notes: Note[] = [];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		// Verify Interruptions sheet exists
		expect(workbook.Sheets['Interruptions']).toBeDefined();
	});

	it('should include note data in Notes sheet', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions: Interruption[] = [];
		const notes = [createMockNote({ content: 'Important meeting notes' })];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		// Verify Notes sheet exists
		expect(workbook.Sheets['Notes']).toBeDefined();
	});

	it('should include summary metrics in Summary sheet', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions: Interruption[] = [];
		const notes: Note[] = [];
		const summary = createMockSummary({ tasksCompleted: 8, totalTasks: 10 });
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		// Verify Summary sheet exists
		expect(workbook.Sheets['Summary']).toBeDefined();
	});

	it('should handle empty interruptions and notes', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions: Interruption[] = [];
		const notes: Note[] = [];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const workbook = generateExcelWorkbook(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		// Should still create all sheets even if empty
		expect(workbook.SheetNames).toHaveLength(4);
	});
});

describe('getExportFilename', () => {
	let getExportFilename: typeof import('$lib/services/export').getExportFilename;

	beforeEach(async () => {
		const exportModule = await import('$lib/services/export');
		getExportFilename = exportModule.getExportFilename;
	});

	it('should generate Excel filename with date', () => {
		const result = getExportFilename('2025-12-19T09:00:00.000Z', 'excel');
		expect(result).toBe('2025-12-19_productivity.xlsx');
	});

	it('should generate CSV filename with date and type', () => {
		const result = getExportFilename('2025-12-19T09:00:00.000Z', 'csv', 'tasks');
		expect(result).toBe('2025-12-19_tasks.csv');
	});
});

// =============================================================================
// T040-T041: CSV Export Tests
// =============================================================================

describe('generateCSV', () => {
	let generateCSV: typeof import('$lib/services/export').generateCSV;

	beforeEach(async () => {
		const exportModule = await import('$lib/services/export');
		generateCSV = exportModule.generateCSV;
	});

	it('should generate CSV with headers only when no data', () => {
		const headers = ['Name', 'Value'];
		const data: string[][] = [];

		const result = generateCSV(headers, data);

		expect(result).toBe('Name,Value\n');
	});

	it('should generate CSV with headers and data rows', () => {
		const headers = ['Name', 'Status'];
		const data = [
			['Task 1', 'Complete'],
			['Task 2', 'Pending']
		];

		const result = generateCSV(headers, data);

		expect(result).toBe('Name,Status\nTask 1,Complete\nTask 2,Pending\n');
	});

	it('should escape values with commas', () => {
		const headers = ['Name', 'Note'];
		const data = [['Task 1', 'Hello, World']];

		const result = generateCSV(headers, data);

		expect(result).toBe('Name,Note\nTask 1,"Hello, World"\n');
	});

	it('should escape values with quotes', () => {
		const headers = ['Name', 'Note'];
		const data = [['Task 1', 'Say "hi"']];

		const result = generateCSV(headers, data);

		expect(result).toBe('Name,Note\nTask 1,"Say ""hi"""\n');
	});

	it('should escape values with newlines', () => {
		const headers = ['Name', 'Note'];
		const data = [['Task 1', 'Line1\nLine2']];

		const result = generateCSV(headers, data);

		expect(result).toBe('Name,Note\nTask 1,"Line1\nLine2"\n');
	});
});

describe('prepareCSVExportData', () => {
	let prepareCSVExportData: typeof import('$lib/services/export').prepareCSVExportData;

	beforeEach(async () => {
		const exportModule = await import('$lib/services/export');
		prepareCSVExportData = exportModule.prepareCSVExportData;
	});

	it('should prepare tasks data for CSV', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions: Interruption[] = [];
		const notes: Note[] = [];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const result = prepareCSVExportData(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		expect(result.tasks).toBeDefined();
		expect(result.tasks.headers).toHaveLength(10);
		expect(result.tasks.data).toHaveLength(1);
	});

	it('should prepare all four data types', () => {
		const tasks = [createMockTask()];
		const progress = [createMockProgress()];
		const interruptions = [createMockInterruption()];
		const notes = [createMockNote()];
		const summary = createMockSummary();
		const sessionStart = '2025-12-19T09:00:00.000Z';
		const sessionEnd = '2025-12-19T17:30:00.000Z';

		const result = prepareCSVExportData(
			tasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);

		expect(result.tasks).toBeDefined();
		expect(result.interruptions).toBeDefined();
		expect(result.notes).toBeDefined();
		expect(result.summary).toBeDefined();
	});
});
