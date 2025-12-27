/**
 * Task ordering utilities
 *
 * Feature: 012-fixed-task-reorder
 */

import type { ConfirmedTask, DraftTask } from '$lib/types';

/**
 * Returns a new task array with the specified task moved to its
 * chronologically correct position based on start time.
 *
 * This function is used when a task changes from flexible to fixed type.
 * The task is removed from its current position and inserted at the
 * position where its start time falls chronologically.
 *
 * @param tasks - Current task array
 * @param taskId - ID of task to reorder
 * @param newStartTime - The new start time for the task
 * @returns New array with task at correct position
 *
 * @example
 * ```ts
 * const tasks = [
 *   { taskId: 'a', plannedStart: new Date('2025-01-01T08:00') },
 *   { taskId: 'b', plannedStart: new Date('2025-01-01T10:00') }
 * ];
 * const reordered = reorderTaskChronologically(tasks, 'b', new Date('2025-01-01T07:00'));
 * // Result: task 'b' is now first
 * ```
 */
export function reorderTaskChronologically<T extends ConfirmedTask | DraftTask>(
	tasks: T[],
	taskId: string,
	newStartTime: Date
): T[] {
	// Find the task by ID (handle both ConfirmedTask.taskId and DraftTask.id)
	const taskIndex = tasks.findIndex((t) => {
		const id = 'taskId' in t ? t.taskId : t.id;
		return id === taskId;
	});

	if (taskIndex === -1) return tasks;

	const task = tasks[taskIndex];

	// Create updated task with new start time and fixed type
	const updatedTask = {
		...task,
		...(('plannedStart' in task)
			? { plannedStart: newStartTime, type: 'fixed' as const }
			: { startTime: newStartTime, type: 'fixed' as const })
	} as T;

	// Remove task from current position
	const remaining = [...tasks.slice(0, taskIndex), ...tasks.slice(taskIndex + 1)];

	// Find insertion point based on start time
	let insertIndex = remaining.length; // Default to end

	for (let i = 0; i < remaining.length; i++) {
		const compareTask = remaining[i];
		// Get the start time based on task type
		const compareTime = 'plannedStart' in compareTask
			? compareTask.plannedStart.getTime()
			: compareTask.startTime.getTime();

		// Use <= so tasks at the same time are inserted BEFORE the existing one
		// This gives the newly fixed task priority at that time slot
		if (newStartTime.getTime() <= compareTime) {
			insertIndex = i;
			break;
		}
	}

	// Insert at new position
	return [...remaining.slice(0, insertIndex), updatedTask, ...remaining.slice(insertIndex)];
}

/**
 * Finds the chronological position for a task based on its start time.
 * Returns the index where the task should be inserted.
 *
 * @param tasks - Current task array
 * @param taskId - ID of task to find position for
 * @param startTime - The start time to check
 * @returns The index where the task should be positioned
 */
export function findChronologicalPosition<T extends ConfirmedTask | DraftTask>(
	tasks: T[],
	taskId: string,
	startTime: Date
): number {
	// Filter out the task itself for comparison
	const otherTasks = tasks.filter((t) => {
		const id = 'taskId' in t ? t.taskId : t.id;
		return id !== taskId;
	});

	// Find insertion point
	for (let i = 0; i < otherTasks.length; i++) {
		const compareTask = otherTasks[i];
		const compareTime = 'plannedStart' in compareTask
			? compareTask.plannedStart.getTime()
			: compareTask.startTime.getTime();

		if (startTime.getTime() < compareTime) {
			return i;
		}
	}

	return otherTasks.length;
}
