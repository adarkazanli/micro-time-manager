/**
 * Unit tests for createTimer service
 * Tests: performance.now() usage, RAF updates, stop/start, recovery offset
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Timer service types imported from service
import type { TimerConfig as _TimerConfig, TimerService as _TimerService } from '$lib/services/timer';

describe('createTimer', () => {
	let mockPerformanceNow: ReturnType<typeof vi.spyOn>;
	let mockRAF: ReturnType<typeof vi.spyOn>;
	let mockCancelRAF: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.useFakeTimers();
		mockPerformanceNow = vi.spyOn(performance, 'now');
		mockRAF = vi.spyOn(window, 'requestAnimationFrame');
		mockCancelRAF = vi.spyOn(window, 'cancelAnimationFrame');
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('performance.now() usage', () => {
		it('should use performance.now() for elapsed time calculations', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockPerformanceNow.mockReturnValueOnce(0);
			const timer = createTimer({ onTick });
			timer.start();

			mockPerformanceNow.mockReturnValueOnce(1000);
			expect(timer.getElapsed()).toBe(1000);

			timer.destroy();
		});

		it('should be immune to Date.now() changes', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			// Mock performance.now with controlled values
			mockPerformanceNow.mockReturnValueOnce(0);
			const timer = createTimer({ onTick });
			timer.start();

			// Even if Date.now is broken, performance.now should work
			const originalDateNow = Date.now;
			Date.now = () => 999999999; // Break Date.now

			mockPerformanceNow.mockReturnValueOnce(1000);
			expect(timer.getElapsed()).toBe(1000);

			Date.now = originalDateNow;
			timer.destroy();
		});
	});

	describe('requestAnimationFrame updates', () => {
		it('should use requestAnimationFrame for tick callbacks', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockPerformanceNow.mockReturnValue(0);
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

			mockPerformanceNow.mockReturnValue(0);
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

			mockPerformanceNow.mockReturnValue(0);
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

			mockPerformanceNow.mockReturnValue(0);
			const timer = createTimer({ onTick, onStart });

			timer.start();
			expect(onStart).toHaveBeenCalledTimes(1);

			timer.destroy();
		});

		it('should call onStop callback with elapsed time', async () => {
			const onTick = vi.fn();
			const onStop = vi.fn();

			// Mock performance.now() to return increasing values
			// Use mockReturnValueOnce for sequential calls
			mockPerformanceNow
				.mockReturnValueOnce(0) // start() call
				.mockReturnValueOnce(5000); // getElapsedInternal() in stop()

			const { createTimer } = await import('$lib/services/timer');
			const timer = createTimer({ onTick, onStop });
			timer.start();
			timer.stop();

			expect(onStop).toHaveBeenCalledWith(5000);

			timer.destroy();
		});

		it('should return elapsed time from stop()', async () => {
			const onTick = vi.fn();

			// Mock performance.now() to return increasing values
			mockPerformanceNow
				.mockReturnValueOnce(0) // start() call
				.mockReturnValueOnce(3000); // getElapsedInternal() in stop()

			console.log('Before import, mock calls:', mockPerformanceNow.mock.calls.length);

			const { createTimer } = await import('$lib/services/timer');

			console.log('After import, mock calls:', mockPerformanceNow.mock.calls.length);

			const timer = createTimer({ onTick });
			timer.start();

			console.log('After start, mock calls:', mockPerformanceNow.mock.calls.length);
			console.log('Mock results:', mockPerformanceNow.mock.results.map((r: { value: number }) => r.value));

			const elapsed = timer.stop();

			console.log('After stop, mock calls:', mockPerformanceNow.mock.calls.length);
			console.log('Elapsed:', elapsed);

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

			mockPerformanceNow.mockReturnValueOnce(0);
			const timer = createTimer({ onTick });

			// Start with 5 seconds already elapsed
			timer.start(5000);

			mockPerformanceNow.mockReturnValueOnce(1000); // 1 second after start
			expect(timer.getElapsed()).toBe(6000); // 5000 + 1000

			timer.destroy();
		});

		it('should handle recovery after page refresh', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			// Simulate recovering from persisted state with 45 seconds elapsed
			mockPerformanceNow.mockReturnValueOnce(0);
			const timer = createTimer({ onTick });
			timer.start(45000);

			mockPerformanceNow.mockReturnValueOnce(5000); // 5 seconds later
			expect(timer.getElapsed()).toBe(50000); // 45000 + 5000

			timer.destroy();
		});
	});

	describe('background tab handling', () => {
		it('should report accurate elapsed time after returning from background', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockPerformanceNow.mockReturnValueOnce(0);
			const timer = createTimer({ onTick });
			timer.start();

			// Simulate 60 seconds passing while tab was backgrounded
			// (no RAF callbacks would have fired during this time)
			mockPerformanceNow.mockReturnValueOnce(60000);
			expect(timer.getElapsed()).toBe(60000);

			timer.destroy();
		});
	});

	describe('destroy', () => {
		it('should stop timer and clean up resources', async () => {
			const { createTimer } = await import('$lib/services/timer');
			const onTick = vi.fn();

			mockPerformanceNow.mockReturnValue(0);
			mockRAF.mockReturnValue(456);

			const timer = createTimer({ onTick });
			timer.start();
			timer.destroy();

			expect(timer.isRunning()).toBe(false);
			expect(mockCancelRAF).toHaveBeenCalledWith(456);
		});
	});
});
