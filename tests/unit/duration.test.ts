import { describe, it, expect } from 'vitest';
import { parseDuration, formatDuration } from '$lib/utils/duration';

describe('parseDuration', () => {
	describe('seconds format', () => {
		it('parses "30s" as 30 seconds', () => {
			expect(parseDuration('30s')).toBe(30);
		});

		it('parses "0s" as 0 seconds', () => {
			expect(parseDuration('0s')).toBe(0);
		});
	});

	describe('minutes format', () => {
		it('parses "30m" as 1800 seconds', () => {
			expect(parseDuration('30m')).toBe(1800);
		});

		it('parses "45m" as 2700 seconds', () => {
			expect(parseDuration('45m')).toBe(2700);
		});

		it('parses "1m" as 60 seconds', () => {
			expect(parseDuration('1m')).toBe(60);
		});
	});

	describe('hours format', () => {
		it('parses "1h" as 3600 seconds', () => {
			expect(parseDuration('1h')).toBe(3600);
		});

		it('parses "2h" as 7200 seconds', () => {
			expect(parseDuration('2h')).toBe(7200);
		});
	});

	describe('combined format', () => {
		it('parses "1h 30m" as 5400 seconds', () => {
			expect(parseDuration('1h 30m')).toBe(5400);
		});

		it('parses "2h 15m" as 8100 seconds', () => {
			expect(parseDuration('2h 15m')).toBe(8100);
		});

		it('parses "1h30m" (no space) as 5400 seconds', () => {
			expect(parseDuration('1h30m')).toBe(5400);
		});
	});

	describe('MM:SS format', () => {
		it('parses "30:00" as 1800 seconds', () => {
			expect(parseDuration('30:00')).toBe(1800);
		});

		it('parses "01:30" as 90 seconds', () => {
			expect(parseDuration('01:30')).toBe(90);
		});

		it('parses "5:00" as 300 seconds', () => {
			expect(parseDuration('5:00')).toBe(300);
		});
	});

	describe('HH:MM:SS format', () => {
		it('parses "01:30:00" as 5400 seconds', () => {
			expect(parseDuration('01:30:00')).toBe(5400);
		});

		it('parses "02:00:00" as 7200 seconds', () => {
			expect(parseDuration('02:00:00')).toBe(7200);
		});

		it('parses "1:30:45" as 5445 seconds', () => {
			expect(parseDuration('1:30:45')).toBe(5445);
		});
	});

	describe('invalid inputs', () => {
		it('returns null for empty string', () => {
			expect(parseDuration('')).toBeNull();
		});

		it('returns null for "invalid"', () => {
			expect(parseDuration('invalid')).toBeNull();
		});

		it('returns null for negative values', () => {
			expect(parseDuration('-30m')).toBeNull();
		});

		it('returns null for just numbers without unit', () => {
			expect(parseDuration('30')).toBeNull();
		});
	});

	describe('whitespace handling', () => {
		it('trims leading/trailing whitespace', () => {
			expect(parseDuration('  30m  ')).toBe(1800);
		});

		it('handles multiple spaces in combined format', () => {
			expect(parseDuration('1h   30m')).toBe(5400);
		});
	});
});

describe('formatDuration', () => {
	it('formats 30 seconds as "30s"', () => {
		expect(formatDuration(30)).toBe('30s');
	});

	it('formats 60 seconds as "1m"', () => {
		expect(formatDuration(60)).toBe('1m');
	});

	it('formats 90 seconds as "1m 30s"', () => {
		expect(formatDuration(90)).toBe('1m 30s');
	});

	it('formats 1800 seconds as "30m"', () => {
		expect(formatDuration(1800)).toBe('30m');
	});

	it('formats 3600 seconds as "1h"', () => {
		expect(formatDuration(3600)).toBe('1h');
	});

	it('formats 5400 seconds as "1h 30m"', () => {
		expect(formatDuration(5400)).toBe('1h 30m');
	});

	it('formats 3661 seconds as "1h 1m 1s"', () => {
		expect(formatDuration(3661)).toBe('1h 1m 1s');
	});

	it('formats 0 seconds as "0s"', () => {
		expect(formatDuration(0)).toBe('0s');
	});
});
