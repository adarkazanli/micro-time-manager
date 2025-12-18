import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTemplateWorkbook, downloadTemplate } from '$lib/services/template';
import { REQUIRED_COLUMNS } from '$lib/types';
import * as XLSX from 'xlsx';

describe('template service', () => {
	describe('generateTemplateWorkbook', () => {
		it('creates a workbook with Schedule sheet', () => {
			const workbook = generateTemplateWorkbook();

			expect(workbook.SheetNames).toContain('Schedule');
		});

		it('includes all required column headers', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];

			// Read the first row to get headers
			const range = XLSX.utils.decode_range(sheet['!ref']!);
			const headers: string[] = [];
			for (let col = range.s.c; col <= range.e.c; col++) {
				const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
				const cell = sheet[cellAddress];
				if (cell) {
					headers.push(cell.v as string);
				}
			}

			REQUIRED_COLUMNS.forEach((col) => {
				expect(headers).toContain(col);
			});
		});

		it('includes example data rows', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];

			// Convert to JSON to count rows
			const data = XLSX.utils.sheet_to_json(sheet);

			// Should have at least 3 example rows
			expect(data.length).toBeGreaterThanOrEqual(3);
		});

		it('example rows have valid task names', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];
			const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

			data.forEach((row) => {
				expect(row['Task Name']).toBeDefined();
				expect(typeof row['Task Name']).toBe('string');
				expect((row['Task Name'] as string).length).toBeGreaterThan(0);
			});
		});

		it('example rows have valid start times', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];
			const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

			data.forEach((row) => {
				expect(row['Start Time']).toBeDefined();
				// Should be in time format like "09:00" or "9:00 AM"
				const timeValue = String(row['Start Time']);
				expect(timeValue).toMatch(/\d{1,2}:\d{2}(\s*(AM|PM))?/i);
			});
		});

		it('example rows have valid durations', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];
			const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

			data.forEach((row) => {
				expect(row['Duration']).toBeDefined();
				// Should be in duration format like "30m", "1h", "1h 30m"
				const durationValue = String(row['Duration']);
				expect(durationValue).toMatch(/\d+\s*(h|m|min|hour|minute)/i);
			});
		});

		it('example rows have valid types', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];
			const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

			data.forEach((row) => {
				expect(row['Type']).toBeDefined();
				expect(['fixed', 'flexible']).toContain(
					String(row['Type']).toLowerCase()
				);
			});
		});

		it('includes both fixed and flexible task examples', () => {
			const workbook = generateTemplateWorkbook();
			const sheet = workbook.Sheets['Schedule'];
			const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

			const types = data.map((row) => String(row['Type']).toLowerCase());
			expect(types).toContain('fixed');
			expect(types).toContain('flexible');
		});
	});

	describe('downloadTemplate', () => {
		let createElementSpy: ReturnType<typeof vi.spyOn>;
		let appendChildSpy: ReturnType<typeof vi.spyOn>;
		let removeChildSpy: ReturnType<typeof vi.spyOn>;
		let clickSpy: ReturnType<typeof vi.fn>;
		let mockLink: HTMLAnchorElement;

		beforeEach(() => {
			// Mock URL.createObjectURL and revokeObjectURL
			vi.stubGlobal('URL', {
				createObjectURL: vi.fn(() => 'blob:mock-url'),
				revokeObjectURL: vi.fn()
			});

			// Mock anchor element
			clickSpy = vi.fn();
			mockLink = {
				href: '',
				download: '',
				click: clickSpy,
				style: {}
			} as unknown as HTMLAnchorElement;

			createElementSpy = vi
				.spyOn(document, 'createElement')
				.mockReturnValue(mockLink);
			appendChildSpy = vi
				.spyOn(document.body, 'appendChild')
				.mockReturnValue(mockLink);
			removeChildSpy = vi
				.spyOn(document.body, 'removeChild')
				.mockReturnValue(mockLink);
		});

		it('creates a download link', () => {
			downloadTemplate();

			expect(createElementSpy).toHaveBeenCalledWith('a');
		});

		it('sets the filename with .xlsx extension', () => {
			downloadTemplate();

			expect(mockLink.download).toBe('schedule-template.xlsx');
		});

		it('triggers click to start download', () => {
			downloadTemplate();

			expect(clickSpy).toHaveBeenCalled();
		});

		it('accepts custom filename', () => {
			downloadTemplate('my-template.xlsx');

			expect(mockLink.download).toBe('my-template.xlsx');
		});

		it('cleans up after download', () => {
			downloadTemplate();

			expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
		});
	});
});
