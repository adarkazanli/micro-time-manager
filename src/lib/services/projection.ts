/**
 * Projection Service
 *
 * Calculates projected task timings and risk levels for the impact panel.
 * All functions are pure and deterministic given the same inputs.
 *
 * @module projection
 */

import type { ConfirmedTask, TaskProgress, ProjectedTask, RiskLevel } from '$lib/types';
import { settingsStore } from '$lib/stores/settingsStore.svelte';

/**
 * Calculates the projected start time for a task at the given index.
 *
 * This is a pure function - all inputs including current time must be provided.
 *
 * The projection is based on:
 * - Current time (nowMs)
 * - Remaining time on the current task
 * - Sum of durations for all tasks between current and target
 * - Fixed task constraints (fixed tasks don't start before scheduled time)
 *
 * For tasks before or at the current index, returns the task's planned start time.
 *
 * @param tasks - Array of all confirmed tasks in order
 * @param currentIndex - Index of the currently active task
 * @param currentElapsedMs - Milliseconds elapsed on the current task
 * @param targetIndex - Index of the task to calculate projected start for
 * @param nowMs - Current time as milliseconds since epoch
 * @returns Projected start time as a Date object
 *
 * @example
 * ```ts
 * const tasks = [task1, task2, task3];
 * const projectedStart = calculateProjectedStart(tasks, 0, 600000, 2, Date.now());
 * // Returns when task3 will start given 10min elapsed on task1
 * ```
 */
export function calculateProjectedStart(
	tasks: ConfirmedTask[],
	currentIndex: number,
	currentElapsedMs: number,
	targetIndex: number,
	nowMs: number
): Date {
	// For completed tasks (before current), return their planned start
	if (targetIndex < currentIndex) {
		return tasks[targetIndex].plannedStart;
	}

	// For current task, return now
	if (targetIndex === currentIndex) {
		return new Date(nowMs);
	}

	// For future tasks, calculate iteratively respecting fixed task constraints
	let projectedMs = nowMs;

	// Add remaining time on current task
	const currentTask = tasks[currentIndex];
	const currentRemainingMs = Math.max(0, currentTask.plannedDurationSec * 1000 - currentElapsedMs);
	projectedMs += currentRemainingMs;

	// Add durations of all tasks between current and target, respecting fixed task times
	for (let i = currentIndex + 1; i <= targetIndex; i++) {
		const task = tasks[i];

		// For fixed tasks, they don't start before their scheduled time
		if (task.type === 'fixed') {
			projectedMs = Math.max(projectedMs, task.plannedStart.getTime());
		}

		// If this is the target task, return the projected start
		if (i === targetIndex) {
			return new Date(projectedMs);
		}

		// Add this task's duration for subsequent tasks
		projectedMs += task.plannedDurationSec * 1000;
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

	// T028/T029: Use dynamic fixed task alert threshold from settings
	// fixedTaskAlertMin is in minutes, convert to milliseconds
	const alertThresholdMs = settingsStore.fixedTaskAlertMin * 60 * 1000;

	if (bufferMs > alertThresholdMs) {
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
 * Fixed tasks respect their scheduled times - they won't start before
 * their scheduled time even if there's a gap. This affects subsequent
 * task projections as well.
 *
 * @param tasks - Array of confirmed tasks in execution order
 * @param progress - Array of task progress records
 * @param currentIndex - Index of the currently active task
 * @param currentElapsedMs - Milliseconds elapsed on the current task
 * @param currentTaskStartedAtMs - When the current task actually started (epoch ms), optional
 * @returns Array of ProjectedTask objects
 *
 * @example
 * ```ts
 * const projected = createProjectedTasks(tasks, progress, 1, 300000, Date.now() - 300000);
 * // Returns tasks with projections based on 5min elapsed on task 1
 * ```
 */
export function createProjectedTasks(
	tasks: ConfirmedTask[],
	progress: TaskProgress[],
	currentIndex: number,
	currentElapsedMs: number,
	currentTaskStartedAtMs?: number
): ProjectedTask[] {
	if (tasks.length === 0) {
		return [];
	}

	const now = new Date();
	const nowMs = now.getTime();

	// Calculate remaining time on current task (only if task is ACTIVE)
	let currentRemainingMs = 0;
	const hasActiveTask = currentIndex >= 0 && currentIndex < tasks.length &&
		progress[currentIndex]?.status === 'active';
	if (hasActiveTask) {
		const currentTask = tasks[currentIndex];
		currentRemainingMs = Math.max(0, currentTask.plannedDurationSec * 1000 - currentElapsedMs);
	}

	// Create task info with original indices and sort chronologically for processing
	const taskInfos = tasks.map((task, idx) => ({
		task,
		originalIndex: idx,
		progress: progress[idx]
	}));

	// Separate completed, current, paused, and pending tasks
	// A task is only "current" if it has status 'active' - not just by currentIndex
	const completedTasks = taskInfos.filter(
		({ progress: p }) =>
			(p?.status === 'complete' || p?.status === 'missed')
	);

	// Only consider as current if the task at currentIndex is ACTIVE (not pending)
	const currentTaskInfo = currentIndex >= 0 && currentIndex < tasks.length &&
		progress[currentIndex]?.status === 'active'
		? taskInfos[currentIndex]
		: null;

	// Paused tasks - tasks that were started but are now paused
	const pausedTasks = taskInfos.filter(
		({ progress: p }) => p?.status === 'paused'
	);

	// Pending tasks include those with status 'pending' (NOT 'active', 'complete', 'missed', or 'paused')
	// Also exclude the current task if it's active
	// NOTE: We keep them in ARRAY ORDER (originalIndex) for flexible tasks,
	// so that manual reordering is respected. Fixed tasks are processed
	// at their scheduled times regardless of position.
	const pendingTasks = taskInfos
		.filter(({ progress: p, originalIndex }) =>
			p?.status === 'pending' && originalIndex !== (currentTaskInfo ? currentIndex : -1)
		)
		.sort((a, b) => a.originalIndex - b.originalIndex);

	// Build results map (keyed by original index)
	const resultsMap = new Map<number, ProjectedTask>();

	// Process completed tasks - use their ACTUAL start time (calculated from completedAt - actualDuration)
	for (const { task, originalIndex, progress: p } of completedTasks) {
		let actualStart: Date;

		// Calculate actual start from completion time - actual duration
		if (p?.completedAt && p?.actualDurationSec > 0) {
			const completedAtMs = new Date(p.completedAt).getTime();
			actualStart = new Date(completedAtMs - p.actualDurationSec * 1000);
		} else {
			// Fallback to planned start if no completion data
			actualStart = task.plannedStart;
		}

		const actualEnd = p?.completedAt ? new Date(p.completedAt) : new Date(actualStart.getTime() + task.plannedDurationSec * 1000);

		resultsMap.set(originalIndex, {
			task,
			projectedStart: actualStart,
			projectedEnd: actualEnd,
			riskLevel: null,
			bufferSec: 0,
			displayStatus: 'completed',
			isDraggable: false,
			elapsedSec: p?.actualDurationSec ?? 0,
			willBeInterrupted: false
		});
	}

	// Process current task - use ACTUAL start time from timerStartedAtMs
	if (currentTaskInfo) {
		const { task, originalIndex } = currentTaskInfo;

		// Use actual start time if provided, otherwise fall back to now - elapsed
		const actualStartMs = currentTaskStartedAtMs ?? (nowMs - currentElapsedMs);
		const projectedStart = new Date(actualStartMs);
		const projectedEnd = new Date(nowMs + currentRemainingMs);

		// Elapsed time is from currentElapsedMs (live timer value)
		const elapsedSec = Math.floor(currentElapsedMs / 1000);

		resultsMap.set(originalIndex, {
			task,
			projectedStart,
			projectedEnd,
			riskLevel: null,
			bufferSec: 0,
			displayStatus: 'current',
			isDraggable: task.type === 'flexible',
			elapsedSec,
			willBeInterrupted: false // Current task is already running
		});
	}

	// Process paused tasks - they retain their position but show paused status
	for (const { task, originalIndex, progress: p } of pausedTasks) {
		// Use accumulated elapsed time from the paused task
		const accumulatedMs = p?.accumulatedElapsedMs ?? 0;
		const elapsedSec = Math.floor(accumulatedMs / 1000);

		// Paused tasks show their original planned start (they're waiting to be resumed)
		resultsMap.set(originalIndex, {
			task,
			projectedStart: task.plannedStart,
			projectedEnd: new Date(task.plannedStart.getTime() + task.plannedDurationSec * 1000),
			riskLevel: null,
			bufferSec: 0,
			displayStatus: 'paused',
			isDraggable: task.type === 'flexible', // Paused flexible tasks can be reordered
			elapsedSec,
			willBeInterrupted: false
		});
	}

	// Build blocked periods from fixed pending tasks (with task info for interruption detection)
	// This ensures flexible tasks don't start during a fixed task's time slot
	const blockedPeriods = pendingTasks
		.filter(({ task }) => task.type === 'fixed')
		.map(({ task }) => ({
			start: task.plannedStart.getTime(),
			end: task.plannedStart.getTime() + task.plannedDurationSec * 1000,
			taskName: task.name,
			startTime: task.plannedStart
		}));

	// Process pending tasks in CHRONOLOGICAL order
	let nextAvailableTime = nowMs + currentRemainingMs;

	for (const { task, originalIndex, progress: p } of pendingTasks) {
		let projectedStart: Date;

		if (task.type === 'fixed') {
			// Fixed tasks start at the later of: next available time OR scheduled time
			projectedStart = new Date(Math.max(nextAvailableTime, task.plannedStart.getTime()));
		} else {
			// Flexible tasks start as soon as available, BUT must skip blocked periods
			let flexStart = nextAvailableTime;

			// Check if we're starting inside a blocked period (fixed task time slot)
			for (const blocked of blockedPeriods) {
				if (flexStart >= blocked.start && flexStart < blocked.end) {
					// Push start time to after this blocked period
					flexStart = blocked.end;
				}
			}

			projectedStart = new Date(flexStart);
		}

		const durationMs = task.plannedDurationSec * 1000;
		const projectedEnd = new Date(projectedStart.getTime() + durationMs);

		// Calculate buffer and risk level for fixed tasks
		let riskLevel: RiskLevel | null = null;
		let bufferSec = 0;

		if (task.type === 'fixed') {
			// Buffer is based on when we'd arrive (nextAvailableTime) vs scheduled time
			bufferSec = Math.round((task.plannedStart.getTime() - nextAvailableTime) / 1000);
			riskLevel = calculateRiskLevel(new Date(nextAvailableTime), task.plannedStart);
		}

		// Check if this flexible task will be interrupted by a fixed task
		let willBeInterrupted = false;
		let interruptingTask: { name: string; startTime: Date } | undefined;

		if (task.type === 'flexible') {
			// Check if the task's execution window overlaps with any fixed task
			const taskStartMs = projectedStart.getTime();
			const taskEndMs = projectedEnd.getTime();

			for (const blocked of blockedPeriods) {
				// The task will be interrupted if a fixed task starts during its execution
				// (fixed task start is after this task starts AND before this task would end)
				if (blocked.start > taskStartMs && blocked.start < taskEndMs) {
					willBeInterrupted = true;
					interruptingTask = {
						name: blocked.taskName,
						startTime: blocked.startTime
					};
					break; // Only report the first interruption
				}
			}
		}

		// Get elapsed time from progress (saved elapsed time for paused tasks)
		const elapsedSec = p?.actualDurationSec ?? 0;

		// Update next available time
		nextAvailableTime = projectedEnd.getTime();

		resultsMap.set(originalIndex, {
			task,
			projectedStart,
			projectedEnd,
			riskLevel,
			bufferSec,
			displayStatus: 'pending',
			isDraggable: task.type === 'flexible',
			elapsedSec,
			willBeInterrupted,
			interruptingTask
		});
	}

	// Return results in original array order
	const results: ProjectedTask[] = [];
	for (let i = 0; i < tasks.length; i++) {
		const result = resultsMap.get(i);
		if (result) {
			results.push(result);
		}
	}

	return results;
}
