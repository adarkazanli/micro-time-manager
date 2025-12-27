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
	ProgressStatus,
	TaskType,
	ScheduleConfig
} from '$lib/types';
import { storage } from '$lib/services/storage';
import { calculateProjectedStart } from '$lib/services/projection';

// =============================================================================
// Types
// =============================================================================

/**
 * Input for creating an ad-hoc task.
 *
 * Feature: 009-ad-hoc-tasks
 * Task: T007 - Add AddTaskInput type definition
 */
export interface AddTaskInput {
	/** Task name (1-200 characters, will be trimmed) */
	name: string;
	/** Duration in seconds (1-86400) */
	durationSec: number;
	/** Task type */
	type: TaskType;
	/** Start time (required for fixed tasks) */
	startTime?: Date;
}

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
 * Calculate fixed task warning based on projected timing.
 *
 * Feature: 002-day-tracking
 * Task: T043 - Add fixedTaskWarning derivation
 *
 * Uses projection service to accurately calculate when we'll reach
 * a fixed task based on current elapsed time, not cumulative lag.
 *
 * @param elapsedMs - Milliseconds elapsed on current task
 * @returns Warning info if a fixed task will be late, null otherwise
 */
function calculateFixedTaskWarning(elapsedMs: number): FixedTaskWarning | null {
	// No warning if no session or not running
	if (!session || session.status !== 'running') return null;

	const currentIndex = session.currentTaskIndex;

	// Look for upcoming fixed tasks (after current task)
	for (let i = currentIndex + 1; i < tasks.length; i++) {
		const task = tasks[i];
		if (task.type === 'fixed') {
			// Calculate projected start using projection service
			const projectedStart = calculateProjectedStart(tasks, currentIndex, elapsedMs, i, Date.now());
			const scheduledStart = task.plannedStart;

			// Calculate how late we'll be (negative = early)
			const bufferMs = scheduledStart.getTime() - projectedStart.getTime();
			const minutesLate = Math.ceil(-bufferMs / 60000); // Convert to minutes, negative buffer = late

			// Only warn if we'll actually be late
			if (minutesLate <= 0) return null;

			return {
				taskId: task.taskId,
				taskName: task.name,
				minutesLate,
				plannedStart: task.plannedStart.toISOString()
			};
		}
	}

	return null;
}

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

		/**
		 * Get fixed task warning based on current elapsed time.
		 *
		 * @param elapsedMs - Milliseconds elapsed on current task (from timerStore)
		 * @returns Warning info if a fixed task will be late, null otherwise
		 */
		getFixedTaskWarning(elapsedMs: number): FixedTaskWarning | null {
			return calculateFixedTaskWarning(elapsedMs);
		},

		get taskProgress(): readonly TaskProgress[] {
			return taskProgressValue;
		},

		get session(): DaySession | null {
			return session;
		},

		/**
		 * Get the current schedule configuration.
		 *
		 * Feature: 011-auto-start-time
		 * Task: T031 - Add getScheduleConfig() method
		 *
		 * @returns The schedule config from the current session, or a default config if no session
		 */
		getScheduleConfig(): ScheduleConfig {
			return session?.scheduleConfig ?? { mode: 'now', customStartTime: null };
		},

		/**
		 * Set the schedule configuration.
		 *
		 * Feature: 011-auto-start-time
		 * Task: T032 - Add setScheduleConfig() method
		 *
		 * Updates the scheduleConfig on the current session and persists it.
		 * If no session exists, this is a no-op.
		 *
		 * @param config - The new schedule configuration
		 */
		setScheduleConfig(config: ScheduleConfig): void {
			if (!session) {
				return;
			}

			session = {
				...session,
				scheduleConfig: config,
				lastPersistedAt: Date.now()
			};

			storage.saveSession(session);
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
			// T020: Set timerStartedAtMs for timer persistence
			const newSession: DaySession = {
				sessionId: generateUUID(),
				startedAt: new Date().toISOString(),
				endedAt: null,
				status: 'running',
				currentTaskIndex: 0,
				currentTaskElapsedMs: 0,
				lastPersistedAt: Date.now(),
				totalLagSec: 0,
				taskProgress: createTaskProgress(confirmedTasks),
				timerStartedAtMs: Date.now()
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
					taskProgress: progress,
					timerStartedAtMs: 0 // T021: Clear timer start timestamp
				};
			} else {
				// Advance to next task
				progress[nextIndex] = {
					...progress[nextIndex],
					status: 'active' as ProgressStatus
				};

				// T021: Reset timerStartedAtMs for new task
				session = {
					...session,
					currentTaskIndex: nextIndex,
					currentTaskElapsedMs: 0,
					lastPersistedAt: Date.now(),
					totalLagSec: newLag,
					taskProgress: progress,
					timerStartedAtMs: Date.now()
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
		 * Get the current tasks array.
		 */
		get tasks(): ConfirmedTask[] {
			return tasks;
		},

		/**
		 * Update a task's properties.
		 *
		 * Feature: 003-impact-panel
		 *
		 * Allows editing task name, planned start time, duration, and type.
		 * Updates both the tasks array and the corresponding progress record.
		 *
		 * @param taskId - ID of task to update
		 * @param updates - Partial task properties to update
		 * @returns true if update succeeded, false if task not found
		 */
		updateTask(
			taskId: string,
			updates: Partial<Pick<ConfirmedTask, 'name' | 'plannedStart' | 'plannedDurationSec' | 'type'>>
		): boolean {
			const taskIndex = tasks.findIndex((t) => t.taskId === taskId);
			if (taskIndex === -1) {
				return false;
			}

			// Update the task
			const updatedTask = {
				...tasks[taskIndex],
				...updates
			};

			const newTasks = [...tasks];
			newTasks[taskIndex] = updatedTask;
			tasks = newTasks;

			// Update progress record if duration changed
			if (session && updates.plannedDurationSec !== undefined) {
				const newProgress = [...session.taskProgress];
				const progressIndex = newProgress.findIndex((p) => p.taskId === taskId);
				if (progressIndex !== -1) {
					newProgress[progressIndex] = {
						...newProgress[progressIndex],
						plannedDurationSec: updates.plannedDurationSec
					};
					session = {
						...session,
						taskProgress: newProgress,
						lastPersistedAt: Date.now()
					};
					storage.saveSession(session);
				}
			}

			// Persist tasks
			storage.saveTasks(newTasks);

			return true;
		},

		/**
		 * Add an ad-hoc task to the current session.
		 *
		 * Feature: 009-ad-hoc-tasks
		 * Tasks: T008-T012 - Implement addTask() method
		 *
		 * Creates a new task with `isAdHoc: true` flag and inserts it at the
		 * appropriate position based on task type:
		 * - Fixed tasks: Inserted in chronological order by plannedStart
		 * - Flexible tasks: Inserted immediately after the current task
		 *
		 * @param input - Task creation input
		 * @returns The created ConfirmedTask, or null if session not active
		 * @throws Error if validation fails
		 */
		addTask(input: AddTaskInput): ConfirmedTask | null {
			// T008: Validation
			if (!session || session.status !== 'running') {
				return null;
			}

			const trimmedName = input.name.trim();
			if (!trimmedName) {
				throw new Error('Task name is required');
			}
			if (trimmedName.length > 200) {
				throw new Error('Task name too long');
			}
			if (input.durationSec <= 0) {
				throw new Error('Duration must be positive');
			}
			if (input.durationSec > 86400) {
				throw new Error('Duration exceeds maximum');
			}
			if (input.type === 'fixed' && !input.startTime) {
				throw new Error('Fixed tasks require start time');
			}

			// T009-T010: Determine insertion index
			let insertIndex: number;
			if (input.type === 'fixed' && input.startTime) {
				// Insert in chronological order based on plannedStart
				insertIndex = tasks.findIndex(
					(t) => t.plannedStart.getTime() > input.startTime!.getTime()
				);
				if (insertIndex === -1) {
					insertIndex = tasks.length;
				}
			} else {
				// Insert after current task
				insertIndex = session.currentTaskIndex + 1;
			}

			// Create the new task
			const newTask: ConfirmedTask = {
				taskId: generateUUID(),
				name: trimmedName,
				plannedStart: input.startTime ?? new Date(),
				plannedDurationSec: input.durationSec,
				type: input.type,
				sortOrder: insertIndex, // Will be recalculated
				status: 'pending',
				isAdHoc: true
			};

			// T011: Create corresponding TaskProgress record
			const newProgress: TaskProgress = {
				taskId: newTask.taskId,
				plannedDurationSec: input.durationSec,
				actualDurationSec: 0,
				completedAt: null,
				status: 'pending'
			};

			// Insert task and progress at the correct position
			const newTasks = [...tasks];
			const newProgressArr = [...session.taskProgress];
			newTasks.splice(insertIndex, 0, newTask);
			newProgressArr.splice(insertIndex, 0, newProgress);

			// Update sortOrder for all tasks
			for (let i = 0; i < newTasks.length; i++) {
				newTasks[i] = { ...newTasks[i], sortOrder: i };
			}

			// Update state
			tasks = newTasks;
			session = {
				...session,
				taskProgress: newProgressArr,
				lastPersistedAt: Date.now()
			};

			// T012: Persist to storage
			storage.saveTasks(newTasks);
			storage.saveSession(session);

			return newTask;
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

			// Cannot move from before current task (completed tasks)
			if (fromIndex < currentIndex) {
				return false;
			}

			// Cannot move to a position before current task (unless moving the current task itself)
			if (fromIndex !== currentIndex && toIndex <= currentIndex) {
				return false;
			}

			// If moving current task, it must go to a position after itself
			if (fromIndex === currentIndex && toIndex <= currentIndex) {
				return false;
			}

			// Perform the reorder
			const newTasks = [...tasks];
			const newProgress = [...session.taskProgress];

			// Track if we're moving the current task
			const isMovingCurrentTask = fromIndex === currentIndex;

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

			// Calculate new current task index
			let newCurrentIndex = currentIndex;
			if (isMovingCurrentTask) {
				// Current task moved to new position
				newCurrentIndex = adjustedToIndex;
			}

			// Update state
			tasks = newTasks;
			session = {
				...session,
				currentTaskIndex: newCurrentIndex,
				taskProgress: newProgress,
				lastPersistedAt: Date.now()
			};

			// Persist changes (T056 will be handled by calling code)
			storage.saveSession(session);
			storage.saveTasks(newTasks);

			return true;
		},

		/**
		 * Update a completed task's progress data.
		 *
		 * Feature: Task Correction
		 *
		 * Allows editing the actual duration of a completed task.
		 * Recalculates totalLagSec to reflect the change.
		 *
		 * @param taskId - ID of task to update
		 * @param updates - Progress properties to update
		 * @returns true if update succeeded, false if task not found or not complete
		 */
		updateTaskProgress(
			taskId: string,
			updates: { actualDurationSec: number }
		): boolean {
			if (!session) {
				return false;
			}

			const progressIndex = session.taskProgress.findIndex((p) => p.taskId === taskId);
			if (progressIndex === -1) {
				return false;
			}

			const oldProgress = session.taskProgress[progressIndex];

			// Only allow updating completed tasks
			if (oldProgress.status !== 'complete') {
				return false;
			}

			// Calculate lag difference: (newActual - oldActual)
			const lagDiff = updates.actualDurationSec - oldProgress.actualDurationSec;

			// Update progress record
			const newProgress = [...session.taskProgress];
			newProgress[progressIndex] = {
				...oldProgress,
				actualDurationSec: updates.actualDurationSec
			};

			// Adjust total lag
			session = {
				...session,
				totalLagSec: session.totalLagSec + lagDiff,
				taskProgress: newProgress,
				lastPersistedAt: Date.now()
			};

			// Persist changes
			storage.saveSession(session);

			return true;
		},

		/**
		 * Jump to a specific task, completing the current task.
		 *
		 * Feature: Task Correction
		 *
		 * Allows starting any pending task immediately:
		 * - Completes the current task with the given elapsed time
		 * - Sets the target task as the new current task
		 * - Intermediate tasks remain as 'pending' (can be done later)
		 *
		 * @param taskId - ID of task to jump to
		 * @param currentElapsedSec - Elapsed time on current task in seconds
		 * @returns true if jump succeeded, false if task not found or already complete
		 */
		jumpToTask(taskId: string, currentElapsedSec: number): boolean {
			if (!session || session.status !== 'running') {
				return false;
			}

			// Find the target task
			const targetIndex = tasks.findIndex((t) => t.taskId === taskId);
			if (targetIndex === -1) {
				return false;
			}

			const targetProgress = session.taskProgress[targetIndex];
			const currentIndex = session.currentTaskIndex;

			// Cannot jump to completed/missed tasks
			if (targetProgress.status === 'complete' || targetProgress.status === 'missed') {
				return false;
			}

			// If already on this task, nothing to do
			if (targetIndex === currentIndex) {
				return true;
			}

			// Note: We allow jumping to ANY pending task, including those with lower indices.
			// This supports the use case where a user skipped a task and wants to return to it later.

			// Complete the current task
			const newProgress = [...session.taskProgress];
			const currentProgress = newProgress[currentIndex];
			const plannedDuration = currentProgress.plannedDurationSec;
			const lag = currentElapsedSec - plannedDuration;

			newProgress[currentIndex] = {
				...currentProgress,
				actualDurationSec: currentElapsedSec,
				completedAt: new Date().toISOString(),
				status: 'complete' as ProgressStatus
			};

			// Set target task as active
			newProgress[targetIndex] = {
				...newProgress[targetIndex],
				status: 'active' as ProgressStatus
			};

			// Calculate new total lag
			const newLag = session.totalLagSec + lag;

			// Update session
			session = {
				...session,
				currentTaskIndex: targetIndex,
				currentTaskElapsedMs: 0,
				totalLagSec: newLag,
				taskProgress: newProgress,
				lastPersistedAt: Date.now()
			};

			// Persist to storage
			storage.saveSession(session);

			return true;
		},

		/**
		 * Mark a completed task as incomplete.
		 *
		 * Feature: Task Correction
		 *
		 * Resets a completed task back to pending/active state.
		 * - Clears actualDurationSec and completedAt
		 * - Recalculates totalLagSec
		 * - Adjusts currentTaskIndex if needed
		 * - If session was complete, sets back to running
		 *
		 * @param taskId - ID of task to uncomplete
		 * @returns true if uncomplete succeeded, false if task not found or not complete
		 */
		uncompleteTask(taskId: string): boolean {
			if (!session) {
				return false;
			}

			const progressIndex = session.taskProgress.findIndex((p) => p.taskId === taskId);
			if (progressIndex === -1) {
				return false;
			}

			const oldProgress = session.taskProgress[progressIndex];

			// Only allow uncompleting completed tasks
			if (oldProgress.status !== 'complete') {
				return false;
			}

			// Calculate old lag contribution: (actualDuration - plannedDuration)
			const oldLagContribution = oldProgress.actualDurationSec - oldProgress.plannedDurationSec;

			// Build new progress array
			const newProgress = [...session.taskProgress];

			// If the uncompleted task is at or before current index,
			// we need to make it the current task
			let newCurrentIndex = session.currentTaskIndex;
			if (progressIndex <= session.currentTaskIndex) {
				// Mark any currently active task as pending
				for (let i = 0; i < newProgress.length; i++) {
					if (newProgress[i].status === 'active') {
						newProgress[i] = {
							...newProgress[i],
							status: 'pending' as ProgressStatus
						};
					}
				}
				// Set the uncompleted task as active, PRESERVING actualDurationSec
				// so the timer can continue from where it left off
				newProgress[progressIndex] = {
					...oldProgress,
					// Keep actualDurationSec so timer continues from previous elapsed time
					completedAt: null,
					status: 'active' as ProgressStatus
				};
				newCurrentIndex = progressIndex;
			} else {
				// Task is after current, just set to pending
				// Preserve actualDurationSec in case they want to continue later
				newProgress[progressIndex] = {
					...oldProgress,
					completedAt: null,
					status: 'pending' as ProgressStatus
				};
			}

			// Update session
			session = {
				...session,
				status: 'running', // In case session was complete
				endedAt: null, // Clear end time
				currentTaskIndex: newCurrentIndex,
				totalLagSec: session.totalLagSec - oldLagContribution,
				taskProgress: newProgress,
				lastPersistedAt: Date.now()
			};

			// Persist changes
			storage.saveSession(session);

			return true;
		}
	};
}

/**
 * The session store singleton
 */
export const sessionStore = createSessionStore();
