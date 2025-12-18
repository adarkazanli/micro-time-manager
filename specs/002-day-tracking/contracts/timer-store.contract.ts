/**
 * Timer Store Contract
 *
 * Feature: 002-day-tracking
 * Purpose: Define the public interface for the timer store
 *
 * This contract file specifies WHAT the timer store does, not HOW.
 * Implementation tests should verify these contracts are met.
 */

import type { TimerState, TimerColor } from '$lib/types';

// =============================================================================
// Store Interface
// =============================================================================

/**
 * Timer store manages the real-time countdown state for the active task.
 *
 * @example
 * ```svelte
 * <script>
 *   import { timerStore } from '$lib/stores/timerStore.svelte';
 *
 *   // Access reactive state
 *   const elapsed = $derived(timerStore.elapsedMs);
 *   const remaining = $derived(timerStore.remainingMs);
 *   const color = $derived(timerStore.color);
 * </script>
 * ```
 */
export interface TimerStoreContract {
	// -------------------------------------------------------------------------
	// Readable State
	// -------------------------------------------------------------------------

	/**
	 * Milliseconds elapsed since task started.
	 * Updates every animation frame when running.
	 * @readonly
	 */
	readonly elapsedMs: number;

	/**
	 * Milliseconds remaining until task duration is exceeded.
	 * Can be negative when overtime.
	 * @readonly
	 */
	readonly remainingMs: number;

	/**
	 * Current timer color based on remaining time.
	 * - 'green': > 5 minutes remaining
	 * - 'yellow': 0-5 minutes remaining
	 * - 'red': overtime (negative remaining)
	 * @readonly
	 */
	readonly color: TimerColor;

	/**
	 * Whether the timer is actively counting.
	 * @readonly
	 */
	readonly isRunning: boolean;

	/**
	 * Formatted display string (e.g., "12:34" or "-2:15").
	 * Updates every second when running.
	 * @readonly
	 */
	readonly displayTime: string;

	/**
	 * Complete timer state snapshot for persistence.
	 * @readonly
	 */
	readonly state: TimerState;

	// -------------------------------------------------------------------------
	// Actions
	// -------------------------------------------------------------------------

	/**
	 * Start the timer for a new task.
	 *
	 * @param durationSec - Planned duration in seconds
	 * @param startFromMs - Optional starting elapsed time (for recovery)
	 *
	 * @example
	 * ```typescript
	 * // Start fresh task
	 * timerStore.start(1800); // 30 minutes
	 *
	 * // Resume from persisted state
	 * timerStore.start(1800, 45000); // 30 min task, 45 sec already elapsed
	 * ```
	 */
	start(durationSec: number, startFromMs?: number): void;

	/**
	 * Stop the timer and record final elapsed time.
	 *
	 * @returns Final elapsed time in milliseconds
	 *
	 * @example
	 * ```typescript
	 * const actualMs = timerStore.stop();
	 * console.log(`Task took ${actualMs / 1000} seconds`);
	 * ```
	 */
	stop(): number;

	/**
	 * Reset timer to initial state.
	 * Clears all elapsed time and stops any running timer.
	 */
	reset(): void;

	/**
	 * Force an immediate state snapshot for persistence.
	 * Normally called by the session store on visibility change.
	 *
	 * @returns Current timer state
	 */
	snapshot(): TimerState;
}

// =============================================================================
// Behavioral Contracts
// =============================================================================

/**
 * Contract: Timer uses performance.now() for accuracy
 *
 * The timer MUST use performance.now() for elapsed time calculations
 * to ensure accuracy even when the system clock changes.
 *
 * @test
 * ```typescript
 * // Mocking Date.now() should NOT affect timer accuracy
 * const originalDateNow = Date.now;
 * Date.now = () => 0; // Break Date.now
 *
 * timerStore.start(60);
 * await sleep(1000);
 *
 * // Timer should still report ~1000ms elapsed
 * expect(timerStore.elapsedMs).toBeGreaterThanOrEqual(900);
 * expect(timerStore.elapsedMs).toBeLessThanOrEqual(1100);
 *
 * Date.now = originalDateNow;
 * ```
 */
export const CONTRACT_USES_PERFORMANCE_NOW = 'timer-uses-performance-now';

/**
 * Contract: Timer updates at 60fps maximum
 *
 * The timer MUST use requestAnimationFrame for display updates
 * to maintain smooth visuals without excessive CPU usage.
 *
 * @test
 * ```typescript
 * let updateCount = 0;
 * const unsubscribe = timerStore.subscribe(() => updateCount++);
 *
 * timerStore.start(60);
 * await sleep(100); // 100ms = ~6 frames at 60fps
 *
 * // Should have roughly 6 updates, not 100
 * expect(updateCount).toBeLessThanOrEqual(10);
 * expect(updateCount).toBeGreaterThanOrEqual(4);
 *
 * unsubscribe();
 * ```
 */
export const CONTRACT_60FPS_UPDATES = 'timer-60fps-updates';

/**
 * Contract: Timer handles background tab correctly
 *
 * When the tab is backgrounded and returned to foreground,
 * the timer MUST show accurate elapsed time (not paused time).
 *
 * @test
 * ```typescript
 * timerStore.start(300); // 5 minute task
 *
 * // Simulate 2 minutes passing while tab is backgrounded
 * const startTime = performance.now();
 * // ... wait or mock 2 minutes ...
 *
 * // On return, timer should show ~2 minutes elapsed
 * expect(timerStore.elapsedMs).toBeGreaterThanOrEqual(119000);
 * expect(timerStore.elapsedMs).toBeLessThanOrEqual(121000);
 * ```
 */
export const CONTRACT_BACKGROUND_TAB_RECOVERY = 'timer-background-recovery';

/**
 * Contract: Timer color thresholds
 *
 * Timer MUST display:
 * - green when remaining > 5 minutes (300000ms)
 * - yellow when 0 < remaining <= 5 minutes
 * - red when remaining <= 0 (overtime)
 *
 * @test
 * ```typescript
 * timerStore.start(600); // 10 minutes
 *
 * // At start: 10 min remaining = green
 * expect(timerStore.color).toBe('green');
 *
 * // At 5:01 elapsed (4:59 remaining) = yellow
 * await advanceTimeTo(301000);
 * expect(timerStore.color).toBe('yellow');
 *
 * // At 10:01 elapsed (-1s remaining) = red
 * await advanceTimeTo(601000);
 * expect(timerStore.color).toBe('red');
 * ```
 */
export const CONTRACT_COLOR_THRESHOLDS = 'timer-color-thresholds';

/**
 * Contract: Display time format
 *
 * Timer MUST format display time as:
 * - "MM:SS" for positive remaining time
 * - "-MM:SS" for negative remaining time (overtime)
 * - Hours shown only when >= 60 minutes: "H:MM:SS"
 *
 * @test
 * ```typescript
 * timerStore.start(3700); // 1 hour 1 minute 40 seconds
 *
 * // At start
 * expect(timerStore.displayTime).toBe('1:01:40');
 *
 * // At 3600s elapsed (1:40 remaining)
 * await advanceTimeTo(3600000);
 * expect(timerStore.displayTime).toBe('01:40');
 *
 * // At 3800s elapsed (100s overtime)
 * await advanceTimeTo(3800000);
 * expect(timerStore.displayTime).toBe('-01:40');
 * ```
 */
export const CONTRACT_DISPLAY_FORMAT = 'timer-display-format';

// =============================================================================
// Test Helpers (for contract verification)
// =============================================================================

/**
 * Creates a mock timer for testing purposes.
 * Allows advancing time without waiting.
 */
export interface MockTimerStore extends TimerStoreContract {
	/**
	 * Advance mock time by specified milliseconds.
	 * Triggers appropriate state updates.
	 */
	advanceTime(ms: number): void;

	/**
	 * Set mock time to absolute value.
	 */
	setTime(ms: number): void;
}
