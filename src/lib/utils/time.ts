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

/**
 * Format milliseconds as timer display string
 *
 * Feature: 002-day-tracking
 * Task: T020 - Add formatTime utility function for timer display
 *
 * @param ms - Milliseconds (can be negative for overtime)
 * @returns Formatted string "MM:SS" or "H:MM:SS" (with "-" prefix if negative)
 *
 * @example
 * formatTimerMs(5000)     // "00:05"
 * formatTimerMs(90000)    // "01:30"
 * formatTimerMs(3661000)  // "1:01:01"
 * formatTimerMs(-60000)   // "-01:00"
 */
export function formatTimerMs(ms: number): string {
	const isNegative = ms < 0;
	const absMs = Math.abs(ms);

	const totalSeconds = Math.floor(absMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const prefix = isNegative ? '-' : '';

	if (hours > 0) {
		return `${prefix}${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	return `${prefix}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format lag seconds as human-readable string
 *
 * Feature: 002-day-tracking
 * Task: T028 - Add calculateLag utility function
 *
 * @param lagSec - Lag in seconds (negative = ahead, positive = behind)
 * @returns Formatted string like "On schedule", "5 min ahead", "1 hr 10 min behind"
 *
 * @example
 * formatLag(0)      // "On schedule"
 * formatLag(-300)   // "5 min ahead"
 * formatLag(600)    // "10 min behind"
 * formatLag(-3900)  // "1 hr 5 min ahead"
 */
export function formatLag(lagSec: number): string {
	if (lagSec === 0) return 'On schedule';

	const absLag = Math.abs(lagSec);
	const hours = Math.floor(absLag / 3600);
	const minutes = Math.floor((absLag % 3600) / 60);
	const direction = lagSec < 0 ? 'ahead' : 'behind';

	if (hours > 0) {
		return `${hours} hr ${minutes} min ${direction}`;
	}
	return `${minutes} min ${direction}`;
}

/**
 * Format ISO timestamp as human-readable relative time
 *
 * Feature: 005-note-capture
 * Task: T023 - Add formatRelativeTime utility
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Human-readable relative time string
 *
 * @example
 * formatRelativeTime('2025-12-19T09:00:00Z')  // "Just now", "5 min ago", "Today 9:00 AM", etc.
 */
export function formatRelativeTime(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);

	if (diffMin < 1) return 'Just now';
	if (diffMin < 60) return `${diffMin} min ago`;

	const isToday = date.toDateString() === now.toDateString();
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	const isYesterday = date.toDateString() === yesterday.toDateString();

	const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	if (isToday) return `Today ${timeStr}`;
	if (isYesterday) return `Yesterday ${timeStr}`;

	return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}
