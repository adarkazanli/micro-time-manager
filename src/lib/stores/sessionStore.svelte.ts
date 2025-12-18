/**
 * Session Store
 *
 * Feature: 002-day-tracking
 * Task: T015 - Create sessionStore with startDay() method
 *
 * Manages the complete state of a day's schedule execution.
 * Uses Svelte 5 runes for reactive state management.
 */

import type {
	DaySession,
	TaskProgress,
	ConfirmedTask,
	DaySummary,
	FixedTaskWarning,
	SessionStatus,
	ProgressStatus
} from '$lib/types';
import { storage } from '$lib/services/storage';

// =============================================================================
// State
// =============================================================================

let session = $state<DaySession | null>(null);
let tasks = $state<ConfirmedTask[]>([]);

// =============================================================================
// Derived State
// =============================================================================

const statusValue = $derived<SessionStatus>(session?.status ?? 'idle');

const isActiveValue = $derived(session !== null && session.status === 'running');

const currentTaskIndexValue = $derived(session?.currentTaskIndex ?? -1);

const totalTasksValue = $derived(tasks.length);

const taskProgressValue = $derived<readonly TaskProgress[]>(session?.taskProgress ?? []);

const lagSecValue = $derived(session?.totalLagSec ?? 0);

const currentTaskValue = $derived.by<ConfirmedTask | null>(() => {
	const index = session?.currentTaskIndex ?? -1;
	if (index < 0 || index >= tasks.length) return null;
	return tasks[index];
});

const currentProgressValue = $derived.by<TaskProgress | null>(() => {
	const index = session?.currentTaskIndex ?? -1;
	const progress = session?.taskProgress ?? [];
	if (index < 0 || index >= progress.length) return null;
	return progress[index];
});

const lagDisplayValue = $derived.by(() => {
	const lag = session?.totalLagSec ?? 0;
	return formatLag(lag);
});

/**
 * Detect if current pace will miss a fixed task
 *
 * Feature: 002-day-tracking
 * Task: T043 - Add fixedTaskWarning derivation
 */
const fixedTaskWarningValue = $derived.by<FixedTaskWarning | null>(() => {
	// No warning if no session or not running
	if (!session || session.status !== 'running') return null;

	const currentIndex = session.currentTaskIndex;
	const lagSec = session.totalLagSec;

	// No warning if on schedule or ahead
	if (lagSec <= 0) return null;

	// Look for upcoming fixed tasks (after current task)
	for (let i = currentIndex + 1; i < tasks.length; i++) {
		const task = tasks[i];
		if (task.type === 'fixed') {
			// Calculate minutes late based on current lag
			const minutesLate = Math.ceil(lagSec / 60);

			return {
				taskId: task.taskId,
				taskName: task.name,
				minutesLate,
				plannedStart: task.plannedStart.toISOString()
			};
		}
	}

	return null;
});

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

/**
 * Format lag seconds as human-readable string
 */
function formatLag(lagSec: number): string {
	if (lagSec === 0) return 'On schedule';

	const absLag = Math.abs(lagSec);
	const hours = Math.floor(absLag / 3600);
	const minutes = Math.floor((absLag % 3600) / 60);
	const direction = lagSec < 0 ? 'ahead' : 'behind';

	if (hours > 0) {
		return `${hours} hr ${minutes} min ${direction}`;
	}
	return `${minutes} min ${direction}`;
}

/**
 * Create initial task progress records
 */
function createTaskProgress(confirmedTasks: ConfirmedTask[]): TaskProgress[] {
	return confirmedTasks.map((task, index) => ({
		taskId: task.taskId,
		plannedDurationSec: task.plannedDurationSec,
		actualDurationSec: 0,
		completedAt: null,
		status: (index === 0 ? 'active' : 'pending') as ProgressStatus
	}));
}

// =============================================================================
// Store Implementation
// =============================================================================

function createSessionStore() {
	return {
		// -------------------------------------------------------------------------
		// Readable State (getters)
		// -------------------------------------------------------------------------

		get status(): SessionStatus {
			return statusValue;
		},

		get isActive(): boolean {
			return isActiveValue;
		},

		get currentTask(): ConfirmedTask | null {
			return currentTaskValue;
		},

		get currentProgress(): TaskProgress | null {
			return currentProgressValue;
		},

		get currentTaskIndex(): number {
			return currentTaskIndexValue;
		},

		get totalTasks(): number {
			return totalTasksValue;
		},

		get lagSec(): number {
			return lagSecValue;
		},

		get lagDisplay(): string {
			return lagDisplayValue;
		},

		get fixedTaskWarning(): FixedTaskWarning | null {
			return fixedTaskWarningValue;
		},

		get taskProgress(): readonly TaskProgress[] {
			return taskProgressValue;
		},

		get session(): DaySession | null {
			return session;
		},

		// -------------------------------------------------------------------------
		// Actions
		// -------------------------------------------------------------------------

		/**
		 * Start a new day tracking session.
		 *
		 * @param confirmedTasks - Confirmed tasks from the schedule
		 * @throws Error if tasks array is empty
		 * @throws Error if a session is already active
		 */
		startDay(confirmedTasks: ConfirmedTask[]): void {
			if (confirmedTasks.length === 0) {
				throw new Error('Cannot start day with no tasks');
			}

			if (session !== null && session.status === 'running') {
				throw new Error('Session already active');
			}

			// Store tasks reference
			tasks = confirmedTasks;

			// Create new session
			const newSession: DaySession = {
				sessionId: generateUUID(),
				startedAt: new Date().toISOString(),
				endedAt: null,
				status: 'running',
				currentTaskIndex: 0,
				currentTaskElapsedMs: 0,
				lastPersistedAt: Date.now(),
				totalLagSec: 0,
				taskProgress: createTaskProgress(confirmedTasks)
			};

			session = newSession;

			// Persist to storage
			storage.saveSession(newSession);
		},

		/**
		 * Complete the current task and advance to the next.
		 *
		 * @param actualDurationSec - Actual time spent on task in seconds
		 * @throws Error if no task is active
		 */
		completeTask(actualDurationSec: number): void {
			if (!session || session.status !== 'running') {
				throw new Error('No active session');
			}

			const currentIndex = session.currentTaskIndex;
			const progress = [...session.taskProgress];

			// Update current task progress
			const currentProgress = progress[currentIndex];
			const plannedDuration = currentProgress.plannedDurationSec;
			const lag = actualDurationSec - plannedDuration;

			progress[currentIndex] = {
				...currentProgress,
				actualDurationSec,
				completedAt: new Date().toISOString(),
				status: 'complete' as ProgressStatus
			};

			// Calculate new total lag
			const newLag = session.totalLagSec + lag;

			// Check if there are more tasks
			const nextIndex = currentIndex + 1;
			const isComplete = nextIndex >= tasks.length;

			if (isComplete) {
				// Session complete
				session = {
					...session,
					status: 'complete',
					endedAt: new Date().toISOString(),
					currentTaskIndex: currentIndex,
					currentTaskElapsedMs: 0,
					lastPersistedAt: Date.now(),
					totalLagSec: newLag,
					taskProgress: progress
				};
			} else {
				// Advance to next task
				progress[nextIndex] = {
					...progress[nextIndex],
					status: 'active' as ProgressStatus
				};

				session = {
					...session,
					currentTaskIndex: nextIndex,
					currentTaskElapsedMs: 0,
					lastPersistedAt: Date.now(),
					totalLagSec: newLag,
					taskProgress: progress
				};
			}

			// Persist to storage
			storage.saveSession(session);
		},

		/**
		 * Mark a fixed task as missed.
		 *
		 * @param taskId - ID of the missed task
		 */
		markMissed(taskId: string): void {
			if (!session) return;

			const progress = [...session.taskProgress];
			const index = progress.findIndex((p) => p.taskId === taskId);

			if (index === -1) return;

			progress[index] = {
				...progress[index],
				status: 'missed' as ProgressStatus,
				completedAt: new Date().toISOString()
			};

			// If this was the current task, advance to next
			let nextIndex = session.currentTaskIndex;
			if (index === nextIndex) {
				// Find next non-missed task
				for (let i = nextIndex + 1; i < progress.length; i++) {
					if (progress[i].status !== 'missed') {
						progress[i] = {
							...progress[i],
							status: 'active' as ProgressStatus
						};
						nextIndex = i;
						break;
					}
				}
			}

			session = {
				...session,
				currentTaskIndex: nextIndex,
				lastPersistedAt: Date.now(),
				taskProgress: progress
			};

			storage.saveSession(session);
		},

		/**
		 * End the current session and generate summary.
		 *
		 * @returns Summary statistics for the day
		 */
		endDay(): DaySummary {
			if (!session) {
				throw new Error('No session to end');
			}

			const progress = session.taskProgress;

			let totalPlannedSec = 0;
			let totalActualSec = 0;
			let tasksOnTime = 0;
			let tasksLate = 0;
			let tasksMissed = 0;

			for (const p of progress) {
				totalPlannedSec += p.plannedDurationSec;

				if (p.status === 'complete') {
					totalActualSec += p.actualDurationSec;
					if (p.actualDurationSec <= p.plannedDurationSec) {
						tasksOnTime++;
					} else {
						tasksLate++;
					}
				} else if (p.status === 'missed') {
					tasksMissed++;
				}
			}

			const startedAt = new Date(session.startedAt).getTime();
			const endedAt = session.endedAt
				? new Date(session.endedAt).getTime()
				: Date.now();
			const sessionDurationSec = Math.floor((endedAt - startedAt) / 1000);

			// Mark session as complete
			session = {
				...session,
				status: 'complete',
				endedAt: new Date().toISOString()
			};

			storage.saveSession(session);

			return {
				totalPlannedSec,
				totalActualSec,
				finalLagSec: totalActualSec - totalPlannedSec,
				tasksOnTime,
				tasksLate,
				tasksMissed,
				sessionDurationSec
			};
		},

		/**
		 * Restore session from persisted state.
		 *
		 * @param savedSession - Previously saved session state
		 * @param confirmedTasks - Confirmed tasks for reference
		 */
		restore(savedSession: DaySession, confirmedTasks: ConfirmedTask[]): void {
			tasks = confirmedTasks;
			session = savedSession;
		},

		/**
		 * Clear all session state.
		 */
		reset(): void {
			session = null;
			tasks = [];
			storage.clearSession();
		},

		/**
		 * Reorder tasks in the schedule.
		 *
		 * Feature: 003-impact-panel
		 * Tasks: T039-T043 - Add reorderTasks action
		 *
		 * Validation rules:
		 * - Cannot move fixed tasks
		 * - Cannot move completed tasks
		 * - Cannot move the current task
		 * - Target position must be after current task
		 *
		 * @param fromIndex - Index of task to move
		 * @param toIndex - Target position
		 * @returns true if reorder succeeded, false if validation failed
		 */
		reorderTasks(fromIndex: number, toIndex: number): boolean {
			if (!session || session.status !== 'running') {
				return false;
			}

			// Validate indices (toIndex can equal tasks.length to move to end)
			if (
				fromIndex < 0 ||
				fromIndex >= tasks.length ||
				toIndex < 0 ||
				toIndex > tasks.length
			) {
				return false;
			}

			// Same position - no change needed
			if (fromIndex === toIndex) {
				return true;
			}

			const taskToMove = tasks[fromIndex];
			const progressToMove = session.taskProgress[fromIndex];
			const currentIndex = session.currentTaskIndex;

			// T040: Cannot move fixed tasks
			if (taskToMove.type === 'fixed') {
				return false;
			}

			// T041: Cannot move completed tasks
			if (
				progressToMove.status === 'complete' ||
				progressToMove.status === 'missed'
			) {
				return false;
			}

			// T042: Cannot move current task
			if (fromIndex === currentIndex) {
				return false;
			}

			// Cannot move to a position before or at current task
			if (toIndex <= currentIndex) {
				return false;
			}

			// Cannot move from before current task
			if (fromIndex <= currentIndex) {
				return false;
			}

			// Perform the reorder
			const newTasks = [...tasks];
			const newProgress = [...session.taskProgress];

			// Remove from old position
			const [movedTask] = newTasks.splice(fromIndex, 1);
			const [movedProgress] = newProgress.splice(fromIndex, 1);

			// Adjust target index if moving forward
			const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

			// Insert at new position
			newTasks.splice(adjustedToIndex, 0, movedTask);
			newProgress.splice(adjustedToIndex, 0, movedProgress);

			// T043: Update sortOrder fields
			for (let i = 0; i < newTasks.length; i++) {
				newTasks[i] = {
					...newTasks[i],
					sortOrder: i
				};
			}

			// Update state
			tasks = newTasks;
			session = {
				...session,
				taskProgress: newProgress,
				lastPersistedAt: Date.now()
			};

			// Persist changes (T056 will be handled by calling code)
			storage.saveSession(session);
			storage.saveTasks(newTasks);

			return true;
		}
	};
}

/**
 * The session store singleton
 */
export const sessionStore = createSessionStore();
