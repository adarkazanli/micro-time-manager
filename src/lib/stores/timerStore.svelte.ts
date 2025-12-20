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

import type { TimerState, TimerColor } from '$lib/types';
import { WARNING_THRESHOLD_MS } from '$lib/types';
import { createTimer, type TimerService } from '$lib/services/timer';
import { settingsStore } from '$lib/stores/settingsStore.svelte';

// =============================================================================
// State
// =============================================================================

let elapsedMsState = $state(0);
let durationMs = $state(0);
let running = $state(false);
let timer: TimerService | null = null;

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
		},

		/**
		 * Stop the timer and return final elapsed time.
		 *
		 * @returns Final elapsed time in milliseconds
		 */
		stop(): number {
			if (!running || !timer) {
				return elapsedMsState;
			}

			const finalElapsed = timer.stop();
			elapsedMsState = finalElapsed;
			running = false;

			return finalElapsed;
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
		}
	};
}

/**
 * The timer store singleton
 */
export const timerStore = createTimerStore();
