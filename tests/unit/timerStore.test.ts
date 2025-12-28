/**
 * Unit tests for timerStore
 *
 * Feature: 002-day-tracking
 * Task: T011 - Unit test for timerStore
 *
 * Tests: start, stop, reset, snapshot, elapsedMs, remainingMs, displayTime, color
 *
 * Note: Timer uses Date.now() (wall-clock time) instead of performance.now()
 * to ensure accurate tracking even when browser tabs are suspended
 * (e.g., during phone calls on mobile).
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('timerStore', () => {
	let mockDateNow: ReturnType<typeof vi.spyOn>;
	let mockRAF: ReturnType<typeof vi.spyOn>;
	let _mockCancelRAF: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.useFakeTimers();
		mockDateNow = vi.spyOn(Date, 'now');
		mockRAF = vi.spyOn(window, 'requestAnimationFrame');
		_mockCancelRAF = vi.spyOn(window, 'cancelAnimationFrame');

		// Default RAF mock - store callback but don't auto-execute
		mockRAF.mockReturnValue(1);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	describe('initial state', () => {
		it('should start with isRunning = false', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			expect(timerStore.isRunning).toBe(false);
		});

		it('should start with elapsedMs = 0', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			expect(timerStore.elapsedMs).toBe(0);
		});

		it('should start with remainingMs = 0', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			expect(timerStore.remainingMs).toBe(0);
		});

		it('should start with displayTime = "00:00"', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			expect(timerStore.displayTime).toBe('00:00');
		});

		it('should start with color = "green"', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			expect(timerStore.color).toBe('green');
		});
	});

	describe('start()', () => {
		it('should set isRunning to true when started', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60); // 1 minute

			expect(timerStore.isRunning).toBe(true);
		});

		it('should calculate remainingMs based on duration', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(120); // 2 minutes = 120000ms

			expect(timerStore.remainingMs).toBe(120000);
		});

		it('should support starting with pre-existing elapsed time (recovery)', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			// Start with 30 seconds already elapsed
			timerStore.start(120, 30000); // 2 min duration, 30s elapsed

			expect(timerStore.elapsedMs).toBe(30000);
			expect(timerStore.remainingMs).toBe(90000); // 120s - 30s = 90s
		});

		it('should not restart if already running', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);

			// Advance time
			mockDateNow.mockReturnValue(5000);

			// Try to start again - should be ignored
			timerStore.start(120);

			// Should still be based on original start, with elapsed time
			expect(timerStore.isRunning).toBe(true);
		});
	});

	describe('stop()', () => {
		it('should set isRunning to false', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			timerStore.stop();

			expect(timerStore.isRunning).toBe(false);
		});

		it('should return final elapsed time in milliseconds', async () => {
			mockDateNow
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(5000); // stop

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			const elapsed = timerStore.stop();

			expect(elapsed).toBe(5000);
		});

		it('should preserve elapsed time after stop', async () => {
			mockDateNow
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(10000); // stop

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			timerStore.stop();

			expect(timerStore.elapsedMs).toBe(10000);
		});

		it('should return 0 if timer was never started', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			const elapsed = timerStore.stop();

			expect(elapsed).toBe(0);
		});
	});

	describe('reset()', () => {
		it('should stop the timer', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			timerStore.reset();

			expect(timerStore.isRunning).toBe(false);
		});

		it('should reset elapsedMs to 0', async () => {
			mockDateNow
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(10000);

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			timerStore.stop();
			timerStore.reset();

			expect(timerStore.elapsedMs).toBe(0);
		});

		it('should reset remainingMs to 0', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			timerStore.reset();

			expect(timerStore.remainingMs).toBe(0);
		});

		it('should reset displayTime to "00:00"', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			timerStore.reset();

			expect(timerStore.displayTime).toBe('00:00');
		});
	});

	describe('snapshot()', () => {
		it('should return complete TimerState object', async () => {
			mockDateNow
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(5000);

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes = 600000ms
			const state = timerStore.snapshot();

			// elapsed: 5000ms, remaining: 600000-5000 = 595000ms (> 5 min = green)
			expect(state).toEqual({
				elapsedMs: 5000,
				remainingMs: 595000,
				color: 'green',
				isRunning: true,
				displayTime: expect.any(String)
			});
		});

		it('should work when timer is not running', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			const state = timerStore.snapshot();

			expect(state.isRunning).toBe(false);
			expect(state.elapsedMs).toBe(0);
		});
	});

	describe('color thresholds', () => {
		it('should be green when remaining > 5 minutes', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes

			expect(timerStore.remainingMs).toBe(600000);
			expect(timerStore.color).toBe('green');
		});

		it('should be yellow when 0 < remaining <= 5 minutes', async () => {
			mockDateNow
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(301000); // 5min 1sec elapsed

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes

			// Force state update by calling snapshot
			const state = timerStore.snapshot();

			// 600s - 301s = 299s = 4min 59sec remaining = yellow
			expect(state.remainingMs).toBe(299000);
			expect(state.color).toBe('yellow');
		});

		it('should be yellow at exactly 5 minutes remaining', async () => {
			mockDateNow
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(300000); // 5 min elapsed

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes

			const state = timerStore.snapshot();

			// Exactly 5 min remaining = 300000ms = WARNING_THRESHOLD_MS
			expect(state.remainingMs).toBe(300000);
			expect(state.color).toBe('yellow');
		});

		it('should be red when overtime (remaining <= 0)', async () => {
			mockDateNow
				.mockReturnValueOnce(0) // start
				.mockReturnValueOnce(601000); // 10min 1sec elapsed

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes

			const state = timerStore.snapshot();

			// -1000ms remaining (1 second overtime)
			expect(state.remainingMs).toBe(-1000);
			expect(state.color).toBe('red');
		});
	});

	describe('displayTime format', () => {
		it('should format MM:SS for times under 1 hour', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(1234); // 20min 34sec

			expect(timerStore.displayTime).toBe('20:34');
		});

		it('should format H:MM:SS for times >= 1 hour', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(3700); // 1hr 1min 40sec

			expect(timerStore.displayTime).toBe('1:01:40');
		});

		it('should format with leading zeros for minutes under 10', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(545); // 9min 5sec

			expect(timerStore.displayTime).toBe('09:05');
		});

		it('should format negative time when overtime', async () => {
			mockDateNow
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(660000); // 11 min elapsed

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes

			const state = timerStore.snapshot();

			// -1 min overtime
			expect(state.displayTime).toBe('-01:00');
		});

		it('should format negative time with hours when overtime >= 1 hour', async () => {
			mockDateNow
				.mockReturnValueOnce(0)
				.mockReturnValueOnce(4200000); // 70 min elapsed

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(600); // 10 minutes

			const state = timerStore.snapshot();

			// -60 min overtime = -1 hour
			expect(state.displayTime).toBe('-1:00:00');
		});
	});

	describe('elapsed time calculation', () => {
		it('should calculate elapsed time using Date.now() for wall-clock accuracy', async () => {
			mockDateNow
				.mockReturnValueOnce(1000000) // start
				.mockReturnValueOnce(1002000); // getElapsed - 2 seconds later

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(60);
			const state = timerStore.snapshot();

			expect(state.elapsedMs).toBe(2000);
		});

		it('should track elapsed time accurately across tab suspension', async () => {
			// This is the key benefit of using Date.now() over performance.now()
			// When a tab is suspended (e.g., during phone calls), Date.now() continues
			// to advance while performance.now() stops
			mockDateNow
				.mockReturnValueOnce(1000000) // start
				.mockReturnValueOnce(1600000); // 10 minutes later (simulating tab suspension)

			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(900); // 15 minutes
			const state = timerStore.snapshot();

			// Should show 10 minutes (600000ms) elapsed, even though RAF didn't tick
			expect(state.elapsedMs).toBe(600000);
		});
	});

	describe('state property', () => {
		it('should provide complete TimerState via state property', async () => {
			mockDateNow.mockReturnValue(0);
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			timerStore.start(300); // 5 minutes

			const state = timerStore.state;

			expect(state).toHaveProperty('elapsedMs');
			expect(state).toHaveProperty('remainingMs');
			expect(state).toHaveProperty('color');
			expect(state).toHaveProperty('isRunning');
			expect(state).toHaveProperty('displayTime');
		});
	});
});
