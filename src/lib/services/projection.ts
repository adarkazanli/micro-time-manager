/**
 * Projection Service
 *
 * Calculates projected task timings and risk levels for the impact panel.
 * All functions are pure and deterministic given the same inputs.
 *
 * @module projection
 */

import type { ConfirmedTask, TaskProgress, ProjectedTask, RiskLevel, DisplayStatus } from '$lib/types';
import { WARNING_THRESHOLD_MS } from '$lib/types';

/**
 * Calculates the projected start time for a task at the given index.
 *
 * The projection is based on:
 * - Current time (now)
 * - Remaining time on the current task
 * - Sum of durations for all tasks between current and target
 *
 * For tasks before or at the current index, returns the task's planned start time.
 *
 * @param tasks - Array of all confirmed tasks in order
 * @param currentIndex - Index of the currently active task
 * @param currentElapsedMs - Milliseconds elapsed on the current task
 * @param targetIndex - Index of the task to calculate projected start for
 * @returns Projected start time as a Date object
 *
 * @example
 * ```ts
 * const tasks = [task1, task2, task3];
 * const projectedStart = calculateProjectedStart(tasks, 0, 600000, 2);
 * // Returns when task3 will start given 10min elapsed on task1
 * ```
 */
export function calculateProjectedStart(
	tasks: ConfirmedTask[],
	currentIndex: number,
	currentElapsedMs: number,
	targetIndex: number
): Date {
	// For completed tasks (before current), return their planned start
	if (targetIndex < currentIndex) {
		return tasks[targetIndex].plannedStart;
	}

	// For current task, return now
	if (targetIndex === currentIndex) {
		return new Date();
	}

	// For future tasks, calculate based on remaining time
	const now = new Date();
	let projectedMs = now.getTime();

	// Add remaining time on current task
	const currentTask = tasks[currentIndex];
	const currentRemainingMs = Math.max(0, currentTask.plannedDurationSec * 1000 - currentElapsedMs);
	projectedMs += currentRemainingMs;

	// Add durations of all tasks between current and target
	for (let i = currentIndex + 1; i < targetIndex; i++) {
		projectedMs += tasks[i].plannedDurationSec * 1000;
	}

	return new Date(projectedMs);
}

/**
 * Calculates the risk level for a fixed task based on projected vs scheduled timing.
 *
 * Risk levels:
 * - 'green': More than 5 minutes of buffer (safe)
 * - 'yellow': Between 0 and 5 minutes of buffer (warning)
 * - 'red': No buffer or will be late (danger)
 *
 * Uses WARNING_THRESHOLD_MS (5 minutes = 300000ms) as the threshold.
 *
 * @param projectedStart - When the task is projected to start
 * @param scheduledStart - When the task was originally scheduled to start
 * @returns Risk level: 'green', 'yellow', or 'red'
 *
 * @example
 * ```ts
 * const risk = calculateRiskLevel(
 *   new Date('2025-12-18T09:55:00'),
 *   new Date('2025-12-18T10:00:00')
 * );
 * // Returns 'yellow' (5 minutes buffer)
 * ```
 */
export function calculateRiskLevel(projectedStart: Date, scheduledStart: Date): RiskLevel {
	const bufferMs = scheduledStart.getTime() - projectedStart.getTime();

	if (bufferMs > WARNING_THRESHOLD_MS) {
		return 'green';
	}
	if (bufferMs > 0) {
		return 'yellow';
	}
	return 'red';
}

/**
 * Creates an array of ProjectedTask objects with calculated projections.
 *
 * For each task, computes:
 * - projectedStart: When the task will actually start
 * - projectedEnd: When the task will end (start + duration)
 * - riskLevel: Risk indicator for fixed tasks (null for flexible)
 * - bufferSec: Seconds of buffer before scheduled start
 * - displayStatus: Visual status (completed/current/pending)
 * - isDraggable: Whether the task can be reordered
 *
 * @param tasks - Array of confirmed tasks in execution order
 * @param progress - Array of task progress records
 * @param currentIndex - Index of the currently active task
 * @param currentElapsedMs - Milliseconds elapsed on the current task
 * @returns Array of ProjectedTask objects
 *
 * @example
 * ```ts
 * const projected = createProjectedTasks(tasks, progress, 1, 300000);
 * // Returns tasks with projections based on 5min elapsed on task 1
 * ```
 */
export function createProjectedTasks(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	currentIndex: number,
	currentElapsedMs: number
): ProjectedTask[] {
	if (tasks.length === 0) {
		return [];
	}

	return tasks.map((task, index) => {
		// Determine display status
		const taskProgress = progress[index];
		let displayStatus: DisplayStatus;
		if (taskProgress?.status === 'complete' || taskProgress?.status === 'missed') {
			displayStatus = 'completed';
		} else if (index === currentIndex) {
			displayStatus = 'current';
		} else {
			displayStatus = 'pending';
		}

		// Calculate projected start
		const projectedStart = calculateProjectedStart(tasks, currentIndex, currentElapsedMs, index);

		// Calculate projected end
		const projectedEnd = new Date(projectedStart.getTime() + task.plannedDurationSec * 1000);

		// Calculate buffer and risk level for fixed tasks
		let riskLevel: RiskLevel | null = null;
		let bufferSec = 0;

		if (task.type === 'fixed') {
			bufferSec = Math.round((task.plannedStart.getTime() - projectedStart.getTime()) / 1000);
			riskLevel = calculateRiskLevel(projectedStart, task.plannedStart);
		}

		// Determine if draggable (flexible + pending + after current)
		const isDraggable =
			task.type === 'flexible' && displayStatus === 'pending' && index > currentIndex;

		return {
			task,
			projectedStart,
			projectedEnd,
			riskLevel,
			bufferSec,
			displayStatus,
			isDraggable
		};
	});
}
