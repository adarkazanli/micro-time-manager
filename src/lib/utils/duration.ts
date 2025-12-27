/**
 * Duration Parser Utility
 *
 * Parses duration strings in multiple formats:
 * - Seconds: "30s" → 30
 * - Minutes: "30m" → 1800
 * - Hours: "2h" → 7200
 * - Combined h+m: "1h 30m" → 5400
 * - Combined m+s: "8m 58s" → 538
 * - Combined h+m+s: "1h 30m 45s" → 5445
 * - MM:SS: "30:00" → 1800
 * - HH:MM:SS: "01:30:00" → 5400
 */

// Pattern for seconds: "30s"
const SECONDS_PATTERN = /^(\d+)s$/i;

// Pattern for minutes: "30m"
const MINUTES_PATTERN = /^(\d+)m$/i;

// Pattern for hours: "2h"
const HOURS_PATTERN = /^(\d+)h$/i;

// Pattern for combined hours and minutes: "1h 30m" or "1h30m"
const COMBINED_HM_PATTERN = /^(\d+)h\s*(\d+)m$/i;

// Pattern for combined minutes and seconds: "8m 58s" or "8m58s"
const COMBINED_MS_PATTERN = /^(\d+)m\s*(\d+)s$/i;

// Pattern for combined hours, minutes, seconds: "1h 30m 45s"
const COMBINED_HMS_PATTERN = /^(\d+)h\s*(\d+)m\s*(\d+)s$/i;

// Pattern for MM:SS format: "30:00"
const MMSS_PATTERN = /^(\d{1,2}):(\d{2})$/;

// Pattern for HH:MM:SS format: "01:30:00"
const HHMMSS_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})$/;

/**
 * Parse duration string to seconds
 *
 * @param input - Duration string in various formats
 * @returns Number of seconds or null if invalid
 */
export function parseDuration(input: string): number | null {
	if (!input || typeof input !== 'string') {
		return null;
	}

	// Trim and normalize whitespace
	const normalized = input.trim().replace(/\s+/g, ' ');

	if (!normalized) {
		return null;
	}

	// Try each pattern
	let match: RegExpMatchArray | null;

	// Seconds: "30s"
	match = normalized.match(SECONDS_PATTERN);
	if (match) {
		return parseInt(match[1], 10);
	}

	// Minutes: "30m"
	match = normalized.match(MINUTES_PATTERN);
	if (match) {
		return parseInt(match[1], 10) * 60;
	}

	// Hours: "2h"
	match = normalized.match(HOURS_PATTERN);
	if (match) {
		return parseInt(match[1], 10) * 3600;
	}

	// Combined hours, minutes, seconds: "1h 30m 45s"
	match = normalized.match(COMBINED_HMS_PATTERN);
	if (match) {
		const hours = parseInt(match[1], 10);
		const minutes = parseInt(match[2], 10);
		const seconds = parseInt(match[3], 10);
		return hours * 3600 + minutes * 60 + seconds;
	}

	// Combined hours and minutes: "1h 30m" or "1h30m"
	match = normalized.match(COMBINED_HM_PATTERN);
	if (match) {
		const hours = parseInt(match[1], 10);
		const minutes = parseInt(match[2], 10);
		return hours * 3600 + minutes * 60;
	}

	// Combined minutes and seconds: "8m 58s" or "8m58s"
	match = normalized.match(COMBINED_MS_PATTERN);
	if (match) {
		const minutes = parseInt(match[1], 10);
		const seconds = parseInt(match[2], 10);
		return minutes * 60 + seconds;
	}

	// HH:MM:SS: "01:30:00" (check before MM:SS to avoid false matches)
	match = normalized.match(HHMMSS_PATTERN);
	if (match) {
		const hours = parseInt(match[1], 10);
		const minutes = parseInt(match[2], 10);
		const seconds = parseInt(match[3], 10);
		return hours * 3600 + minutes * 60 + seconds;
	}

	// MM:SS: "30:00"
	match = normalized.match(MMSS_PATTERN);
	if (match) {
		const minutes = parseInt(match[1], 10);
		const seconds = parseInt(match[2], 10);
		return minutes * 60 + seconds;
	}

	return null;
}

/**
 * Format seconds as human-readable duration
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1h 30m")
 */
export function formatDuration(seconds: number): string {
	if (seconds === 0) {
		return '0s';
	}

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	const parts: string[] = [];

	if (hours > 0) {
		parts.push(`${hours}h`);
	}

	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}

	if (secs > 0) {
		parts.push(`${secs}s`);
	}

	return parts.join(' ');
}
