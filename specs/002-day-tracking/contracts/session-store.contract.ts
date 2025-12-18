/**
 * Session Store Contract
 *
 * Feature: 002-day-tracking
 * Purpose: Define the public interface for the day session store
 *
 * This contract file specifies WHAT the session store does, not HOW.
 * Implementation tests should verify these contracts are met.
 */

import type {
	DaySession,
	TaskProgress,
	ConfirmedTask,
	DaySummary,
	FixedTaskWarning,
	SessionStatus
} from '$lib/types';

// =============================================================================
// Store Interface
// =============================================================================

/**
 * Session store manages the complete state of a day's schedule execution.
 *
 * @example
 * ```svelte
 * <script>
 *   import { sessionStore } from '$lib/stores/sessionStore.svelte';
 *
 *   // Access reactive state
 *   const currentTask = $derived(sessionStore.currentTask);
 *   const lagSec = $derived(sessionStore.lagSec);
 *   const warning = $derived(sessionStore.fixedTaskWarning);
 * </script>
 * ```
 */
export interface SessionStoreContract {
	// -------------------------------------------------------------------------
	// Readable State
	// -------------------------------------------------------------------------

	/**
	 * Current session status.
	 * @readonly
	 */
	readonly status: SessionStatus;

	/**
	 * Whether a session is currently active (running or paused).
	 * @readonly
	 */
	readonly isActive: boolean;

	/**
	 * The currently active task, or null if no task is active.
	 * @readonly
	 */
	readonly currentTask: ConfirmedTask | null;

	/**
	 * Progress record for the current task.
	 * @readonly
	 */
	readonly currentProgress: TaskProgress | null;

	/**
	 * Index of current task in the schedule (0-based).
	 * @readonly
	 */
	readonly currentTaskIndex: number;

	/**
	 * Total number of tasks in the schedule.
	 * @readonly
	 */
	readonly totalTasks: number;

	/**
	 * Cumulative lag in seconds.
	 * Negative = ahead of schedule, Positive = behind schedule.
	 * @readonly
	 */
	readonly lagSec: number;

	/**
	 * Human-readable lag description.
	 * Examples: "5 min ahead", "On schedule", "12 min behind"
	 * @readonly
	 */
	readonly lagDisplay: string;

	/**
	 * Warning if current pace conflicts with upcoming fixed task.
	 * Null if no conflict detected.
	 * @readonly
	 */
	readonly fixedTaskWarning: FixedTaskWarning | null;

	/**
	 * All task progress records.
	 * @readonly
	 */
	readonly taskProgress: readonly TaskProgress[];

	/**
	 * Complete session state for persistence.
	 * @readonly
	 */
	readonly session: DaySession | null;

	// -------------------------------------------------------------------------
	// Actions
	// -------------------------------------------------------------------------

	/**
	 * Start a new day tracking session.
	 *
	 * @param tasks - Confirmed tasks from the schedule
	 * @throws Error if tasks array is empty
	 * @throws Error if a session is already active
	 *
	 * @example
	 * ```typescript
	 * const tasks = scheduleStore.confirmedTasks;
	 * sessionStore.startDay(tasks);
	 * ```
	 */
	startDay(tasks: ConfirmedTask[]): void;

	/**
	 * Complete the current task and advance to the next.
	 *
	 * @param actualDurationSec - Actual time spent on task in seconds
	 * @throws Error if no task is active
	 *
	 * @example
	 * ```typescript
	 * const elapsed = timerStore.stop();
	 * sessionStore.completeTask(elapsed / 1000);
	 * ```
	 */
	completeTask(actualDurationSec: number): void;

	/**
	 * Mark a fixed task as missed (when its start time has passed).
	 *
	 * @param taskId - ID of the missed task
	 *
	 * @example
	 * ```typescript
	 * // Check for missed fixed tasks on session start
	 * for (const task of tasks) {
	 *   if (task.type === 'fixed' && new Date(task.plannedStart) < new Date()) {
	 *     sessionStore.markMissed(task.taskId);
	 *   }
	 * }
	 * ```
	 */
	markMissed(taskId: string): void;

	/**
	 * End the current session and generate summary.
	 *
	 * @returns Summary statistics for the day
	 *
	 * @example
	 * ```typescript
	 * const summary = sessionStore.endDay();
	 * console.log(`Finished ${summary.totalActualSec / 60} minutes of work`);
	 * ```
	 */
	endDay(): DaySummary;

	/**
	 * Restore session from persisted state.
	 * Called on app initialization.
	 *
	 * @param session - Previously saved session state
	 * @param tasks - Confirmed tasks for reference
	 *
	 * @example
	 * ```typescript
	 * const savedSession = storage.getSession();
	 * if (savedSession) {
	 *   sessionStore.restore(savedSession, scheduleStore.confirmedTasks);
	 * }
	 * ```
	 */
	restore(session: DaySession, tasks: ConfirmedTask[]): void;

	/**
	 * Clear all session state.
	 * Called when starting a new day or clearing data.
	 */
	reset(): void;
}

// =============================================================================
// Behavioral Contracts
// =============================================================================

/**
 * Contract: Session persists on state change
 *
 * The session store MUST trigger persistence to localStorage
 * whenever significant state changes occur.
 *
 * @test
 * ```typescript
 * const persistSpy = vi.spyOn(storage, 'saveSession');
 *
 * sessionStore.startDay(tasks);
 * expect(persistSpy).toHaveBeenCalledTimes(1);
 *
 * sessionStore.completeTask(1800);
 * expect(persistSpy).toHaveBeenCalledTimes(2);
 * ```
 */
export const CONTRACT_PERSISTS_ON_CHANGE = 'session-persists-on-change';

/**
 * Contract: Lag calculation accuracy
 *
 * Lag MUST equal sum of (actualDuration - plannedDuration) for completed tasks.
 *
 * @test
 * ```typescript
 * sessionStore.startDay([
 *   { plannedDurationSec: 1800, ... }, // 30 min
 *   { plannedDurationSec: 1800, ... }, // 30 min
 * ]);
 *
 * // Complete first task in 25 min (5 min ahead)
 * sessionStore.completeTask(1500);
 * expect(sessionStore.lagSec).toBe(-300); // 5 min ahead
 *
 * // Complete second task in 40 min (10 min behind)
 * sessionStore.completeTask(2400);
 * expect(sessionStore.lagSec).toBe(300); // Net 5 min behind
 * ```
 */
export const CONTRACT_LAG_ACCURACY = 'session-lag-accuracy';

/**
 * Contract: Auto-advance to next task
 *
 * When a task is completed, the session MUST automatically
 * activate the next pending task.
 *
 * @test
 * ```typescript
 * sessionStore.startDay([task1, task2, task3]);
 *
 * expect(sessionStore.currentTaskIndex).toBe(0);
 * expect(sessionStore.currentTask).toBe(task1);
 *
 * sessionStore.completeTask(1800);
 *
 * expect(sessionStore.currentTaskIndex).toBe(1);
 * expect(sessionStore.currentTask).toBe(task2);
 * ```
 */
export const CONTRACT_AUTO_ADVANCE = 'session-auto-advance';

/**
 * Contract: Fixed task warning detection
 *
 * Session MUST detect and warn when current pace will cause
 * a conflict with an upcoming fixed task.
 *
 * @test
 * ```typescript
 * const flexTask = { type: 'flexible', plannedDurationSec: 1800, ... };
 * const fixedTask = {
 *   type: 'fixed',
 *   plannedStart: new Date(Date.now() + 1800000), // 30 min from now
 *   plannedDurationSec: 3600,
 *   ...
 * };
 *
 * sessionStore.startDay([flexTask, fixedTask]);
 *
 * // If we're already 35 min into a 30 min flexible task
 * // we'll be 5 min late for the fixed task
 * sessionStore.updateElapsed(2100000); // 35 min
 *
 * expect(sessionStore.fixedTaskWarning).not.toBeNull();
 * expect(sessionStore.fixedTaskWarning.minutesLate).toBe(5);
 * ```
 */
export const CONTRACT_FIXED_TASK_WARNING = 'session-fixed-task-warning';

/**
 * Contract: Session completes when all tasks done
 *
 * When the last task is completed, session status MUST
 * change to 'complete'.
 *
 * @test
 * ```typescript
 * sessionStore.startDay([task1, task2]);
 *
 * sessionStore.completeTask(1800);
 * expect(sessionStore.status).toBe('running');
 *
 * sessionStore.completeTask(1800);
 * expect(sessionStore.status).toBe('complete');
 * ```
 */
export const CONTRACT_SESSION_COMPLETION = 'session-completion';

/**
 * Contract: Missed task handling
 *
 * When a fixed task's start time has passed, it MUST be
 * marked as 'missed' and skipped.
 *
 * @test
 * ```typescript
 * const missedTask = {
 *   type: 'fixed',
 *   plannedStart: new Date(Date.now() - 3600000), // 1 hour ago
 *   ...
 * };
 *
 * sessionStore.startDay([missedTask, nextTask]);
 * sessionStore.markMissed(missedTask.taskId);
 *
 * expect(sessionStore.taskProgress[0].status).toBe('missed');
 * expect(sessionStore.currentTask).toBe(nextTask);
 * ```
 */
export const CONTRACT_MISSED_TASK_HANDLING = 'session-missed-task';

/**
 * Contract: Day summary accuracy
 *
 * The day summary MUST accurately reflect all completed,
 * missed, and on-time tasks.
 *
 * @test
 * ```typescript
 * sessionStore.startDay([
 *   { plannedDurationSec: 1800, ... }, // Task 1
 *   { plannedDurationSec: 1800, ... }, // Task 2
 *   { plannedDurationSec: 1800, ... }, // Task 3
 * ]);
 *
 * sessionStore.completeTask(1800); // On time
 * sessionStore.completeTask(2100); // 5 min late
 * sessionStore.markMissed(task3.taskId);
 *
 * const summary = sessionStore.endDay();
 *
 * expect(summary.tasksOnTime).toBe(1);
 * expect(summary.tasksLate).toBe(1);
 * expect(summary.tasksMissed).toBe(1);
 * expect(summary.totalPlannedSec).toBe(5400);
 * expect(summary.totalActualSec).toBe(3900);
 * ```
 */
export const CONTRACT_SUMMARY_ACCURACY = 'session-summary-accuracy';

// =============================================================================
// Lag Display Formatting
// =============================================================================

/**
 * Contract: Lag display formatting
 *
 * lagDisplay MUST follow these formats:
 * - "On schedule" when lagSec is 0
 * - "X min ahead" when lagSec is negative
 * - "X min behind" when lagSec is positive
 * - "X hr Y min ahead/behind" when |lagSec| >= 3600
 *
 * @test
 * ```typescript
 * // On schedule
 * sessionStore.setLag(0);
 * expect(sessionStore.lagDisplay).toBe('On schedule');
 *
 * // Minutes ahead
 * sessionStore.setLag(-300);
 * expect(sessionStore.lagDisplay).toBe('5 min ahead');
 *
 * // Minutes behind
 * sessionStore.setLag(600);
 * expect(sessionStore.lagDisplay).toBe('10 min behind');
 *
 * // Hours ahead
 * sessionStore.setLag(-3900);
 * expect(sessionStore.lagDisplay).toBe('1 hr 5 min ahead');
 * ```
 */
export const CONTRACT_LAG_DISPLAY_FORMAT = 'session-lag-display-format';
