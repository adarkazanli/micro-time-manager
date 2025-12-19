/**
 * Analytics Service
 *
 * Feature: 006-analytics-dashboard
 * Tasks: T009-T011
 *
 * Pure functions for calculating productivity metrics.
 * No state management - all calculations are derived from input data.
 */

import type {
	AnalyticsSummary,
	TaskPerformance,
	ConcentrationRating,
	TaskProgress,
	ConfirmedTask,
	Interruption
} from '$lib/types';

import {
	CONCENTRATION_EXCELLENT_THRESHOLD,
	CONCENTRATION_GOOD_THRESHOLD,
	CONCENTRATION_FAIR_THRESHOLD
} from '$lib/types';

/**
 * Get concentration rating based on score.
 *
 * @param score - Concentration score percentage (0-100)
 * @returns Human-readable rating tier
 *
 * @example
 * getConcentrationRating(95) // 'Excellent'
 * getConcentrationRating(85) // 'Good'
 * getConcentrationRating(75) // 'Fair'
 * getConcentrationRating(60) // 'Needs improvement'
 */
export function getConcentrationRating(score: number): ConcentrationRating {
	if (score >= CONCENTRATION_EXCELLENT_THRESHOLD) return 'Excellent';
	if (score >= CONCENTRATION_GOOD_THRESHOLD) return 'Good';
	if (score >= CONCENTRATION_FAIR_THRESHOLD) return 'Fair';
	return 'Needs improvement';
}

/**
 * Calculate day-level analytics summary from task progress and interruptions.
 *
 * @param taskProgress - Array of task progress records from session
 * @param interruptions - Array of interruption records from session
 * @returns Aggregated analytics summary
 *
 * @example
 * const summary = calculateAnalyticsSummary(
 *   sessionStore.taskProgress,
 *   interruptionStore.interruptions
 * );
 */
export function calculateAnalyticsSummary(
	taskProgress: readonly TaskProgress[],
	interruptions: readonly Interruption[]
): AnalyticsSummary {
	// Aggregate task metrics
	let totalPlannedSec = 0;
	let totalActualSec = 0;
	let tasksCompleted = 0;

	for (const progress of taskProgress) {
		totalPlannedSec += progress.plannedDurationSec;
		if (progress.status === 'complete') {
			totalActualSec += progress.actualDurationSec;
			tasksCompleted++;
		}
	}

	// Aggregate interruption metrics
	let totalInterruptionSec = 0;
	for (const interruption of interruptions) {
		totalInterruptionSec += interruption.durationSec;
	}

	// Calculate schedule adherence: planned / actual * 100
	// Higher is better (finished faster than planned)
	const scheduleAdherence =
		totalActualSec > 0
			? Math.round((totalPlannedSec / totalActualSec) * 1000) / 10
			: 0;

	// Calculate concentration score: (work time - interruption time) / work time * 100
	const workTime = totalActualSec;
	const concentrationScore =
		workTime > 0
			? Math.round(Math.max(0, ((workTime - totalInterruptionSec) / workTime) * 100) * 10) / 10
			: 0;

	return {
		totalPlannedSec,
		totalActualSec,
		tasksCompleted,
		totalTasks: taskProgress.length,
		scheduleAdherence,
		concentrationScore,
		concentrationRating: getConcentrationRating(concentrationScore),
		totalInterruptionCount: interruptions.length,
		totalInterruptionSec
	};
}

/**
 * Calculate per-task performance metrics.
 *
 * @param tasks - Array of confirmed tasks
 * @param taskProgress - Array of task progress records
 * @param interruptions - Array of interruption records
 * @returns Array of per-task performance metrics
 *
 * @example
 * const performance = calculateTaskPerformance(
 *   sessionStore.tasks,
 *   sessionStore.taskProgress,
 *   interruptionStore.interruptions
 * );
 */
export function calculateTaskPerformance(
	tasks: readonly ConfirmedTask[],
	taskProgress: readonly TaskProgress[],
	interruptions: readonly Interruption[]
): TaskPerformance[] {
	return tasks.map((task) => {
		// Find matching progress record
		const progress = taskProgress.find((p) => p.taskId === task.taskId);

		// Filter interruptions for this task
		const taskInterruptions = interruptions.filter((i) => i.taskId === task.taskId);

		// Get values from progress or defaults
		const plannedDurationSec = progress?.plannedDurationSec ?? task.plannedDurationSec;
		const actualDurationSec = progress?.actualDurationSec ?? 0;
		const status = progress?.status ?? 'pending';

		// Calculate interruption totals for this task
		const interruptionCount = taskInterruptions.length;
		const interruptionSec = taskInterruptions.reduce((sum, i) => sum + i.durationSec, 0);

		return {
			taskId: task.taskId,
			taskName: task.name,
			plannedDurationSec,
			actualDurationSec,
			varianceSec: actualDurationSec - plannedDurationSec,
			interruptionCount,
			interruptionSec,
			status
		};
	});
}
