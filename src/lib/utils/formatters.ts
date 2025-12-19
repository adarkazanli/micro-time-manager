/**
 * Formatting utilities for data export
 *
 * Feature: 007-data-export
 *
 * Provides functions for formatting time values and escaping CSV content.
 */

/**
 * Format duration in seconds to HH:MM:SS string.
 *
 * @param seconds - Duration in seconds (can be 0 or positive)
 * @returns Formatted string in HH:MM:SS format
 *
 * @example
 * formatDurationHHMMSS(3661) // "01:01:01"
 * formatDurationHHMMSS(0) // "00:00:00"
 * formatDurationHHMMSS(90) // "00:01:30"
 */
export function formatDurationHHMMSS(seconds: number): string {
	const abs = Math.abs(Math.floor(seconds));
	const h = Math.floor(abs / 3600);
	const m = Math.floor((abs % 3600) / 60);
	const s = abs % 60;
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format variance in seconds to +/-HH:MM:SS string.
 * Positive values indicate over time, negative indicate under time.
 *
 * @param seconds - Variance in seconds (can be negative, zero, or positive)
 * @returns Formatted string with +/- prefix in HH:MM:SS format
 *
 * @example
 * formatVarianceHHMMSS(120) // "+00:02:00"
 * formatVarianceHHMMSS(-300) // "-00:05:00"
 * formatVarianceHHMMSS(0) // "+00:00:00"
 */
export function formatVarianceHHMMSS(seconds: number): string {
	const prefix = seconds >= 0 ? '+' : '-';
	return prefix + formatDurationHHMMSS(Math.abs(seconds));
}

/**
 * Format ISO 8601 datetime string or Date to HH:MM:SS time string.
 *
 * @param isoOrDate - ISO 8601 datetime string or Date object
 * @returns Formatted time string in HH:MM:SS format
 *
 * @example
 * formatTimeHHMMSS("2025-12-19T09:30:45.000Z") // "09:30:45" (local time)
 * formatTimeHHMMSS(new Date()) // Current time in HH:MM:SS
 */
export function formatTimeHHMMSS(isoOrDate: string | Date): string {
	const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
	const h = date.getHours();
	const m = date.getMinutes();
	const s = date.getSeconds();
	return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Escape a value for CSV output per RFC 4180.
 * If the value contains commas, quotes, or newlines, it is wrapped in quotes
 * and any internal quotes are doubled.
 *
 * @param value - The string value to escape
 * @returns CSV-safe escaped string
 *
 * @example
 * escapeCSVValue("Hello") // "Hello"
 * escapeCSVValue("Hello, World") // '"Hello, World"'
 * escapeCSVValue('Say "hi"') // '"Say ""hi"""'
 * escapeCSVValue("Line1\nLine2") // '"Line1\nLine2"'
 */
export function escapeCSVValue(value: string): string {
	// RFC 4180: If value contains comma, quote, or newline, wrap in quotes
	// Double any quotes inside the value
	if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Format a date to YYYY-MM-DD string.
 *
 * @param isoOrDate - ISO 8601 datetime string or Date object
 * @returns Formatted date string in YYYY-MM-DD format
 *
 * @example
 * formatDateYYYYMMDD("2025-12-19T09:30:45.000Z") // "2025-12-19"
 */
export function formatDateYYYYMMDD(isoOrDate: string | Date): string {
	const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
	const y = date.getFullYear();
	const m = date.getMonth() + 1;
	const d = date.getDate();
	return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}
