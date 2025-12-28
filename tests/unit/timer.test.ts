/**
 * Unit tests for createTimer service
 * Tests: Date.now() usage for wall-clock accuracy, RAF updates, stop/start, recovery offset
 *
 * Note: Timer uses Date.now() (wall-clock time) instead of performance.now()
 * to ensure accurate tracking even when browser tabs are suspended
 * (e.g., during phone calls on mobile).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Timer service types imported from service
import type { TimerConfig as _TimerConfig, TimerService as _TimerService } from '$lib/services/timer';

describe('createTimer', () => {
	let mockDateNow: ReturnType<typeof vi.spyOn>;
	let mockRAF: ReturnType<typeof vi.spyOn>;
	let mockCancelRAF: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.useFakeTimers();
		mockDateNow = vi.spyOn(Date, 'now');
		mockRAF = vi.spyOn(window, 'requestAnimationFrame');
		mockCancelRAF = vi.spyOn(window, 'cancelAnimationFrame');
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('Date.now() usage for wall-clock accuracy', () => {
		it('should use Date.now() for elapsed time calculations', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValueOnce(1000000); // Start time
			const timer = createTimer({ onTick });
			timer.start();

			mockDateNow.mockReturnValueOnce(1001000); // 1 second later
			expect(timer.getElapsed()).toBe(1000);

			timer.destroy();
		});

		it('should track elapsed time accurately across tab suspension', async () => {
			// This is the key benefit of using Date.now() over performance.now()
			// When a tab is suspended (e.g., during phone calls), Date.now() continues
			// to advance while performance.now() stops
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValueOnce(1000000); // Start time
			const timer = createTimer({ onTick });
			timer.start();

			// Simulate 10 minutes passing while tab was suspended
			mockDateNow.mockReturnValueOnce(1600000); // 600 seconds (10 min) later
			expect(timer.getElapsed()).toBe(600000);

			timer.destroy();
		});
	});

	describe('requestAnimationFrame updates', () => {
		it('should use requestAnimationFrame for tick callbacks', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValue(1000000);
			mockRAF.mockImplementation((cb: FrameRequestCallback) => {
				setTimeout(() => cb(0), 16);
				return 1;
			});

			const timer = createTimer({ onTick });
			timer.start();

			expect(mockRAF).toHaveBeenCalled();
			timer.destroy();
		});

		it('should cancel RAF on stop', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValue(1000000);
			mockRAF.mockReturnValue(123);

			const timer = createTimer({ onTick });
			timer.start();
			timer.stop();

			expect(mockCancelRAF).toHaveBeenCalledWith(123);
		});
	});

	describe('start/stop behavior', () => {
		it('should track running state correctly', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValue(1000000);
			const timer = createTimer({ onTick });

			expect(timer.isRunning()).toBe(false);

			timer.start();
			expect(timer.isRunning()).toBe(true);

			timer.stop();
			expect(timer.isRunning()).toBe(false);

			timer.destroy();
		});

		it('should call onStart callback when starting', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();
			const onStart = vi.fn();

			mockDateNow.mockReturnValue(1000000);
			const timer = createTimer({ onTick, onStart });

			timer.start();
			expect(onStart).toHaveBeenCalledTimes(1);

			timer.destroy();
		});

		it('should call onStop callback with elapsed time', async () => {
			const onTick = vi.fn();
			const onStop = vi.fn();

			// Mock Date.now() to return increasing values
			mockDateNow
				.mockReturnValueOnce(1000000) // start() call
				.mockReturnValueOnce(1005000); // getElapsedInternal() in stop() - 5 seconds later

			const { createTimer } = await import('$lib/services/timer');
			const timer = createTimer({ onTick, onStop });
			timer.start();
			timer.stop();

			expect(onStop).toHaveBeenCalledWith(5000);

			timer.destroy();
		});

		it('should return elapsed time from stop()', async () => {
			const onTick = vi.fn();

			// Mock Date.now() to return increasing values
			mockDateNow
				.mockReturnValueOnce(1000000) // start() call
				.mockReturnValueOnce(1003000); // getElapsedInternal() in stop() - 3 seconds later

			const { createTimer } = await import('$lib/services/timer');

			const timer = createTimer({ onTick });
			timer.start();

			const elapsed = timer.stop();

			expect(elapsed).toBe(3000);

			timer.destroy();
		});

		it('should be safe to call stop when not running', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			const timer = createTimer({ onTick });

			expect(() => timer.stop()).not.toThrow();
			expect(timer.stop()).toBe(0);

			timer.destroy();
		});
	});

	describe('recovery offset', () => {
		it('should support starting with a pre-existing elapsed time', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValueOnce(1000000);
			const timer = createTimer({ onTick });

			// Start with 5 seconds already elapsed
			timer.start(5000);

			mockDateNow.mockReturnValueOnce(1001000); // 1 second after start
			expect(timer.getElapsed()).toBe(6000); // 5000 + 1000

			timer.destroy();
		});

		it('should handle recovery after page refresh', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			// Simulate recovering from persisted state with 45 seconds elapsed
			mockDateNow.mockReturnValueOnce(1000000);
			const timer = createTimer({ onTick });
			timer.start(45000);

			mockDateNow.mockReturnValueOnce(1005000); // 5 seconds later
			expect(timer.getElapsed()).toBe(50000); // 45000 + 5000

			timer.destroy();
		});
	});

	describe('background tab handling', () => {
		it('should report accurate elapsed time after returning from background', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValueOnce(1000000);
			const timer = createTimer({ onTick });
			timer.start();

			// Simulate 60 seconds passing while tab was backgrounded
			// Date.now() continues to advance even when tab is suspended
			mockDateNow.mockReturnValueOnce(1060000);
			expect(timer.getElapsed()).toBe(60000);

			timer.destroy();
		});
	});

	describe('destroy', () => {
		it('should stop timer and clean up resources', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockDateNow.mockReturnValue(1000000);
			mockRAF.mockReturnValue(456);

			const timer = createTimer({ onTick });
			timer.start();
			timer.destroy();

			expect(timer.isRunning()).toBe(false);
			expect(mockCancelRAF).toHaveBeenCalledWith(456);
		});
	});
});
