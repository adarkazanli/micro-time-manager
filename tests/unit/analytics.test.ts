/**
 * Analytics Service Tests
 *
 * Feature: 006-analytics-dashboard
 * Tasks: T005-T008
 *
 * Tests for analytics calculation functions.
 */

import { describe, it, expect } from 'vitest';
import {
	getConcentrationRating,
	calculateAnalyticsSummary,
	calculateTaskPerformance
} from '$lib/services/analytics';
import type { TaskProgress, Interruption, ConfirmedTask } from '$lib/types';

// =============================================================================
// T006: getConcentrationRating tests
// =============================================================================

describe('getConcentrationRating', () => {
	it('returns "Excellent" for score >= 90', () => {
		expect(getConcentrationRating(90)).toBe('Excellent');
		expect(getConcentrationRating(95)).toBe('Excellent');
		expect(getConcentrationRating(100)).toBe('Excellent');
	});

	it('returns "Good" for score 80-89', () => {
		expect(getConcentrationRating(80)).toBe('Good');
		expect(getConcentrationRating(85)).toBe('Good');
		expect(getConcentrationRating(89)).toBe('Good');
		expect(getConcentrationRating(89.9)).toBe('Good');
	});

	it('returns "Fair" for score 70-79', () => {
		expect(getConcentrationRating(70)).toBe('Fair');
		expect(getConcentrationRating(75)).toBe('Fair');
		expect(getConcentrationRating(79)).toBe('Fair');
		expect(getConcentrationRating(79.9)).toBe('Fair');
	});

	it('returns "Needs improvement" for score < 70', () => {
		expect(getConcentrationRating(69)).toBe('Needs improvement');
		expect(getConcentrationRating(50)).toBe('Needs improvement');
		expect(getConcentrationRating(0)).toBe('Needs improvement');
	});

	it('handles boundary values correctly', () => {
		expect(getConcentrationRating(89.99)).toBe('Good');
		expect(getConcentrationRating(79.99)).toBe('Fair');
		expect(getConcentrationRating(69.99)).toBe('Needs improvement');
	});
});

// =============================================================================
// T007: calculateAnalyticsSummary tests
// =============================================================================

describe('calculateAnalyticsSummary', () => {
	it('returns zero values for empty inputs', () => {
		const summary = calculateAnalyticsSummary([], []);

		expect(summary.totalPlannedSec).toBe(0);
		expect(summary.totalActualSec).toBe(0);
		expect(summary.tasksCompleted).toBe(0);
		expect(summary.totalTasks).toBe(0);
		expect(summary.scheduleAdherence).toBe(0);
		expect(summary.concentrationScore).toBe(0);
		expect(summary.concentrationRating).toBe('Needs improvement');
		expect(summary.totalInterruptionCount).toBe(0);
		expect(summary.totalInterruptionSec).toBe(0);
	});

	it('calculates totals correctly for completed tasks', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1800,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			},
			{
				taskId: '2',
				plannedDurationSec: 3600,
				actualDurationSec: 3000,
				completedAt: '2025-01-01T11:00:00Z',
				status: 'complete'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		expect(summary.totalPlannedSec).toBe(5400); // 1800 + 3600
		expect(summary.totalActualSec).toBe(4800); // 1800 + 3000
		expect(summary.tasksCompleted).toBe(2);
		expect(summary.totalTasks).toBe(2);
	});

	it('only counts completed tasks for actual time', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1800,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			},
			{
				taskId: '2',
				plannedDurationSec: 3600,
				actualDurationSec: 0,
				completedAt: null,
				status: 'pending'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		expect(summary.totalPlannedSec).toBe(5400);
		expect(summary.totalActualSec).toBe(1800);
		expect(summary.tasksCompleted).toBe(1);
		expect(summary.totalTasks).toBe(2);
	});

	it('calculates schedule adherence correctly', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1000,
				actualDurationSec: 1000,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		// 1000 / 1000 * 100 = 100%
		expect(summary.scheduleAdherence).toBe(100);
	});

	it('calculates schedule adherence for faster completion', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1000,
				actualDurationSec: 500,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		// 1000 / 500 * 100 = 200%
		expect(summary.scheduleAdherence).toBe(200);
	});

	it('calculates concentration score correctly', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1800,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			}
		];

		const interruptions: Interruption[] = [
			{
				interruptionId: 'i1',
				taskId: '1',
				startedAt: '2025-01-01T09:30:00Z',
				endedAt: '2025-01-01T09:33:00Z',
				durationSec: 180,
				category: null,
				note: null
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, interruptions);

		// (1800 - 180) / 1800 * 100 = 90%
		expect(summary.concentrationScore).toBe(90);
		expect(summary.concentrationRating).toBe('Excellent');
	});

	it('returns 100% concentration with no interruptions', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1800,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		expect(summary.concentrationScore).toBe(100);
		expect(summary.concentrationRating).toBe('Excellent');
	});

	it('aggregates interruption totals', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 3600,
				actualDurationSec: 3600,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			}
		];

		const interruptions: Interruption[] = [
			{
				interruptionId: 'i1',
				taskId: '1',
				startedAt: '2025-01-01T09:00:00Z',
				endedAt: '2025-01-01T09:05:00Z',
				durationSec: 300,
				category: 'Phone',
				note: null
			},
			{
				interruptionId: 'i2',
				taskId: '1',
				startedAt: '2025-01-01T09:30:00Z',
				endedAt: '2025-01-01T09:35:00Z',
				durationSec: 300,
				category: 'Colleague',
				note: null
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, interruptions);

		expect(summary.totalInterruptionCount).toBe(2);
		expect(summary.totalInterruptionSec).toBe(600);
	});

	it('handles zero actual time (no completions)', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 0,
				completedAt: null,
				status: 'pending'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		expect(summary.scheduleAdherence).toBe(0);
		expect(summary.concentrationScore).toBe(0);
	});

	it('rounds values appropriately', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1000,
				actualDurationSec: 333,
				completedAt: '2025-01-01T10:00:00Z',
				status: 'complete'
			}
		];

		const summary = calculateAnalyticsSummary(taskProgress, []);

		// Values should be rounded to 1 decimal place
		expect(summary.scheduleAdherence).toBeCloseTo(300.3, 1);
	});
});

// =============================================================================
// T008: calculateTaskPerformance tests
// =============================================================================

describe('calculateTaskPerformance', () => {
	const baseTasks: ConfirmedTask[] = [
		{
			taskId: '1',
			name: 'Task One',
			plannedStart: new Date('2025-01-01T09:00:00Z'),
			plannedDurationSec: 1800,
			type: 'flexible',
			sortOrder: 0,
			status: 'complete'
		},
		{
			taskId: '2',
			name: 'Task Two',
			plannedStart: new Date('2025-01-01T09:30:00Z'),
			plannedDurationSec: 3600,
			type: 'fixed',
			sortOrder: 1,
			status: 'pending'
		}
	];

	it('returns empty array for empty inputs', () => {
		const result = calculateTaskPerformance([], [], []);
		expect(result).toEqual([]);
	});

	it('maps task data correctly', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 2000,
				completedAt: '2025-01-01T09:35:00Z',
				status: 'complete'
			},
			{
				taskId: '2',
				plannedDurationSec: 3600,
				actualDurationSec: 0,
				completedAt: null,
				status: 'pending'
			}
		];

		const result = calculateTaskPerformance(baseTasks, taskProgress, []);

		expect(result).toHaveLength(2);
		expect(result[0].taskId).toBe('1');
		expect(result[0].taskName).toBe('Task One');
		expect(result[0].plannedDurationSec).toBe(1800);
		expect(result[0].actualDurationSec).toBe(2000);
		expect(result[0].status).toBe('complete');
	});

	it('calculates variance correctly (over time)', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 2100, // 300 seconds over
				completedAt: '2025-01-01T09:35:00Z',
				status: 'complete'
			}
		];

		const result = calculateTaskPerformance([baseTasks[0]], taskProgress, []);

		expect(result[0].varianceSec).toBe(300); // Positive = over time
	});

	it('calculates variance correctly (under time)', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1500, // 300 seconds under
				completedAt: '2025-01-01T09:25:00Z',
				status: 'complete'
			}
		];

		const result = calculateTaskPerformance([baseTasks[0]], taskProgress, []);

		expect(result[0].varianceSec).toBe(-300); // Negative = under time
	});

	it('aggregates interruptions per task', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1800,
				completedAt: '2025-01-01T09:30:00Z',
				status: 'complete'
			},
			{
				taskId: '2',
				plannedDurationSec: 3600,
				actualDurationSec: 3600,
				completedAt: '2025-01-01T10:30:00Z',
				status: 'complete'
			}
		];

		const interruptions: Interruption[] = [
			{
				interruptionId: 'i1',
				taskId: '1',
				startedAt: '2025-01-01T09:10:00Z',
				endedAt: '2025-01-01T09:12:00Z',
				durationSec: 120,
				category: null,
				note: null
			},
			{
				interruptionId: 'i2',
				taskId: '1',
				startedAt: '2025-01-01T09:20:00Z',
				endedAt: '2025-01-01T09:21:00Z',
				durationSec: 60,
				category: null,
				note: null
			},
			{
				interruptionId: 'i3',
				taskId: '2',
				startedAt: '2025-01-01T10:00:00Z',
				endedAt: '2025-01-01T10:05:00Z',
				durationSec: 300,
				category: null,
				note: null
			}
		];

		const result = calculateTaskPerformance(baseTasks, taskProgress, interruptions);

		expect(result[0].interruptionCount).toBe(2);
		expect(result[0].interruptionSec).toBe(180); // 120 + 60

		expect(result[1].interruptionCount).toBe(1);
		expect(result[1].interruptionSec).toBe(300);
	});

	it('handles tasks with no progress record', () => {
		const result = calculateTaskPerformance(baseTasks, [], []);

		expect(result).toHaveLength(2);
		expect(result[0].actualDurationSec).toBe(0);
		expect(result[0].varianceSec).toBe(-1800); // 0 - 1800
		expect(result[0].status).toBe('pending');
	});

	it('handles tasks with no interruptions', () => {
		const taskProgress: TaskProgress[] = [
			{
				taskId: '1',
				plannedDurationSec: 1800,
				actualDurationSec: 1800,
				completedAt: '2025-01-01T09:30:00Z',
				status: 'complete'
			}
		];

		const result = calculateTaskPerformance([baseTasks[0]], taskProgress, []);

		expect(result[0].interruptionCount).toBe(0);
		expect(result[0].interruptionSec).toBe(0);
	});
});
