import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	parseScheduleFile,
	isValidFileType,
	isValidFileSize,
	getSupportedExtensions,
	getAcceptString
} from '$lib/services/parser';
import { MAX_FILE_SIZE, MAX_TASKS } from '$lib/types';

// Helper to create a mock File
function createMockFile(
	name: string,
	content: ArrayBuffer | string,
	type: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
): File {
	const blob = new Blob([content], { type });
	return new File([blob], name, { type });
}

// Helper to create a large file
function createLargeFile(sizeInBytes: number): File {
	const content = new Uint8Array(sizeInBytes);
	return createMockFile('large.xlsx', content.buffer);
}

describe('Parser Service', () => {
	describe('isValidFileType', () => {
		it('accepts .xlsx files', () => {
			const file = createMockFile('schedule.xlsx', '');
			expect(isValidFileType(file)).toBe(true);
		});

		it('accepts .xls files', () => {
			const file = createMockFile(
				'schedule.xls',
				'',
				'application/vnd.ms-excel'
			);
			expect(isValidFileType(file)).toBe(true);
		});

		it('accepts .csv files', () => {
			const file = createMockFile('schedule.csv', '', 'text/csv');
			expect(isValidFileType(file)).toBe(true);
		});

		it('rejects .txt files', () => {
			const file = createMockFile('schedule.txt', '', 'text/plain');
			expect(isValidFileType(file)).toBe(false);
		});

		it('rejects .pdf files', () => {
			const file = createMockFile('schedule.pdf', '', 'application/pdf');
			expect(isValidFileType(file)).toBe(false);
		});
	});

	describe('isValidFileSize', () => {
		it('accepts files under 1MB', () => {
			const file = createMockFile('small.xlsx', new ArrayBuffer(100));
			expect(isValidFileSize(file)).toBe(true);
		});

		it('accepts files exactly at 1MB', () => {
			const file = createLargeFile(MAX_FILE_SIZE);
			expect(isValidFileSize(file)).toBe(true);
		});

		it('rejects files over 1MB', () => {
			const file = createLargeFile(MAX_FILE_SIZE + 1);
			expect(isValidFileSize(file)).toBe(false);
		});
	});

	describe('getSupportedExtensions', () => {
		it('returns all supported extensions', () => {
			const extensions = getSupportedExtensions();
			expect(extensions).toContain('.xlsx');
			expect(extensions).toContain('.xls');
			expect(extensions).toContain('.csv');
		});
	});

	describe('getAcceptString', () => {
		it('returns valid accept attribute string', () => {
			const accept = getAcceptString();
			expect(accept).toContain('.xlsx');
			expect(accept).toContain('.xls');
			expect(accept).toContain('.csv');
		});
	});
});

describe('parseScheduleFile', () => {
	describe('file validation', () => {
		it('rejects files over 1MB', async () => {
			const file = createLargeFile(2 * MAX_FILE_SIZE);
			const result = await parseScheduleFile(file);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].message).toContain('1MB');
			}
		});

		it('rejects invalid file types', async () => {
			const file = createMockFile('schedule.txt', '', 'text/plain');
			const result = await parseScheduleFile(file);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errors[0].message).toContain('file type');
			}
		});
	});

	// Note: More detailed parsing tests require mocking SheetJS
	// or creating actual test fixtures. These will be added in
	// integration tests with real xlsx files.
});
