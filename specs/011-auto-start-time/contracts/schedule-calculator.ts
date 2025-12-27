/**
 * Schedule Calculator Service Contract
 *
 * Feature: 011-auto-start-time
 * Date: 2025-12-26
 *
 * This file defines the public API contract for the schedule calculator service.
 * It specifies the function signatures, input/output types, and expected behavior.
 */

import type {
	ConfirmedTask,
	ScheduleConfig,
	ScheduleResult,
	FixedTaskConflict
} from '$lib/types';

// =============================================================================
// Service Functions
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
): ScheduleResult;

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
export function getScheduleStartTime(config: ScheduleConfig): Date;

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
): boolean;

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
): FixedTaskConflict[];

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
};

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
): () => void;

// =============================================================================
// Behavior Specification
// =============================================================================

/**
 * ## Algorithm Specification
 *
 * The schedule calculator uses a single-pass O(n) algorithm:
 *
 * 1. **Initialization**:
 *    - Set cursor to schedule start time
 *    - Sort tasks by sortOrder
 *
 * 2. **For each task in order**:
 *    a. If task is fixed:
 *       - Set calculatedStart = max(cursor, task.plannedStart)
 *       - If cursor > task.plannedStart, task is running late
 *    b. If task is flexible:
 *       - Set calculatedStart = cursor
 *       - Check if any fixed task starts before this task would end
 *       - If yes, mark as interrupted and calculate split
 *
 *    c. Set calculatedEnd = calculatedStart + duration
 *    d. Advance cursor to calculatedEnd
 *
 * 3. **Post-processing**:
 *    - Check for midnight overflow
 *    - Detect fixed task conflicts
 *
 * ## Edge Cases
 *
 * - **Empty task list**: Returns empty scheduledTasks, hasOverflow=false
 * - **All fixed tasks**: Each uses its planned time, no interruptions possible
 * - **Fixed task in past**: Treated as starting immediately (cursor)
 * - **Zero duration task**: Valid, acts as milestone
 * - **Consecutive fixed tasks**: Each respects its scheduled time
 *
 * ## Performance
 *
 * - Time complexity: O(n) where n = number of tasks
 * - Space complexity: O(n) for result array
 * - Recalculation debounced to 300ms
 */
