/**
 * Interruption Store
 *
 * Feature: 004-interruption-tracking
 * Tasks: T013-T019 - Interruption state management
 *
 * Manages interruption tracking state including active interruption,
 * elapsed time, and interruption history.
 *
 * Uses Svelte 5 runes for reactive state management.
 * Per Constitution III: Uses performance.now() for timer accuracy.
 */

import type { Interruption, InterruptionSummary, InterruptionCategory } from '$lib/types';
import { createTimer, type TimerService } from '$lib/services/timer';
import { storage } from '$lib/services/storage';

// =============================================================================
// State (T013)
// =============================================================================

let isInterruptedState = $state(false);
let activeInterruptionState = $state<Interruption | null>(null);
let elapsedMsState = $state(0);
let interruptionsState = $state<Interruption[]>([]);
let interruptionTimer: TimerService | null = null;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

// =============================================================================
// Store Implementation
// =============================================================================

function createInterruptionStore() {
	return {
		// -------------------------------------------------------------------------
		// Readable State (getters)
		// -------------------------------------------------------------------------

		get isInterrupted(): boolean {
			return isInterruptedState;
		},

		get activeInterruption(): Interruption | null {
			return activeInterruptionState;
		},

		get elapsedMs(): number {
			return elapsedMsState;
		},

		get interruptions(): Interruption[] {
			return interruptionsState;
		},

		// -------------------------------------------------------------------------
		// Actions
		// -------------------------------------------------------------------------

		/**
		 * Start a new interruption for the specified task.
		 * Creates an interruption timer and sets isInterrupted to true.
		 *
		 * @param taskId - ID of the task being interrupted
		 * @throws Error if already interrupted
		 */
		startInterruption(taskId: string): void {
			if (isInterruptedState) {
				throw new Error('Already interrupted');
			}

			const interruption: Interruption = {
				interruptionId: generateUUID(),
				taskId,
				startedAt: new Date().toISOString(),
				endedAt: null,
				durationSec: 0,
				category: null,
				note: null
			};

			activeInterruptionState = interruption;
			isInterruptedState = true;

			// Clean up any existing timer
			if (interruptionTimer) {
				interruptionTimer.destroy();
			}

			// Create and start interruption timer
			interruptionTimer = createTimer({
				onTick: (elapsed: number) => {
					elapsedMsState = elapsed;
				}
			});
			interruptionTimer.start(0);
		},

		/**
		 * End the current interruption and record it.
		 * Stops the interruption timer and adds to history.
		 *
		 * @returns The completed interruption record
		 * @throws Error if not currently interrupted
		 */
		endInterruption(): Interruption {
			if (!isInterruptedState || !activeInterruptionState) {
				throw new Error('Not interrupted');
			}

			// Get final elapsed time from timer
			const elapsedMs = interruptionTimer?.stop() ?? 0;
			const durationSec = Math.floor(elapsedMs / 1000);

			// Create completed interruption record
			const completed: Interruption = {
				...activeInterruptionState,
				endedAt: new Date().toISOString(),
				durationSec
			};

			// Add to history
			interruptionsState = [...interruptionsState, completed];

			// Reset active state
			activeInterruptionState = null;
			isInterruptedState = false;
			elapsedMsState = 0;

			// Persist to storage
			storage.saveInterruptions(interruptionsState);

			return completed;
		},

		/**
		 * Update a recorded interruption with category and/or note.
		 *
		 * @param id - The interruption ID to update
		 * @param updates - Object with optional category and note fields
		 * @throws Error if interruption not found
		 */
		updateInterruption(
			id: string,
			updates: Partial<Pick<Interruption, 'category' | 'note'>>
		): void {
			const index = interruptionsState.findIndex((i) => i.interruptionId === id);
			if (index === -1) {
				throw new Error('Interruption not found');
			}

			// Create updated interruption
			const updated: Interruption = {
				...interruptionsState[index],
				...(updates.category !== undefined && { category: updates.category }),
				...(updates.note !== undefined && { note: updates.note })
			};

			// Update array immutably
			interruptionsState = [
				...interruptionsState.slice(0, index),
				updated,
				...interruptionsState.slice(index + 1)
			];

			// Persist to storage
			storage.saveInterruptions(interruptionsState);
		},

		/**
		 * Get aggregated interruption summary for a specific task.
		 * Only includes completed interruptions (endedAt !== null).
		 *
		 * @param taskId - The task ID to get summary for
		 * @returns InterruptionSummary with count and totalDurationSec
		 */
		getTaskSummary(taskId: string): InterruptionSummary {
			const taskInterruptions = interruptionsState.filter(
				(i) => i.taskId === taskId && i.endedAt !== null
			);

			return {
				taskId,
				count: taskInterruptions.length,
				totalDurationSec: taskInterruptions.reduce((sum, i) => sum + i.durationSec, 0)
			};
		},

		/**
		 * Reset all interruption state.
		 * Clears active interruption, timer, and history.
		 */
		reset(): void {
			// Stop and clean up timer
			if (interruptionTimer) {
				interruptionTimer.destroy();
				interruptionTimer = null;
			}

			// Reset all state
			isInterruptedState = false;
			activeInterruptionState = null;
			elapsedMsState = 0;
			interruptionsState = [];

			// Clear from storage
			storage.clearInterruptions();
		},

		/**
		 * Restore interruptions from saved data.
		 * Used for session recovery.
		 *
		 * @param saved - Array of saved interruption records
		 */
		restore(saved: Interruption[]): void {
			interruptionsState = [...saved];
		},

		/**
		 * Auto-end an active interruption if one exists.
		 * Used when task is completed or session ends while interrupted.
		 *
		 * @returns The completed interruption if one was active, null otherwise
		 */
		autoEndInterruption(): Interruption | null {
			if (!isInterruptedState || !activeInterruptionState) {
				return null;
			}

			return this.endInterruption();
		}
	};
}

/**
 * The interruption store singleton
 */
export const interruptionStore = createInterruptionStore();
