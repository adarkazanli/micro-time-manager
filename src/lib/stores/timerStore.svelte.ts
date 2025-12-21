/**
 * Timer Store
 *
 * Feature: 002-day-tracking
 * Task: T014 - Create timerStore with Svelte 5 runes
 *
 * Manages real-time countdown state for the active task.
 * Uses Svelte 5 runes for reactive state management.
 *
 * Per Constitution III: Uses performance.now() for accuracy.
 */

import type { TimerState, TimerColor, TimerRecoveryResult, DaySession } from '$lib/types';
import { WARNING_THRESHOLD_MS, TIMER_SYNC_INTERVAL_MS, MAX_RECOVERY_ELAPSED_MS } from '$lib/types';
import { createTimer, type TimerService } from '$lib/services/timer';
import { settingsStore } from '$lib/stores/settingsStore.svelte';
import { storage } from '$lib/services/storage';

// =============================================================================
// State
// =============================================================================

let elapsedMsState = $state(0);
let durationMs = $state(0);
let running = $state(false);
let timer: TimerService | null = null;

// T012: Sync interval ID for periodic persistence
let syncIntervalId: ReturnType<typeof setInterval> | null = null;

// Flag to track if browser event listeners have been set up
let listenersInitialized = false;

// =============================================================================
// Derived State
// =============================================================================

const remainingMsValue = $derived(durationMs - elapsedMsState);

const colorValue = $derived.by<TimerColor>(() => {
	// Special case: no timer configured yet (durationMs = 0)
	if (durationMs === 0 && !running) return 'green';
	const remaining = durationMs - elapsedMsState;
	if (remaining <= 0) return 'red';
	// T024/T025: Use dynamic warning threshold from settings
	const warningThresholdMs = settingsStore.warningThresholdSec * 1000;
	if (remaining <= warningThresholdMs) return 'yellow';
	return 'green';
});

const displayTimeValue = $derived.by(() => {
	const remaining = durationMs - elapsedMsState;
	return formatTime(remaining);
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format milliseconds as MM:SS or H:MM:SS
 * Negative values shown with leading minus sign
 */
function formatTime(ms: number): string {
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

// =============================================================================
// Persistence Helpers (010-timer-persistence)
// =============================================================================

/**
 * T019: Persist current timer state to storage.
 * Called periodically and on browser events.
 */
function persistTimerState(): void {
	if (!running) return;

	const session = storage.getSession();
	if (!session || session.status !== 'running') return;

	// Get current elapsed from timer
	let currentElapsed = elapsedMsState;
	if (timer) {
		currentElapsed = timer.getElapsed();
		elapsedMsState = currentElapsed;
	}

	// Update session with current timer state
	const updatedSession: DaySession = {
		...session,
		currentTaskElapsedMs: currentElapsed,
		lastPersistedAt: Date.now()
	};

	storage.saveSession(updatedSession);
}

/**
 * T013: Start periodic sync interval.
 * Called internally when timer starts.
 */
function startPersistenceSync(): void {
	if (syncIntervalId !== null) return;

	syncIntervalId = setInterval(() => {
		persistTimerState();
	}, TIMER_SYNC_INTERVAL_MS);
}

/**
 * T014: Stop periodic sync interval.
 * Called internally when timer stops.
 */
function stopPersistenceSync(): void {
	if (syncIntervalId !== null) {
		clearInterval(syncIntervalId);
		syncIntervalId = null;
	}
}

/**
 * T024/T025: Recalculate elapsed time on wake from sleep.
 * Uses wall-clock recovery to add any time spent sleeping.
 */
function recalculateElapsedOnWake(): void {
	if (!running) return;

	const session = storage.getSession();
	if (!session || session.status !== 'running') return;

	const now = Date.now();
	const lastSync = session.lastPersistedAt;
	const savedElapsed = session.currentTaskElapsedMs;

	// Calculate how much time passed since last sync
	const awayTimeMs = now - lastSync;

	// If significant time passed (more than sync interval), we were likely asleep
	if (awayTimeMs > TIMER_SYNC_INTERVAL_MS + 1000) {
		let newElapsed = savedElapsed + awayTimeMs;

		// Cap at 24 hours
		if (newElapsed > MAX_RECOVERY_ELAPSED_MS) {
			newElapsed = MAX_RECOVERY_ELAPSED_MS;
		}

		// Update state
		elapsedMsState = newElapsed;

		// Restart timer from new position
		if (timer) {
			timer.destroy();
			timer = createTimer({
				onTick: (elapsed: number) => {
					elapsedMsState = elapsed;
				}
			});
			timer.start(newElapsed);
		}

		// Persist the updated state
		persistTimerState();
	}
}

/**
 * T018: Set up browser event listeners for persistence.
 * Called once when the store is first used.
 */
function setupBrowserEventListeners(): void {
	if (listenersInitialized || typeof window === 'undefined') return;

	// T024: Handle visibility change for both persist (hidden) and recalculate (visible)
	document.addEventListener('visibilitychange', () => {
		if (document.hidden && running) {
			// Persist when tab becomes hidden
			persistTimerState();
		} else if (!document.hidden && running) {
			// T025: Recalculate elapsed on wake (visibility becomes visible)
			recalculateElapsedOnWake();
		}
	});

	// Persist before page unloads
	window.addEventListener('pagehide', () => {
		if (running) persistTimerState();
	});

	window.addEventListener('beforeunload', () => {
		if (running) persistTimerState();
	});

	listenersInitialized = true;
}

/**
 * T017: Calculate timer recovery state from a persisted session.
 *
 * @param session - Previously saved session state
 * @returns Recovery result with elapsed time and validation status
 */
function calculateRecovery(session: DaySession | null): TimerRecoveryResult {
	// No session or not running
	if (!session || session.status !== 'running') {
		return {
			success: false,
			recoveredElapsedMs: 0,
			awayTimeMs: 0,
			isValid: true
		};
	}

	const now = Date.now();
	const lastSync = session.lastPersistedAt;
	const savedElapsed = session.currentTaskElapsedMs;

	// Validate: lastSync should not be in the future
	if (lastSync > now) {
		console.warn('Timer recovery: timestamp in future, resetting');
		return {
			success: false,
			recoveredElapsedMs: 0,
			awayTimeMs: 0,
			isValid: false,
			error: 'Future timestamp'
		};
	}

	const awayTimeMs = now - lastSync;
	let recoveredElapsedMs = savedElapsed + awayTimeMs;

	// Validate: negative elapsed should be 0
	if (recoveredElapsedMs < 0) {
		recoveredElapsedMs = 0;
	}

	// Cap at 24 hours
	if (recoveredElapsedMs > MAX_RECOVERY_ELAPSED_MS) {
		console.warn('Timer recovery: elapsed exceeds 24h, capping');
		recoveredElapsedMs = MAX_RECOVERY_ELAPSED_MS;
	}

	return {
		success: true,
		recoveredElapsedMs,
		awayTimeMs,
		isValid: true
	};
}

// =============================================================================
// Store Implementation
// =============================================================================

function createTimerStore() {
	return {
		// -------------------------------------------------------------------------
		// Readable State (getters)
		// -------------------------------------------------------------------------

		get elapsedMs(): number {
			return elapsedMsState;
		},

		get remainingMs(): number {
			return remainingMsValue;
		},

		get color(): TimerColor {
			return colorValue;
		},

		get isRunning(): boolean {
			return running;
		},

		get displayTime(): string {
			return displayTimeValue;
		},

		get state(): TimerState {
			return this.snapshot();
		},

		// -------------------------------------------------------------------------
		// Actions
		// -------------------------------------------------------------------------

		/**
		 * Start the timer for a new task.
		 *
		 * @param durationSec - Planned duration in seconds
		 * @param startFromMs - Optional starting elapsed time (for recovery)
		 */
		start(durationSec: number, startFromMs: number = 0): void {
			if (running) return;

			// Set duration in milliseconds
			durationMs = durationSec * 1000;
			elapsedMsState = startFromMs;

			// Clean up any existing timer
			if (timer) {
				timer.destroy();
			}

			// Create new timer service
			timer = createTimer({
				onTick: (elapsed: number) => {
					elapsedMsState = elapsed;
				}
			});

			timer.start(startFromMs);
			running = true;

			// T015: Start persistence sync and set up event listeners
			setupBrowserEventListeners();
			startPersistenceSync();
		},

		/**
		 * Stop the timer and return final elapsed time.
		 *
		 * @returns Final elapsed time in milliseconds
		 */
		stop(): number {
			// T016: Stop persistence sync
			stopPersistenceSync();

			if (!running || !timer) {
				return elapsedMsState;
			}

			const finalElapsed = timer.stop();
			elapsedMsState = finalElapsed;
			running = false;

			// Persist final state
			persistTimerState();

			return finalElapsed;
		},

		/**
		 * Set elapsed time for the running timer (for corrections).
		 *
		 * @param elapsedMs - New elapsed time in milliseconds
		 */
		setElapsed(elapsedMs: number): void {
			if (!running) return;

			// Update state
			elapsedMsState = elapsedMs;

			// If timer is running, restart it from the new elapsed time
			if (timer) {
				timer.destroy();
				timer = createTimer({
					onTick: (elapsed: number) => {
						elapsedMsState = elapsed;
					}
				});
				timer.start(elapsedMs);
			}
		},

		/**
		 * Reset timer to initial state.
		 */
		reset(): void {
			if (timer) {
				timer.destroy();
				timer = null;
			}

			elapsedMsState = 0;
			durationMs = 0;
			running = false;
		},

		/**
		 * Force an immediate state snapshot for persistence.
		 *
		 * @returns Current timer state
		 */
		snapshot(): TimerState {
			// Get current elapsed if timer is running
			let currentElapsed = elapsedMsState;
			if (running && timer) {
				currentElapsed = timer.getElapsed();
				elapsedMsState = currentElapsed;
			}

			const remaining = durationMs - currentElapsed;

			let color: TimerColor;
			// Special case: no timer configured yet (durationMs = 0)
			if (durationMs === 0 && !running) {
				color = 'green';
			} else if (remaining <= 0) {
				color = 'red';
			} else if (remaining <= settingsStore.warningThresholdSec * 1000) {
				// T024/T025: Use dynamic warning threshold from settings
				color = 'yellow';
			} else {
				color = 'green';
			}

			return {
				elapsedMs: currentElapsed,
				remainingMs: remaining,
				color,
				isRunning: running,
				displayTime: formatTime(remaining)
			};
		},

		/**
		 * T017: Recover timer state on app load.
		 * Calculates elapsed time from persisted timestamps.
		 *
		 * @returns TimerRecoveryResult with success status and recovered elapsed
		 */
		recover(): TimerRecoveryResult {
			const session = storage.getSession();
			return calculateRecovery(session);
		}
	};
}

/**
 * The timer store singleton
 */
export const timerStore = createTimerStore();
