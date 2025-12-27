/**
 * Projection Service
 *
 * Calculates projected task timings and risk levels for the impact panel.
 * All functions are pure and deterministic given the same inputs.
 *
 * @module projection
 */

import type { ConfirmedTask, TaskProgress, ProjectedTask, RiskLevel, DisplayStatus } from '$lib/types';
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

	const now = new Date();
	const nowMs = now.getTime();

	// Calculate remaining time on current task
	let currentRemainingMs = 0;
	if (currentIndex >= 0 && currentIndex < tasks.length) {
		const currentTask = tasks[currentIndex];
		currentRemainingMs = Math.max(0, currentTask.plannedDurationSec * 1000 - currentElapsedMs);
	}

	// Debug logging for timing verification
	console.group('🕐 Projection Timing Debug');
	console.log('Current system time:', now.toLocaleTimeString());
	console.log('Current task index:', currentIndex);
	console.log('Elapsed on current task:', Math.floor(currentElapsedMs / 1000), 'sec', `(${Math.floor(currentElapsedMs / 60000)}:${String(Math.floor((currentElapsedMs % 60000) / 1000)).padStart(2, '0')})`);
	if (currentIndex >= 0 && currentIndex < tasks.length) {
		const ct = tasks[currentIndex];
		console.log('Current task:', ct.name);
		console.log('  Planned duration:', ct.plannedDurationSec, 'sec', `(${Math.floor(ct.plannedDurationSec / 60)} min)`);
		console.log('  Planned start:', ct.plannedStart.toLocaleTimeString());
		const remainingSec = Math.max(0, ct.plannedDurationSec - currentElapsedMs / 1000);
		console.log('  Remaining:', Math.floor(remainingSec), 'sec', `(${Math.floor(remainingSec / 60)}:${String(Math.floor(remainingSec % 60)).padStart(2, '0')})`);
	}
	console.groupEnd();

	// Create task info with original indices and sort chronologically for processing
	const taskInfos = tasks.map((task, idx) => ({
		task,
		originalIndex: idx,
		progress: progress[idx]
	}));

	// Separate completed, current, and pending tasks
	const completedTasks = taskInfos.filter(
		({ progress: p, originalIndex }) =>
			(p?.status === 'complete' || p?.status === 'missed') && originalIndex !== currentIndex
	);
	const currentTaskInfo = currentIndex >= 0 && currentIndex < tasks.length
		? taskInfos[currentIndex]
		: null;
	const pendingTasks = taskInfos
		.filter(({ progress: p, originalIndex }) =>
			p?.status !== 'complete' && p?.status !== 'missed' && originalIndex !== currentIndex
		)
		.sort((a, b) => a.task.plannedStart.getTime() - b.task.plannedStart.getTime());

	// Build results map (keyed by original index)
	const resultsMap = new Map<number, ProjectedTask>();

	// Process completed tasks - use their planned start
	for (const { task, originalIndex } of completedTasks) {
		resultsMap.set(originalIndex, {
			task,
			projectedStart: task.plannedStart,
			projectedEnd: new Date(task.plannedStart.getTime() + task.plannedDurationSec * 1000),
			riskLevel: null,
			bufferSec: 0,
			displayStatus: 'completed',
			isDraggable: false
		});
	}

	// Process current task
	if (currentTaskInfo) {
		const { task, originalIndex } = currentTaskInfo;
		const projectedStart = now;
		const projectedEnd = new Date(nowMs + currentRemainingMs);
		resultsMap.set(originalIndex, {
			task,
			projectedStart,
			projectedEnd,
			riskLevel: null,
			bufferSec: 0,
			displayStatus: 'current',
			isDraggable: task.type === 'flexible'
		});
	}

	// Build blocked periods from fixed pending tasks
	// This ensures flexible tasks don't start during a fixed task's time slot
	const blockedPeriods = pendingTasks
		.filter(({ task }) => task.type === 'fixed')
		.map(({ task }) => ({
			start: task.plannedStart.getTime(),
			end: task.plannedStart.getTime() + task.plannedDurationSec * 1000
		}));

	// Process pending tasks in CHRONOLOGICAL order
	let nextAvailableTime = nowMs + currentRemainingMs;

	for (const { task, originalIndex } of pendingTasks) {
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

		// Update next available time
		nextAvailableTime = projectedEnd.getTime();

		resultsMap.set(originalIndex, {
			task,
			projectedStart,
			projectedEnd,
			riskLevel,
			bufferSec,
			displayStatus: 'pending',
			isDraggable: task.type === 'flexible'
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
