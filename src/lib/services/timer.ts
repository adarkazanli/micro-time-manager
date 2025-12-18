/**
 * Timer Service
 *
 * Feature: 002-day-tracking
 * Purpose: High-precision elapsed time tracking using performance.now()
 *          and requestAnimationFrame for efficient display updates.
 *
 * Per Constitution III: Uses monotonic time (performance.now()) to ensure
 * accuracy regardless of system clock changes.
 */

/**
 * Configuration for creating a timer instance.
 */
export interface TimerConfig {
	/** Callback fired on each animation frame while running */
	onTick: (elapsedMs: number) => void;

	/** Callback fired when timer is started */
	onStart?: () => void;

	/** Callback fired when timer is stopped */
	onStop?: (elapsedMs: number) => void;
}

/**
 * Timer service interface
 */
export interface TimerService {
	start(startFromMs?: number): void;
	stop(): number;
	isRunning(): boolean;
	getElapsed(): number;
	destroy(): void;
}

/**
 * Create a new timer instance.
 *
 * Uses performance.now() for monotonic time tracking and
 * requestAnimationFrame for efficient UI updates.
 *
 * @example
 * ```typescript
 * const timer = createTimer({
 *   onTick: (elapsed) => console.log(`${elapsed}ms elapsed`),
 *   onStop: (elapsed) => saveToStorage(elapsed)
 * });
 *
 * timer.start();
 * // ... later ...
 * const finalElapsed = timer.stop();
 * ```
 */
export function createTimer(config: TimerConfig): TimerService {
	const { onTick, onStart, onStop } = config;

	let running = false;
	let startTime = 0;
	let offset = 0;
	let rafId: number | null = null;
	let lastElapsed = 0;

	/**
	 * Animation frame callback - updates elapsed time and schedules next frame
	 */
	function tick(): void {
		if (!running) return;

		const elapsed = getElapsedInternal();
		lastElapsed = elapsed;
		onTick(elapsed);

		// Schedule next frame
		rafId = requestAnimationFrame(tick);
	}

	/**
	 * Calculate current elapsed time using performance.now()
	 */
	function getElapsedInternal(): number {
		if (!running) return lastElapsed;
		return performance.now() - startTime + offset;
	}

	return {
		/**
		 * Start the timer from zero or specified offset.
		 *
		 * @param startFromMs - Optional starting elapsed time (for recovery)
		 */
		start(startFromMs?: number): void {
			if (running) return;

			running = true;
			offset = startFromMs ?? 0;
			startTime = performance.now();

			onStart?.();

			// Start the animation frame loop
			rafId = requestAnimationFrame(tick);
		},

		/**
		 * Stop the timer and return final elapsed time.
		 *
		 * @returns Total elapsed time in milliseconds
		 */
		stop(): number {
			if (!running) return lastElapsed;

			// Calculate elapsed BEFORE setting running to false
			// (getElapsedInternal checks running state)
			lastElapsed = getElapsedInternal();
			running = false;

			// Cancel any pending animation frame
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			onStop?.(lastElapsed);

			return lastElapsed;
		},

		/**
		 * Check if timer is currently running.
		 */
		isRunning(): boolean {
			return running;
		},

		/**
		 * Get current elapsed time without stopping.
		 *
		 * @returns Current elapsed time in milliseconds
		 */
		getElapsed(): number {
			return getElapsedInternal();
		},

		/**
		 * Clean up timer resources.
		 * Call when timer is no longer needed.
		 */
		destroy(): void {
			running = false;

			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		}
	};
}
