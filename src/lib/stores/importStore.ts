/**
 * Import Store
 *
 * Manages the schedule import workflow state.
 * Handles file upload, parsing, preview, editing, and confirmation.
 */

import { writable, derived } from 'svelte/store';
import type {
	ImportState,
	DraftTask,
	ValidationError,
	ConfirmedTask
} from '$lib/types';
import { parseScheduleFile } from '$lib/services/parser';
import { storage } from '$lib/services/storage';

/**
 * Check if a task's start time is in the past
 */
function isPastDue(task: DraftTask): boolean {
	return task.startTime.getTime() < Date.now();
}

/**
 * Check if two tasks overlap in time
 */
function tasksOverlap(task1: DraftTask, task2: DraftTask): boolean {
	const task1Start = task1.startTime.getTime();
	const task1End = task1Start + task1.durationSeconds * 1000;
	const task2Start = task2.startTime.getTime();
	const task2End = task2Start + task2.durationSeconds * 1000;

	// Tasks overlap if one starts before the other ends
	return task1Start < task2End && task2Start < task1End;
}

/**
 * Update warning flags for all tasks based on overlaps and past-due status
 */
function updateTaskWarnings(tasks: DraftTask[]): DraftTask[] {
	return tasks.map((task, index) => {
		let hasWarning = false;

		// Check if past due
		if (isPastDue(task)) {
			hasWarning = true;
		}

		// Check for overlaps with other tasks
		if (!hasWarning) {
			for (let i = 0; i < tasks.length; i++) {
				if (i !== index && tasksOverlap(task, tasks[i])) {
					hasWarning = true;
					break;
				}
			}
		}

		return { ...task, hasWarning };
	});
}

/**
 * Initial state for the import store
 */
const initialState: ImportState = {
	status: 'idle',
	file: null,
	uploadedAt: null,
	tasks: [],
	errors: []
};

/**
 * Create the import store with actions
 */
function createImportStore() {
	const { subscribe, set, update } = writable<ImportState>(initialState);

	return {
		subscribe,

		/**
		 * Upload and parse a file
		 */
		async uploadFile(file: File): Promise<void> {
			// Set parsing state
			update((state) => ({
				...state,
				status: 'parsing',
				file,
				uploadedAt: new Date(),
				tasks: [],
				errors: []
			}));

			// Parse the file
			const result = await parseScheduleFile(file);

			if (result.success) {
				update((state) => ({
					...state,
					status: 'preview',
					tasks: updateTaskWarnings(result.tasks),
					errors: []
				}));
			} else {
				update((state) => ({
					...state,
					status: 'error',
					tasks: [],
					errors: result.errors
				}));
			}
		},

		/**
		 * Update a single task
		 */
		updateTask(id: string, changes: Partial<DraftTask>): void {
			update((state) => {
				const updatedTasks = state.tasks.map((task) =>
					task.id === id ? { ...task, ...changes } : task
				);
				return {
					...state,
					tasks: updateTaskWarnings(updatedTasks)
				};
			});
		},

		/**
		 * Reorder tasks (for drag-drop)
		 */
		reorderTasks(fromIndex: number, toIndex: number): void {
			update((state) => {
				const tasks = [...state.tasks];
				const [moved] = tasks.splice(fromIndex, 1);
				tasks.splice(toIndex, 0, moved);

				// Update sort order
				tasks.forEach((task, index) => {
					task.sortOrder = index;
				});

				return { ...state, tasks: updateTaskWarnings(tasks) };
			});
		},

		/**
		 * Delete a task by ID
		 */
		deleteTask(id: string): void {
			update((state) => {
				const tasks = state.tasks.filter((task) => task.id !== id);

				// Update sort order after deletion
				tasks.forEach((task, index) => {
					task.sortOrder = index;
				});

				return { ...state, tasks: updateTaskWarnings(tasks) };
			});
		},

		/**
		 * Recalculate start times based on order and durations
		 * (Called after reordering flexible tasks)
		 */
		recalculateStartTimes(): void {
			update((state) => {
				const tasks = [...state.tasks];

				// Find the first task's start time as baseline
				if (tasks.length === 0) return state;

				let currentTime = tasks[0].startTime.getTime();

				tasks.forEach((task, index) => {
					if (index === 0) {
						// First task keeps its time
						return;
					}

					// If previous task is flexible, this task starts after it
					const prevTask = tasks[index - 1];
					const prevEndTime =
						prevTask.startTime.getTime() + prevTask.durationSeconds * 1000;

					// Only adjust if this would cause an overlap
					if (task.type === 'flexible' && currentTime < prevEndTime) {
						task.startTime = new Date(prevEndTime);
					}

					currentTime = task.startTime.getTime();
				});

				return { ...state, tasks: updateTaskWarnings(tasks) };
			});
		},

		/**
		 * Confirm the schedule and save to localStorage
		 */
		confirmSchedule(): ConfirmedTask[] {
			let confirmedTasks: ConfirmedTask[] = [];

			update((state) => {
				// Transform DraftTasks to ConfirmedTasks
				confirmedTasks = state.tasks.map((task) => ({
					taskId: task.id,
					name: task.name,
					plannedStart: task.startTime,
					plannedDurationSec: task.durationSeconds,
					type: task.type,
					sortOrder: task.sortOrder,
					status: 'pending' as const
				}));

				// Save to localStorage
				storage.saveTasks(confirmedTasks);

				// Transition to ready state
				return {
					...state,
					status: 'ready',
					tasks: [],
					errors: []
				};
			});

			return confirmedTasks;
		},

		/**
		 * Cancel and reset to initial state
		 */
		reset(): void {
			set(initialState);
		},

		/**
		 * Set tasks directly (useful for testing)
		 */
		setTasks(tasks: DraftTask[]): void {
			update((state) => ({
				...state,
				status: 'preview',
				tasks: updateTaskWarnings(tasks)
			}));
		},

		/**
		 * Set errors directly (useful for testing)
		 */
		setErrors(errors: ValidationError[]): void {
			update((state) => ({
				...state,
				status: 'error',
				errors
			}));
		}
	};
}

/**
 * The import store instance
 */
export const importStore = createImportStore();

/**
 * Derived store: whether there are validation errors
 */
export const hasErrors = derived(
	importStore,
	($store) => $store.errors.length > 0
);

/**
 * Derived store: whether schedule can be confirmed
 */
export const canConfirm = derived(
	importStore,
	($store) => $store.status === 'preview' && $store.tasks.length > 0
);

/**
 * Derived store: whether currently parsing
 */
export const isParsing = derived(
	importStore,
	($store) => $store.status === 'parsing'
);

/**
 * Derived store: task count
 */
export const taskCount = derived(
	importStore,
	($store) => $store.tasks.length
);
