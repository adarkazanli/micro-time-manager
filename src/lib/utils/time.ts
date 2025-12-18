/**
 * Time Parser Utility
 *
 * Parses time strings in 12-hour and 24-hour formats:
 * - 24-hour: "09:00", "14:30", "09:00:00"
 * - 12-hour: "9:00 AM", "2:30 PM"
 *
 * All parsed times are for the current day.
 */

// Pattern for 24-hour format: "09:00" or "09:00:00"
const TIME_24H_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

// Pattern for 12-hour format: "9:00 AM" or "9:00AM"
const TIME_12H_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/**
 * Parse time string to Date for today
 *
 * @param input - Time string in 24-hour or 12-hour format
 * @returns Date object for today at specified time, or null if invalid
 */
export function parseTime(input: string): Date | null {
	if (!input || typeof input !== 'string') {
		return null;
	}

	const normalized = input.trim();

	if (!normalized) {
		return null;
	}

	let hours: number;
	let minutes: number;
	let seconds = 0;

	// Try 12-hour format first (has AM/PM which is distinctive)
	const match12h = normalized.match(TIME_12H_PATTERN);
	if (match12h) {
		hours = parseInt(match12h[1], 10);
		minutes = parseInt(match12h[2], 10);
		const period = match12h[3].toUpperCase();

		// Validate 12-hour format (1-12)
		if (hours < 1 || hours > 12) {
			return null;
		}

		// Convert to 24-hour
		if (period === 'AM') {
			hours = hours === 12 ? 0 : hours;
		} else {
			// PM
			hours = hours === 12 ? 12 : hours + 12;
		}
	} else {
		// Try 24-hour format
		const match24h = normalized.match(TIME_24H_PATTERN);
		if (!match24h) {
			return null;
		}

		hours = parseInt(match24h[1], 10);
		minutes = parseInt(match24h[2], 10);
		seconds = match24h[3] ? parseInt(match24h[3], 10) : 0;
	}

	// Validate ranges
	if (hours < 0 || hours > 23) {
		return null;
	}
	if (minutes < 0 || minutes > 59) {
		return null;
	}
	if (seconds < 0 || seconds > 59) {
		return null;
	}

	// Create Date for today at the specified time
	const today = new Date();
	today.setHours(hours, minutes, seconds, 0);

	return today;
}

/**
 * Format Date as time string
 *
 * @param date - Date object
 * @param format - '12h' or '24h' (default: '24h')
 * @returns Formatted time string
 */
export function formatTime(date: Date, format: '12h' | '24h' = '24h'): string {
	const hours = date.getHours();
	const minutes = date.getMinutes();

	if (format === '24h') {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
	}

	// 12-hour format
	let displayHours = hours % 12;
	if (displayHours === 0) {
		displayHours = 12;
	}

	const period = hours < 12 ? 'AM' : 'PM';

	return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
