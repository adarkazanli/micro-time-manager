/**
 * Schedule Calculator Service
 *
 * Feature: 011-auto-start-time
 *
 * Provides automatic calculation of task start times based on:
 * - Task sequence and duration
 * - Fixed-time appointments that cannot be moved
 * - Task interruption and resumption
 * - Schedule overflow and conflict detection
 *
 * @module scheduleCalculator
 */

import type {
	ConfirmedTask,
	ScheduleConfig,
	ScheduledTask,
	ScheduleResult,
	FixedTaskConflict
} from '$lib/types';

// =============================================================================
// Constants
// =============================================================================

/** Debounce delay for schedule recalculation (milliseconds) */
const DEBOUNCE_DELAY_MS = 300;

/** Milliseconds in a day (for overflow detection) */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the effective schedule start time from configuration.
 *
 * @param config - Schedule configuration
 * @returns The start time as a Date object
 *
 * @example
 * ```ts
 * // "Start Now" mode
 * getScheduleStartTime({ mode: 'now', customStartTime: null }); // Returns current time
 *
 * // Custom mode
 * getScheduleStartTime({ mode: 'custom', customStartTime: new Date('2025-12-26T09:30:00') });
 * // Returns 2025-12-26T09:30:00
 * ```
 */
export function getScheduleStartTime(config: ScheduleConfig): Date {
	if (config.mode === 'custom' && config.customStartTime) {
		return config.customStartTime;
	}
	return new Date();
}

/**
 * Check if a schedule extends past midnight.
 *
 * @param scheduleEndTime - End time of the last task
 * @param scheduleStartTime - Start time of the schedule
 * @returns true if schedule crosses midnight
 *
 * @example
 * ```ts
 * const start = new Date('2025-12-26T22:00:00');
 * const end = new Date('2025-12-27T01:00:00');
 * hasScheduleOverflow(end, start); // Returns true
 * ```
 */
export function hasScheduleOverflow(
	scheduleEndTime: Date,
	scheduleStartTime: Date
): boolean {
	// Get the date portion of start time (midnight of that day)
	const startDay = new Date(scheduleStartTime);
	startDay.setHours(0, 0, 0, 0);

	// Get midnight of the next day
	const nextMidnight = new Date(startDay.getTime() + MS_PER_DAY);

	// Overflow if end time is on or after the next day's midnight
	return scheduleEndTime.getTime() >= nextMidnight.getTime();
}

/**
 * Calculate remaining duration for an interrupted task.
 *
 * When a flexible task is interrupted by a fixed task, this function
 * calculates how much time was worked before the interruption and
 * how much remains after.
 *
 * @param flexibleTask - The task being interrupted
 * @param flexibleStart - When the flexible task started
 * @param fixedStart - When the fixed task starts (interruption point)
 * @returns Object with duration split
 *
 * @example
 * ```ts
 * const split = calculateInterruptionSplit(
 *   task, // 2 hour task
 *   new Date('2025-12-26T08:30:00'), // Starts at 8:30
 *   new Date('2025-12-26T09:00:00')  // Fixed task at 9:00
 * );
 * // split.beforePauseSec = 1800 (30 min)
 * // split.remainingSec = 5400 (90 min)
 * ```
 */
export function calculateInterruptionSplit(
	flexibleTask: ConfirmedTask,
	flexibleStart: Date,
	fixedStart: Date
): {
	beforePauseSec: number;
	remainingSec: number;
} {
	const beforePauseMs = fixedStart.getTime() - flexibleStart.getTime();
	const beforePauseSec = Math.max(0, Math.floor(beforePauseMs / 1000));
	const remainingSec = Math.max(0, flexibleTask.plannedDurationSec - beforePauseSec);

	return {
		beforePauseSec,
		remainingSec
	};
}

/**
 * Detect conflicts between fixed tasks.
 *
 * Two fixed tasks conflict when their time ranges overlap.
 *
 * @param tasks - Array of confirmed tasks (filters to fixed only)
 * @returns Array of detected conflicts
 *
 * @example
 * ```ts
 * const conflicts = detectFixedTaskConflicts(tasks);
 * conflicts.forEach(c => {
 *   console.warn(`Conflict: ${c.message}`);
 * });
 * ```
 */
export function detectFixedTaskConflicts(
	tasks: ConfirmedTask[]
): FixedTaskConflict[] {
	const conflicts: FixedTaskConflict[] = [];

	// Filter to fixed tasks only
	const fixedTasks = tasks.filter((t) => t.type === 'fixed');

	// Check each pair of fixed tasks for overlap
	for (let i = 0; i < fixedTasks.length; i++) {
		for (let j = i + 1; j < fixedTasks.length; j++) {
			const task1 = fixedTasks[i];
			const task2 = fixedTasks[j];

			const start1 = task1.plannedStart.getTime();
			const end1 = start1 + task1.plannedDurationSec * 1000;
			const start2 = task2.plannedStart.getTime();
			const end2 = start2 + task2.plannedDurationSec * 1000;

			// Check for overlap
			const overlapStart = Math.max(start1, start2);
			const overlapEnd = Math.min(end1, end2);

			if (overlapStart < overlapEnd) {
				const overlapMs = overlapEnd - overlapStart;
				const overlapSec = Math.floor(overlapMs / 1000);

				conflicts.push({
					taskId1: task1.taskId,
					taskId2: task2.taskId,
					overlapSec,
					message: `"${task1.name}" overlaps with "${task2.name}" by ${Math.floor(overlapSec / 60)} minutes`
				});
			}
		}
	}

	return conflicts;
}

// =============================================================================
// Main Calculation Function
// =============================================================================

/**
 * Calculate the complete schedule with automatic start times.
 *
 * This is the main entry point for schedule calculation. It:
 * 1. Sorts tasks by their sort order
 * 2. Calculates start times sequentially from the schedule start time
 * 3. Respects fixed task constraints (fixed tasks wait for their scheduled time)
 * 4. Detects task interruptions when fixed tasks overlap flexible tasks
 * 5. Detects schedule overflow (past midnight)
 * 6. Detects conflicts between fixed tasks
 *
 * @param tasks - Array of confirmed tasks to schedule
 * @param config - Schedule configuration (start mode and time)
 * @returns Complete schedule result with calculated timings
 *
 * @example
 * ```ts
 * const result = calculateSchedule(tasks, {
 *   mode: 'custom',
 *   customStartTime: new Date('2025-12-26T09:30:00')
 * });
 *
 * result.scheduledTasks.forEach(st => {
 *   console.log(`${st.task.name}: ${st.calculatedStart} - ${st.calculatedEnd}`);
 * });
 * ```
 */
export function calculateSchedule(
	tasks: ConfirmedTask[],
	config: ScheduleConfig
): ScheduleResult {
	// Handle empty task list
	if (tasks.length === 0) {
		return {
			scheduledTasks: [],
			hasOverflow: false,
			scheduleEndTime: getScheduleStartTime(config),
			conflicts: []
		};
	}

	const scheduleStartTime = getScheduleStartTime(config);
	// Sort tasks chronologically by plannedStart, not by sortOrder
	// This ensures correct cursor positioning regardless of array order
	const sortedTasks = [...tasks].sort((a, b) => a.plannedStart.getTime() - b.plannedStart.getTime());
	const scheduledTasks: ScheduledTask[] = [];

	// Extract fixed tasks sorted by their planned start time for interruption detection
	const fixedTasks = tasks
		.filter((t) => t.type === 'fixed')
		.sort((a, b) => a.plannedStart.getTime() - b.plannedStart.getTime());

	// Build a list of blocked time periods from fixed tasks
	const blockedPeriods = fixedTasks.map((t) => ({
		start: t.plannedStart.getTime(),
		end: t.plannedStart.getTime() + t.plannedDurationSec * 1000
	}));

	// Track the current time cursor for flexible tasks only
	let cursor = scheduleStartTime.getTime();

	// Track the end times of fixed tasks we've encountered by sortOrder
	// This ensures flexible tasks wait for prior fixed tasks to complete
	let maxFixedEndTimeSoFar = scheduleStartTime.getTime();

	for (const task of sortedTasks) {
		let calculatedStart: Date;
		let calculatedEnd: Date;
		let isInterrupted = false;
		let pauseTime: Date | null = null;
		let durationBeforePauseSec = 0;
		let remainingDurationSec = 0;

		if (task.type === 'fixed') {
			// Fixed tasks ALWAYS use their planned start time
			const plannedStartMs = task.plannedStart.getTime();
			calculatedStart = new Date(plannedStartMs);
			calculatedEnd = new Date(plannedStartMs + task.plannedDurationSec * 1000);
			// Track the latest end time of fixed tasks we've processed
			maxFixedEndTimeSoFar = Math.max(maxFixedEndTimeSoFar, calculatedEnd.getTime());
			// NOTE: Fixed tasks do NOT advance the cursor - they're at fixed positions
		} else {
			// For flexible tasks, cursor should be at least after all prior fixed tasks
			cursor = Math.max(cursor, maxFixedEndTimeSoFar);

			// Also check if cursor is inside a blocked period (for any fixed task, not just prior ones)
			// If so, move cursor to after that blocked period
			for (const blocked of blockedPeriods) {
				if (cursor >= blocked.start && cursor < blocked.end) {
					cursor = blocked.end;
				}
			}

			// Flexible tasks start at the cursor
			calculatedStart = new Date(cursor);
			const taskDurationMs = task.plannedDurationSec * 1000;
			const flexibleEndMs = cursor + taskDurationMs;

			// Check if any fixed task interrupts this flexible task
			for (const fixedTask of fixedTasks) {
				const fixedStartMs = fixedTask.plannedStart.getTime();
				const fixedEndMs = fixedStartMs + fixedTask.plannedDurationSec * 1000;

				// Check if fixed task starts during this flexible task's duration
				// (fixed task must start after flexible task starts AND before flexible task would end)
				if (fixedStartMs > cursor && fixedStartMs < flexibleEndMs) {
					// This flexible task will be interrupted
					isInterrupted = true;
					pauseTime = new Date(fixedStartMs);

					const split = calculateInterruptionSplit(
						task,
						calculatedStart,
						pauseTime
					);
					durationBeforePauseSec = split.beforePauseSec;
					remainingDurationSec = split.remainingSec;

					// The calculated end is after the fixed task ends + remaining time
					calculatedEnd = new Date(fixedEndMs + remainingDurationSec * 1000);

					// Update cursor to after this flexible task completes (including resumption)
					cursor = calculatedEnd.getTime();

					// Break after finding the first interrupting fixed task
					break;
				}
			}

			// No interruption - normal end time
			if (!isInterrupted) {
				calculatedEnd = new Date(flexibleEndMs);
				// Advance cursor to the end of this task
				cursor = calculatedEnd.getTime();
			}
		}

		scheduledTasks.push({
			task,
			calculatedStart,
			calculatedEnd: calculatedEnd!,
			isInterrupted,
			pauseTime,
			durationBeforePauseSec,
			remainingDurationSec
		});
	}

	// Find the actual schedule end time (latest end time of any task)
	const scheduleEndTime = new Date(
		Math.max(...scheduledTasks.map((st) => st.calculatedEnd.getTime()))
	);

	// Detect overflow and conflicts
	const overflow = hasScheduleOverflow(scheduleEndTime, scheduleStartTime);
	const conflicts = detectFixedTaskConflicts(tasks);

	return {
		scheduledTasks,
		hasOverflow: overflow,
		scheduleEndTime,
		conflicts
	};
}

// =============================================================================
// Debounced Calculation
// =============================================================================

/** Stores the timeout ID for debouncing */
let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Recalculate schedule with debouncing.
 *
 * Wraps calculateSchedule with a 300ms debounce to prevent
 * excessive recalculation during rapid edits.
 *
 * @param tasks - Array of confirmed tasks to schedule
 * @param config - Schedule configuration
 * @param callback - Function to call with result after debounce
 * @returns Cleanup function to cancel pending calculation
 *
 * @example
 * ```ts
 * // In a Svelte component
 * $effect(() => {
 *   const cancel = calculateScheduleDebounced(tasks, config, (result) => {
 *     scheduledTasks = result.scheduledTasks;
 *   });
 *   return cancel;
 * });
 * ```
 */
export function calculateScheduleDebounced(
	tasks: ConfirmedTask[],
	config: ScheduleConfig,
	callback: (result: ScheduleResult) => void
): () => void {
	// Cancel any pending calculation
	if (debounceTimeoutId !== null) {
		clearTimeout(debounceTimeoutId);
	}

	// Schedule new calculation after delay
	debounceTimeoutId = setTimeout(() => {
		const result = calculateSchedule(tasks, config);
		callback(result);
		debounceTimeoutId = null;
	}, DEBOUNCE_DELAY_MS);

	// Return cancel function
	return () => {
		if (debounceTimeoutId !== null) {
			clearTimeout(debounceTimeoutId);
			debounceTimeoutId = null;
		}
	};
}
