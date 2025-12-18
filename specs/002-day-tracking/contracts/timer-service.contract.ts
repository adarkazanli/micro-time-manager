/**
 * Timer Service Contract
 *
 * Feature: 002-day-tracking
 * Purpose: Define the public interface for the low-level timer service
 *
 * This contract file specifies WHAT the timer service does, not HOW.
 * The timer service handles the low-level timing mechanics, separate
 * from the reactive store layer.
 */

// =============================================================================
// Service Interface
// =============================================================================

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
 * Timer service provides high-precision elapsed time tracking.
 *
 * Uses performance.now() for accuracy and requestAnimationFrame
 * for efficient display updates.
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
export interface TimerServiceContract {
	/**
	 * Start the timer from zero or specified offset.
	 *
	 * @param startFromMs - Optional starting elapsed time (for recovery)
	 */
	start(startFromMs?: number): void;

	/**
	 * Stop the timer and return final elapsed time.
	 *
	 * @returns Total elapsed time in milliseconds
	 */
	stop(): number;

	/**
	 * Check if timer is currently running.
	 */
	isRunning(): boolean;

	/**
	 * Get current elapsed time without stopping.
	 *
	 * @returns Current elapsed time in milliseconds
	 */
	getElapsed(): number;

	/**
	 * Clean up timer resources.
	 * Call when timer is no longer needed.
	 */
	destroy(): void;
}

/**
 * Factory function to create timer instances.
 */
export type CreateTimerFn = (config: TimerConfig) => TimerServiceContract;

// =============================================================================
// Behavioral Contracts
// =============================================================================

/**
 * Contract: Uses performance.now() for monotonic time
 *
 * Timer MUST use performance.now() to ensure elapsed time
 * is unaffected by system clock changes.
 *
 * @test
 * ```typescript
 * const timer = createTimer({ onTick: vi.fn() });
 *
 * // Mock performance.now to return controlled values
 * const perfNow = vi.spyOn(performance, 'now');
 * perfNow.mockReturnValueOnce(0);
 *
 * timer.start();
 *
 * perfNow.mockReturnValueOnce(1000);
 * expect(timer.getElapsed()).toBe(1000);
 *
 * // System clock change should NOT affect elapsed
 * vi.setSystemTime(new Date('2030-01-01'));
 * perfNow.mockReturnValueOnce(2000);
 * expect(timer.getElapsed()).toBe(2000);
 * ```
 */
export const CONTRACT_MONOTONIC_TIME = 'timer-service-monotonic';

/**
 * Contract: Uses requestAnimationFrame for updates
 *
 * Timer MUST use requestAnimationFrame for onTick callbacks
 * to ensure updates are synced with display refresh.
 *
 * @test
 * ```typescript
 * const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
 * const onTick = vi.fn();
 *
 * const timer = createTimer({ onTick });
 * timer.start();
 *
 * // RAF should be called
 * expect(rafSpy).toHaveBeenCalled();
 *
 * // Simulate one frame
 * rafSpy.mock.calls[0][0](1000);
 * expect(onTick).toHaveBeenCalledWith(expect.any(Number));
 * ```
 */
export const CONTRACT_RAF_UPDATES = 'timer-service-raf';

/**
 * Contract: Cancels RAF on stop
 *
 * Timer MUST cancel any pending requestAnimationFrame
 * when stopped to prevent memory leaks.
 *
 * @test
 * ```typescript
 * const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
 *
 * const timer = createTimer({ onTick: vi.fn() });
 * timer.start();
 * timer.stop();
 *
 * expect(cancelSpy).toHaveBeenCalled();
 * ```
 */
export const CONTRACT_CANCEL_ON_STOP = 'timer-service-cancel';

/**
 * Contract: Recovers from startFromMs offset
 *
 * Timer MUST support starting with a pre-existing elapsed time,
 * used for session recovery after page refresh.
 *
 * @test
 * ```typescript
 * const timer = createTimer({ onTick: vi.fn() });
 *
 * // Start with 5 seconds already elapsed
 * timer.start(5000);
 *
 * // Immediately should show 5 seconds
 * expect(timer.getElapsed()).toBeGreaterThanOrEqual(5000);
 * expect(timer.getElapsed()).toBeLessThan(5100);
 * ```
 */
export const CONTRACT_RECOVERY_OFFSET = 'timer-service-recovery';

/**
 * Contract: Handles background tab correctly
 *
 * When tab returns from background, timer MUST report
 * accurate elapsed time (wall clock time, not paused time).
 *
 * @test
 * ```typescript
 * const perfNow = vi.spyOn(performance, 'now');
 * const timer = createTimer({ onTick: vi.fn() });
 *
 * perfNow.mockReturnValueOnce(0);
 * timer.start();
 *
 * // Simulate 60 seconds passing while backgrounded
 * // (no RAF callbacks fire during this time)
 * perfNow.mockReturnValueOnce(60000);
 *
 * // On resume, elapsed should be 60 seconds
 * expect(timer.getElapsed()).toBe(60000);
 * ```
 */
export const CONTRACT_BACKGROUND_ACCURACY = 'timer-service-background';

/**
 * Contract: Safe to call stop when not running
 *
 * Calling stop() when timer is not running MUST NOT throw
 * and MUST return the last known elapsed time.
 *
 * @test
 * ```typescript
 * const timer = createTimer({ onTick: vi.fn() });
 *
 * // Stop before starting
 * expect(() => timer.stop()).not.toThrow();
 * expect(timer.stop()).toBe(0);
 *
 * // Start, stop, stop again
 * timer.start();
 * await sleep(100);
 * const elapsed1 = timer.stop();
 * const elapsed2 = timer.stop();
 *
 * expect(elapsed2).toBe(elapsed1);
 * ```
 */
export const CONTRACT_SAFE_STOP = 'timer-service-safe-stop';

/**
 * Contract: Clean destruction
 *
 * Calling destroy() MUST stop the timer and release all resources.
 * No callbacks should fire after destruction.
 *
 * @test
 * ```typescript
 * const onTick = vi.fn();
 * const timer = createTimer({ onTick });
 *
 * timer.start();
 * timer.destroy();
 *
 * onTick.mockClear();
 * await sleep(100);
 *
 * // No more callbacks after destroy
 * expect(onTick).not.toHaveBeenCalled();
 * ```
 */
export const CONTRACT_CLEAN_DESTROY = 'timer-service-destroy';

// =============================================================================
// Tab Sync Service Contract
// =============================================================================

/**
 * Tab synchronization service for multi-tab detection.
 */
export interface TabSyncServiceContract {
	/**
	 * Claim leadership for this tab.
	 *
	 * @returns True if this tab is now the leader
	 */
	claimLeadership(): boolean;

	/**
	 * Check if this tab is currently the leader.
	 */
	isLeader(): boolean;

	/**
	 * Release leadership (e.g., when closing tab).
	 */
	releaseLeadership(): void;

	/**
	 * Subscribe to leadership changes.
	 *
	 * @param callback - Called when leadership status changes
	 * @returns Unsubscribe function
	 */
	onLeadershipChange(callback: (isLeader: boolean) => void): () => void;

	/**
	 * Get info about the current leader tab.
	 *
	 * @returns Leader tab info, or null if no leader
	 */
	getLeaderInfo(): { tabId: string; activeSince: number } | null;

	/**
	 * Clean up resources.
	 */
	destroy(): void;
}

/**
 * Contract: Heartbeat keeps leadership
 *
 * Leader tab MUST send heartbeats to maintain leadership.
 * Other tabs can claim leadership if heartbeat is stale.
 *
 * @test
 * ```typescript
 * const tab1 = createTabSync();
 * const tab2 = createTabSync();
 *
 * tab1.claimLeadership();
 * expect(tab1.isLeader()).toBe(true);
 * expect(tab2.isLeader()).toBe(false);
 *
 * // Simulate tab1 going stale (no heartbeat for 5+ seconds)
 * await sleep(6000);
 *
 * // tab2 can now claim leadership
 * expect(tab2.claimLeadership()).toBe(true);
 * expect(tab2.isLeader()).toBe(true);
 * ```
 */
export const CONTRACT_HEARTBEAT = 'tab-sync-heartbeat';

/**
 * Contract: BroadcastChannel for cross-tab communication
 *
 * Service MUST use BroadcastChannel API (with localStorage fallback)
 * to notify other tabs of leadership changes.
 *
 * @test
 * ```typescript
 * const tab1 = createTabSync();
 * const tab2 = createTabSync();
 *
 * const leaderChangeSpy = vi.fn();
 * tab2.onLeadershipChange(leaderChangeSpy);
 *
 * tab1.claimLeadership();
 *
 * // tab2 should be notified
 * await vi.waitFor(() => {
 *   expect(leaderChangeSpy).toHaveBeenCalledWith(false);
 * });
 * ```
 */
export const CONTRACT_BROADCAST_CHANNEL = 'tab-sync-broadcast';
