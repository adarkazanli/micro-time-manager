import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { parseTime, formatTime } from '$lib/utils/time';

describe('parseTime', () => {
	beforeEach(() => {
		// Mock Date to a fixed point for consistent testing
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-17T12:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('24-hour format', () => {
		it('parses "09:00" correctly', () => {
			const result = parseTime('09:00');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
			expect(result!.getMinutes()).toBe(0);
		});

		it('parses "14:30" correctly', () => {
			const result = parseTime('14:30');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(14);
			expect(result!.getMinutes()).toBe(30);
		});

		it('parses "00:00" (midnight) correctly', () => {
			const result = parseTime('00:00');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(0);
			expect(result!.getMinutes()).toBe(0);
		});

		it('parses "23:59" correctly', () => {
			const result = parseTime('23:59');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(23);
			expect(result!.getMinutes()).toBe(59);
		});

		it('parses "09:00:00" with seconds correctly', () => {
			const result = parseTime('09:00:00');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
			expect(result!.getMinutes()).toBe(0);
			expect(result!.getSeconds()).toBe(0);
		});

		it('parses "9:00" (single digit hour) correctly', () => {
			const result = parseTime('9:00');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
		});
	});

	describe('12-hour format', () => {
		it('parses "9:00 AM" correctly', () => {
			const result = parseTime('9:00 AM');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
			expect(result!.getMinutes()).toBe(0);
		});

		it('parses "2:30 PM" correctly', () => {
			const result = parseTime('2:30 PM');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(14);
			expect(result!.getMinutes()).toBe(30);
		});

		it('parses "12:00 PM" (noon) correctly', () => {
			const result = parseTime('12:00 PM');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(12);
		});

		it('parses "12:00 AM" (midnight) correctly', () => {
			const result = parseTime('12:00 AM');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(0);
		});

		it('parses lowercase "am/pm" correctly', () => {
			const result = parseTime('9:00 am');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
		});

		it('parses without space before AM/PM', () => {
			const result = parseTime('9:00AM');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
		});
	});

	describe('invalid inputs', () => {
		it('returns null for "25:00" (invalid hour)', () => {
			expect(parseTime('25:00')).toBeNull();
		});

		it('returns null for "12:60" (invalid minutes)', () => {
			expect(parseTime('12:60')).toBeNull();
		});

		it('returns null for empty string', () => {
			expect(parseTime('')).toBeNull();
		});

		it('returns null for "invalid"', () => {
			expect(parseTime('invalid')).toBeNull();
		});

		it('returns null for "13:00 PM" (invalid 12-hour)', () => {
			expect(parseTime('13:00 PM')).toBeNull();
		});
	});

	describe('whitespace handling', () => {
		it('trims leading/trailing whitespace', () => {
			const result = parseTime('  09:00  ');
			expect(result).not.toBeNull();
			expect(result!.getHours()).toBe(9);
		});
	});

	describe('date component', () => {
		it('uses current day for the date', () => {
			const result = parseTime('09:00');
			expect(result).not.toBeNull();
			expect(result!.getFullYear()).toBe(2025);
			expect(result!.getMonth()).toBe(11); // December (0-indexed)
			expect(result!.getDate()).toBe(17);
		});
	});
});

describe('formatTime', () => {
	it('formats to 24-hour by default', () => {
		const date = new Date('2025-12-17T09:30:00');
		expect(formatTime(date)).toBe('09:30');
	});

	it('formats to 24-hour explicitly', () => {
		const date = new Date('2025-12-17T14:30:00');
		expect(formatTime(date, '24h')).toBe('14:30');
	});

	it('formats to 12-hour with AM', () => {
		const date = new Date('2025-12-17T09:30:00');
		expect(formatTime(date, '12h')).toBe('9:30 AM');
	});

	it('formats to 12-hour with PM', () => {
		const date = new Date('2025-12-17T14:30:00');
		expect(formatTime(date, '12h')).toBe('2:30 PM');
	});

	it('formats noon correctly in 12-hour', () => {
		const date = new Date('2025-12-17T12:00:00');
		expect(formatTime(date, '12h')).toBe('12:00 PM');
	});

	it('formats midnight correctly in 12-hour', () => {
		const date = new Date('2025-12-17T00:00:00');
		expect(formatTime(date, '12h')).toBe('12:00 AM');
	});

	it('pads single-digit minutes with zero', () => {
		const date = new Date('2025-12-17T09:05:00');
		expect(formatTime(date)).toBe('09:05');
	});
});
