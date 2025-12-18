/**
 * Template Generator Service
 *
 * Generates an Excel template file for schedule imports.
 * Users can download this to understand the expected format.
 */

import * as XLSX from 'xlsx';
import { REQUIRED_COLUMNS } from '$lib/types';

/**
 * Example schedule data for the template
 */
const EXAMPLE_DATA = [
	{
		'Task Name': 'Morning Standup',
		'Start Time': '09:00',
		Duration: '15m',
		Type: 'fixed'
	},
	{
		'Task Name': 'Deep Work Session',
		'Start Time': '09:15',
		Duration: '2h',
		Type: 'flexible'
	},
	{
		'Task Name': 'Team Meeting',
		'Start Time': '11:30',
		Duration: '1h',
		Type: 'fixed'
	},
	{
		'Task Name': 'Lunch Break',
		'Start Time': '12:30',
		Duration: '45m',
		Type: 'flexible'
	},
	{
		'Task Name': 'Code Review',
		'Start Time': '13:15',
		Duration: '1h 30m',
		Type: 'flexible'
	},
	{
		'Task Name': 'Sprint Planning',
		'Start Time': '15:00',
		Duration: '1h',
		Type: 'fixed'
	}
];

/**
 * Generate a template workbook with example data
 */
export function generateTemplateWorkbook(): XLSX.WorkBook {
	// Create worksheet from example data
	const worksheet = XLSX.utils.json_to_sheet(EXAMPLE_DATA, {
		header: [...REQUIRED_COLUMNS]
	});

	// Set column widths for better readability
	worksheet['!cols'] = [
		{ wch: 25 }, // Task Name
		{ wch: 12 }, // Start Time
		{ wch: 12 }, // Duration
		{ wch: 10 } // Type
	];

	// Create workbook and add worksheet
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');

	return workbook;
}

/**
 * Download the template as an Excel file
 * @param filename - Optional custom filename (default: schedule-template.xlsx)
 */
export function downloadTemplate(filename = 'schedule-template.xlsx'): void {
	const workbook = generateTemplateWorkbook();

	// Generate binary data
	const wbout = XLSX.write(workbook, {
		bookType: 'xlsx',
		type: 'array'
	});

	// Create blob and download
	const blob = new Blob([wbout], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	});

	const url = URL.createObjectURL(blob);

	// Create download link
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';

	// Trigger download
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
