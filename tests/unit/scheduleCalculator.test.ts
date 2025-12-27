/**
 * Unit tests for Schedule Calculator Service
 * Feature: 011-auto-start-time
 *
 * TDD: These tests are written FIRST and should FAIL until implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	calculateSchedule,
	getScheduleStartTime,
	hasScheduleOverflow,
	calculateInterruptionSplit,
	detectFixedTaskConflicts,
	calculateScheduleDebounced
} from '$lib/services/scheduleCalculator';
import type { ConfirmedTask, ScheduleConfig } from '$lib/types';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockTask(overrides: Partial<ConfirmedTask> = {}): ConfirmedTask {
	return {
		taskId: `task-${Math.random().toString(36).substr(2, 9)}`,
		name: 'Test Task',
		plannedStart: new Date('2025-12-26T09:00:00.000'),
		plannedDurationSec: 3600, // 1 hour
		type: 'flexible',
		sortOrder: 0,
		status: 'pending',
		...overrides
	};
}

function createFlexibleTask(
	name: string,
	durationMinutes: number,
	sortOrder: number
): ConfirmedTask {
	return createMockTask({
		taskId: `task-${sortOrder}`,
		name,
		plannedDurationSec: durationMinutes * 60,
		type: 'flexible',
		sortOrder
	});
}

function createFixedTask(
	name: string,
	startTime: Date,
	durationMinutes: number,
	sortOrder: number
): ConfirmedTask {
	return createMockTask({
		taskId: `fixed-${sortOrder}`,
		name,
		plannedStart: startTime,
		plannedDurationSec: durationMinutes * 60,
		type: 'fixed',
		sortOrder
	});
}

// =============================================================================
// T008: Test Structure
// =============================================================================

describe('scheduleCalculator', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-26T08:30:00.000'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// =========================================================================
	// T009: Sequential task scheduling from start time
	// =========================================================================

	describe('sequential task scheduling', () => {
		it('calculates first task start time from schedule start', () => {
			const tasks = [createFlexibleTask('Task 1', 120, 0)]; // 2 hours
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.scheduledTasks).toHaveLength(1);
			expect(result.scheduledTasks[0].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T08:30:00.000').getTime()
			);
		});

		it('calculates second task start from first task end', () => {
			const tasks = [
				createFlexibleTask('Task 1', 120, 0), // 2 hours
				createFlexibleTask('Task 2', 30, 1) // 30 min
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.scheduledTasks).toHaveLength(2);
			// Task 1: 8:30 - 10:30
			expect(result.scheduledTasks[0].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T08:30:00.000').getTime()
			);
			expect(result.scheduledTasks[0].calculatedEnd.getTime()).toBe(
				new Date('2025-12-26T10:30:00.000').getTime()
			);
			// Task 2: 10:30 - 11:00
			expect(result.scheduledTasks[1].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T10:30:00.000').getTime()
			);
			expect(result.scheduledTasks[1].calculatedEnd.getTime()).toBe(
				new Date('2025-12-26T11:00:00.000').getTime()
			);
		});

		it('uses custom start time when mode is custom', () => {
			const tasks = [createFlexibleTask('Task 1', 60, 0)];
			const config: ScheduleConfig = {
				mode: 'custom',
				customStartTime: new Date('2025-12-26T09:30:00.000')
			};

			const result = calculateSchedule(tasks, config);

			expect(result.scheduledTasks[0].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T09:30:00.000').getTime()
			);
		});

		it('recalculates correctly when task order changes', () => {
			const tasks = [
				createFlexibleTask('Task A', 60, 0), // 1 hour
				createFlexibleTask('Task B', 30, 1), // 30 min
				createFlexibleTask('Task C', 45, 2) // 45 min
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Task A: 8:30 - 9:30
			// Task B: 9:30 - 10:00
			// Task C: 10:00 - 10:45
			expect(result.scheduledTasks[2].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T10:00:00.000').getTime()
			);
			expect(result.scheduledTasks[2].calculatedEnd.getTime()).toBe(
				new Date('2025-12-26T10:45:00.000').getTime()
			);
		});
	});

	// =========================================================================
	// T010: Fixed task respecting scheduled time
	// =========================================================================

	describe('fixed task scheduling', () => {
		it('fixed task uses its planned start time', () => {
			const tasks = [
				createFixedTask('Meeting', new Date('2025-12-26T09:00:00.000'), 60, 0)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.scheduledTasks[0].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T09:00:00.000').getTime()
			);
		});

		it('flexible tasks schedule around fixed tasks', () => {
			const tasks = [
				createFlexibleTask('Work', 60, 0), // 1 hour
				createFixedTask('Meeting', new Date('2025-12-26T10:00:00.000'), 60, 1) // Fixed at 10 AM
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Work: 8:30 - 9:30
			// Meeting: 10:00 - 11:00 (fixed)
			expect(result.scheduledTasks[0].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T08:30:00.000').getTime()
			);
			expect(result.scheduledTasks[1].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T10:00:00.000').getTime()
			);
		});

		it('fixed task does not move when other tasks change', () => {
			const tasks = [
				createFlexibleTask('Task 1', 30, 0),
				createFixedTask('Fixed Meeting', new Date('2025-12-26T14:00:00.000'), 60, 1),
				createFlexibleTask('Task 2', 30, 2)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Fixed meeting stays at 14:00 regardless of flexible tasks
			expect(result.scheduledTasks[1].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T14:00:00.000').getTime()
			);
		});
	});

	// =========================================================================
	// T011: Task interruption by fixed task
	// =========================================================================

	describe('task interruption', () => {
		it('marks flexible task as interrupted when fixed task overlaps', () => {
			const tasks = [
				createFlexibleTask('Deep Work', 120, 0), // 2 hours (8:30 - 10:30)
				createFixedTask('Meeting', new Date('2025-12-26T09:00:00.000'), 60, 1) // 9:00 - 10:00
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			const deepWork = result.scheduledTasks.find((st) => st.task.name === 'Deep Work');
			expect(deepWork?.isInterrupted).toBe(true);
			expect(deepWork?.pauseTime?.getTime()).toBe(
				new Date('2025-12-26T09:00:00.000').getTime()
			);
		});

		it('calculates correct duration before and after interruption', () => {
			const tasks = [
				createFlexibleTask('Deep Work', 120, 0), // 2 hours
				createFixedTask('Meeting', new Date('2025-12-26T09:00:00.000'), 60, 1) // 1 hour at 9 AM
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			const deepWork = result.scheduledTasks.find((st) => st.task.name === 'Deep Work');
			// Deep Work starts at 8:30, pauses at 9:00 (30 min worked)
			// Meeting 9:00 - 10:00
			// Deep Work resumes at 10:00, 90 min remaining
			expect(deepWork?.durationBeforePauseSec).toBe(30 * 60); // 30 minutes
			expect(deepWork?.remainingDurationSec).toBe(90 * 60); // 90 minutes
		});

		it('interrupted task resumes after fixed task completes', () => {
			const tasks = [
				createFlexibleTask('Deep Work', 120, 0), // 2 hours
				createFixedTask('Meeting', new Date('2025-12-26T09:00:00.000'), 60, 1),
				createFlexibleTask('Next Task', 30, 2)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Deep Work: 8:30-9:00 (pause), Meeting: 9:00-10:00, Deep Work resumes: 10:00-11:30
			// Next Task: 11:30-12:00
			const nextTask = result.scheduledTasks.find((st) => st.task.name === 'Next Task');
			expect(nextTask?.calculatedStart.getTime()).toBe(
				new Date('2025-12-26T11:30:00.000').getTime()
			);
		});
	});

	// =========================================================================
	// T012: Multiple consecutive fixed tasks
	// =========================================================================

	describe('multiple consecutive fixed tasks', () => {
		it('handles back-to-back fixed tasks correctly', () => {
			const tasks = [
				createFixedTask('Meeting 1', new Date('2025-12-26T09:00:00.000'), 60, 0),
				createFixedTask('Meeting 2', new Date('2025-12-26T10:00:00.000'), 60, 1),
				createFlexibleTask('Work', 60, 2)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.scheduledTasks[0].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T09:00:00.000').getTime()
			);
			expect(result.scheduledTasks[1].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T10:00:00.000').getTime()
			);
			// Work starts after Meeting 2
			expect(result.scheduledTasks[2].calculatedStart.getTime()).toBe(
				new Date('2025-12-26T11:00:00.000').getTime()
			);
		});

		it('flexible task interrupted by multiple consecutive fixed tasks', () => {
			const tasks = [
				createFlexibleTask('Long Work', 180, 0), // 3 hours (8:30 - 11:30)
				createFixedTask('Meeting 1', new Date('2025-12-26T09:00:00.000'), 30, 1), // 9:00-9:30
				createFixedTask('Meeting 2', new Date('2025-12-26T09:30:00.000'), 30, 2) // 9:30-10:00
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			const longWork = result.scheduledTasks.find((st) => st.task.name === 'Long Work');
			expect(longWork?.isInterrupted).toBe(true);
			// Should pause at first interruption (9:00)
			expect(longWork?.pauseTime?.getTime()).toBe(
				new Date('2025-12-26T09:00:00.000').getTime()
			);
		});
	});

	// =========================================================================
	// T013: Overnight overflow detection
	// =========================================================================

	describe('overnight overflow detection', () => {
		it('detects when schedule extends past midnight', () => {
			vi.setSystemTime(new Date('2025-12-26T22:00:00.000'));

			const tasks = [createFlexibleTask('Late Work', 180, 0)]; // 3 hours (22:00 - 01:00)
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.hasOverflow).toBe(true);
			expect(result.scheduleEndTime.getTime()).toBe(
				new Date('2025-12-27T01:00:00.000').getTime()
			);
		});

		it('no overflow when schedule ends before midnight', () => {
			const tasks = [createFlexibleTask('Morning Work', 120, 0)]; // 2 hours
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.hasOverflow).toBe(false);
		});

		it('hasScheduleOverflow utility function works correctly', () => {
			const start = new Date('2025-12-26T22:00:00.000');
			const endNextDay = new Date('2025-12-27T01:00:00.000');
			const endSameDay = new Date('2025-12-26T23:00:00.000');

			expect(hasScheduleOverflow(endNextDay, start)).toBe(true);
			expect(hasScheduleOverflow(endSameDay, start)).toBe(false);
		});
	});

	// =========================================================================
	// T014: Conflict detection between fixed tasks
	// =========================================================================

	describe('fixed task conflict detection', () => {
		it('detects overlapping fixed tasks', () => {
			const tasks = [
				createFixedTask('Meeting 1', new Date('2025-12-26T09:00:00.000'), 60, 0), // 9:00-10:00
				createFixedTask('Meeting 2', new Date('2025-12-26T09:30:00.000'), 60, 1) // 9:30-10:30 (overlaps!)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.conflicts).toHaveLength(1);
			expect(result.conflicts[0].overlapSec).toBe(30 * 60); // 30 min overlap
		});

		it('no conflicts when fixed tasks do not overlap', () => {
			const tasks = [
				createFixedTask('Meeting 1', new Date('2025-12-26T09:00:00.000'), 60, 0), // 9:00-10:00
				createFixedTask('Meeting 2', new Date('2025-12-26T10:00:00.000'), 60, 1) // 10:00-11:00
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			expect(result.conflicts).toHaveLength(0);
		});

		it('detectFixedTaskConflicts utility finds all conflicts', () => {
			const tasks = [
				createFixedTask('A', new Date('2025-12-26T09:00:00.000'), 60, 0),
				createFixedTask('B', new Date('2025-12-26T09:30:00.000'), 60, 1),
				createFixedTask('C', new Date('2025-12-26T10:00:00.000'), 60, 2)
			];

			const conflicts = detectFixedTaskConflicts(tasks);

			// A overlaps B (9:00-10:00 vs 9:30-10:30)
			// B overlaps C (9:30-10:30 vs 10:00-11:00)
			expect(conflicts).toHaveLength(2);
		});
	});

	// =========================================================================
	// T015: Empty task list handling
	// =========================================================================

	describe('empty task list', () => {
		it('handles empty task list gracefully', () => {
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule([], config);

			expect(result.scheduledTasks).toHaveLength(0);
			expect(result.hasOverflow).toBe(false);
			expect(result.conflicts).toHaveLength(0);
		});
	});

	// =========================================================================
	// T016: Zero-duration task (milestone) handling
	// =========================================================================

	describe('zero-duration tasks (milestones)', () => {
		it('handles zero-duration task as milestone', () => {
			const tasks = [
				createFlexibleTask('Work', 60, 0),
				createMockTask({
					taskId: 'milestone-1',
					name: 'Checkpoint',
					plannedDurationSec: 0,
					type: 'flexible',
					sortOrder: 1
				}),
				createFlexibleTask('More Work', 60, 2)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Milestone takes no time
			const milestone = result.scheduledTasks.find((st) => st.task.name === 'Checkpoint');
			expect(milestone?.calculatedStart.getTime()).toBe(milestone?.calculatedEnd.getTime());

			// Next task starts immediately after milestone
			const moreWork = result.scheduledTasks.find((st) => st.task.name === 'More Work');
			expect(moreWork?.calculatedStart.getTime()).toBe(
				result.scheduledTasks[0].calculatedEnd.getTime()
			);
		});
	});

	// =========================================================================
	// T017: Fixed appointment in the past handling
	// =========================================================================

	describe('fixed appointment in the past', () => {
		it('handles fixed task scheduled before current time', () => {
			// Current time is 8:30
			const tasks = [
				createFixedTask('Past Meeting', new Date('2025-12-26T08:00:00.000'), 60, 0) // 8:00-9:00
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Past fixed task should still use its planned time or start at cursor
			// The spec says "treated as already completed" or "starts immediately"
			// Implementation may vary - key is it doesn't break
			expect(result.scheduledTasks).toHaveLength(1);
		});

		it('flexible tasks after past fixed task schedule correctly', () => {
			const tasks = [
				createFixedTask('Past Meeting', new Date('2025-12-26T08:00:00.000'), 30, 0), // 8:00-8:30
				createFlexibleTask('Work', 60, 1)
			];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };

			const result = calculateSchedule(tasks, config);

			// Work should start at current time (8:30) since past meeting is done
			const work = result.scheduledTasks.find((st) => st.task.name === 'Work');
			expect(work?.calculatedStart.getTime()).toBeGreaterThanOrEqual(
				new Date('2025-12-26T08:30:00.000').getTime()
			);
		});
	});

	// =========================================================================
	// T018: Debounced calculation
	// =========================================================================

	describe('debounced calculation', () => {
		it('debounces rapid calls to calculateSchedule', async () => {
			const tasks = [createFlexibleTask('Task', 60, 0)];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };
			const callback = vi.fn();

			// Make multiple rapid calls
			calculateScheduleDebounced(tasks, config, callback);
			calculateScheduleDebounced(tasks, config, callback);
			calculateScheduleDebounced(tasks, config, callback);

			// Callback should not have been called yet
			expect(callback).not.toHaveBeenCalled();

			// Advance timers past debounce delay (300ms)
			await vi.advanceTimersByTimeAsync(350);

			// Should only be called once
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('returns cancel function that stops pending calculation', async () => {
			const tasks = [createFlexibleTask('Task', 60, 0)];
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };
			const callback = vi.fn();

			const cancel = calculateScheduleDebounced(tasks, config, callback);

			// Cancel before debounce completes
			cancel();
			await vi.advanceTimersByTimeAsync(350);

			// Should not have been called
			expect(callback).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// getScheduleStartTime utility
	// =========================================================================

	describe('getScheduleStartTime', () => {
		it('returns current time for mode "now"', () => {
			const config: ScheduleConfig = { mode: 'now', customStartTime: null };
			const result = getScheduleStartTime(config);
			expect(result.getTime()).toBe(new Date('2025-12-26T08:30:00.000').getTime());
		});

		it('returns custom time for mode "custom"', () => {
			const customTime = new Date('2025-12-26T14:00:00.000');
			const config: ScheduleConfig = { mode: 'custom', customStartTime: customTime };
			const result = getScheduleStartTime(config);
			expect(result.getTime()).toBe(customTime.getTime());
		});
	});

	// =========================================================================
	// calculateInterruptionSplit utility
	// =========================================================================

	describe('calculateInterruptionSplit', () => {
		it('calculates correct split for interrupted task', () => {
			const task = createFlexibleTask('Work', 120, 0); // 2 hours
			const flexibleStart = new Date('2025-12-26T08:30:00.000');
			const fixedStart = new Date('2025-12-26T09:00:00.000');

			const split = calculateInterruptionSplit(task, flexibleStart, fixedStart);

			expect(split.beforePauseSec).toBe(30 * 60); // 30 minutes before pause
			expect(split.remainingSec).toBe(90 * 60); // 90 minutes remaining
		});
	});
});
