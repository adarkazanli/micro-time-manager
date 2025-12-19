import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	calculateProjectedStart,
	calculateRiskLevel,
	createProjectedTasks
} from '$lib/services/projection';
import type { ConfirmedTask, TaskProgress } from '$lib/types';
import { WARNING_THRESHOLD_MS } from '$lib/types';

describe('calculateProjectedStart', () => {
	// Fixed timestamp for deterministic tests
	const nowMs = new Date('2025-12-18T09:00:00.000').getTime();

	it('returns current time for the current task (index 0, elapsed 0)', () => {
		const tasks = createMockTasks(3);
		const result = calculateProjectedStart(tasks, 0, 0, 0, nowMs);
		expect(result.getTime()).toBe(nowMs);
	});

	it('projects start time for next task based on current task remaining time', () => {
		const tasks = createMockTasks(3);
		// Current task (index 0) has 30 min duration, 10 min elapsed
		const currentElapsedMs = 10 * 60 * 1000; // 10 minutes
		const result = calculateProjectedStart(tasks, 0, currentElapsedMs, 1, nowMs);
		// Should be now + (30 - 10) = 20 minutes from now
		const expected = new Date('2025-12-18T09:20:00.000');
		expect(result.getTime()).toBe(expected.getTime());
	});

	it('projects start time for task 2 hops away', () => {
		const tasks = createMockTasks(3);
		// Current task (index 0) has 30 min duration, 10 min elapsed
		// Next task (index 1) has 30 min duration
		const currentElapsedMs = 10 * 60 * 1000;
		const result = calculateProjectedStart(tasks, 0, currentElapsedMs, 2, nowMs);
		// Should be now + 20 (remaining on task 0) + 30 (task 1 duration) = 50 min
		const expected = new Date('2025-12-18T09:50:00.000');
		expect(result.getTime()).toBe(expected.getTime());
	});

	it('handles overtime on current task (elapsed > planned)', () => {
		const tasks = createMockTasks(3);
		// Task has 30 min planned but we've spent 45 min (15 min overtime)
		const currentElapsedMs = 45 * 60 * 1000;
		const result = calculateProjectedStart(tasks, 0, currentElapsedMs, 1, nowMs);
		// Remaining on current is 0 (can't be negative), so next starts now
		const expected = new Date('2025-12-18T09:00:00.000');
		expect(result.getTime()).toBe(expected.getTime());
	});

	it('returns correct start for already completed tasks (before current index)', () => {
		const tasks = createMockTasks(3);
		// We're on task 2, asking for task 1's projected start (completed)
		const result = calculateProjectedStart(tasks, 2, 0, 1, nowMs);
		// Completed task should return its planned start
		expect(result.getTime()).toBe(tasks[1].plannedStart.getTime());
	});
});

describe('calculateRiskLevel', () => {
	it('returns "green" when buffer > 5 minutes', () => {
		const projectedStart = new Date('2025-12-18T09:50:00.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // 10 min buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('green');
	});

	it('returns "green" at exactly 5 minutes 1 second buffer', () => {
		const projectedStart = new Date('2025-12-18T09:54:59.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // 5:01 buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('green');
	});

	it('returns "yellow" at exactly 5 minutes buffer', () => {
		const projectedStart = new Date('2025-12-18T09:55:00.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // 5 min buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('yellow');
	});

	it('returns "yellow" when buffer is between 0 and 5 minutes', () => {
		const projectedStart = new Date('2025-12-18T09:57:00.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // 3 min buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('yellow');
	});

	it('returns "yellow" at 1 second buffer', () => {
		const projectedStart = new Date('2025-12-18T09:59:59.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // 1 sec buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('yellow');
	});

	it('returns "red" when buffer is exactly 0', () => {
		const projectedStart = new Date('2025-12-18T10:00:00.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // 0 buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('red');
	});

	it('returns "red" when projected is after scheduled (negative buffer)', () => {
		const projectedStart = new Date('2025-12-18T10:05:00.000');
		const scheduledStart = new Date('2025-12-18T10:00:00.000'); // -5 min buffer
		expect(calculateRiskLevel(projectedStart, scheduledStart)).toBe('red');
	});

	it('uses WARNING_THRESHOLD_MS constant (5 minutes = 300000ms)', () => {
		// Verify the threshold is what we expect
		expect(WARNING_THRESHOLD_MS).toBe(300000);
	});
});

describe('createProjectedTasks', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-18T09:00:00.000'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('creates projected tasks with correct displayStatus for completed tasks', () => {
		const tasks = createMockTasks(3);
		const progress = createMockProgress(tasks, 1); // Task 0 complete, task 1 current
		const result = createProjectedTasks(tasks, progress, 1, 0);

		expect(result[0].displayStatus).toBe('completed');
		expect(result[1].displayStatus).toBe('current');
		expect(result[2].displayStatus).toBe('pending');
	});

	it('sets isDraggable correctly for flexible pending tasks', () => {
		const tasks = createMockTasks(3);
		tasks[2].type = 'flexible'; // Make last task flexible
		const progress = createMockProgress(tasks, 1);
		const result = createProjectedTasks(tasks, progress, 1, 0);

		expect(result[0].isDraggable).toBe(false); // Completed
		expect(result[1].isDraggable).toBe(false); // Current
		expect(result[2].isDraggable).toBe(true); // Pending + flexible
	});

	it('sets isDraggable false for fixed pending tasks', () => {
		const tasks = createMockTasks(3);
		tasks[2].type = 'fixed'; // Make last task fixed
		const progress = createMockProgress(tasks, 1);
		const result = createProjectedTasks(tasks, progress, 1, 0);

		expect(result[2].isDraggable).toBe(false); // Fixed can't be dragged
	});

	it('calculates riskLevel only for fixed tasks', () => {
		const tasks = createMockTasks(3);
		tasks[1].type = 'fixed';
		tasks[2].type = 'flexible';
		const progress = createMockProgress(tasks, 0);
		const result = createProjectedTasks(tasks, progress, 0, 0);

		expect(result[0].riskLevel).toBeNull(); // Current task (flexible)
		expect(result[1].riskLevel).not.toBeNull(); // Fixed task has risk level
		expect(result[2].riskLevel).toBeNull(); // Flexible task
	});

	it('calculates projectedEnd correctly', () => {
		const tasks = createMockTasks(3);
		const progress = createMockProgress(tasks, 0);
		const result = createProjectedTasks(tasks, progress, 0, 0);

		// First task: starts now, duration 30 min = ends at 09:30
		const expectedEnd = new Date('2025-12-18T09:30:00.000');
		expect(result[0].projectedEnd.getTime()).toBe(expectedEnd.getTime());
	});

	it('calculates bufferSec correctly for fixed tasks', () => {
		const tasks = createMockTasks(3);
		tasks[1].type = 'fixed';
		tasks[1].plannedStart = new Date('2025-12-18T10:00:00.000');
		const progress = createMockProgress(tasks, 0);
		// No elapsed time, task 0 is 30 min, so task 1 projects at 09:30
		// Scheduled at 10:00, buffer = 30 min = 1800 sec
		const result = createProjectedTasks(tasks, progress, 0, 0);

		expect(result[1].bufferSec).toBe(1800);
	});

	it('returns negative bufferSec when running late', () => {
		const tasks = createMockTasks(3);
		tasks[1].type = 'fixed';
		tasks[1].plannedStart = new Date('2025-12-18T09:20:00.000');
		const progress = createMockProgress(tasks, 0);
		// Task 0 is 30 min, projects task 1 at 09:30
		// Scheduled at 09:20, buffer = -10 min = -600 sec
		const result = createProjectedTasks(tasks, progress, 0, 0);

		expect(result[1].bufferSec).toBe(-600);
	});

	it('handles empty task list', () => {
		const result = createProjectedTasks([], [], 0, 0);
		expect(result).toEqual([]);
	});

	it('preserves task reference in result', () => {
		const tasks = createMockTasks(2);
		const progress = createMockProgress(tasks, 0);
		const result = createProjectedTasks(tasks, progress, 0, 0);

		expect(result[0].task).toBe(tasks[0]);
		expect(result[1].task).toBe(tasks[1]);
	});
});

// Helper functions

function createMockTasks(count: number): ConfirmedTask[] {
	const tasks: ConfirmedTask[] = [];
	const baseTime = new Date('2025-12-18T09:00:00.000');

	for (let i = 0; i < count; i++) {
		const startTime = new Date(baseTime.getTime() + i * 30 * 60 * 1000); // 30 min intervals
		tasks.push({
			taskId: `task-${i}`,
			name: `Task ${i + 1}`,
			plannedStart: startTime,
			plannedDurationSec: 30 * 60, // 30 minutes
			type: 'flexible',
			sortOrder: i,
			status: 'pending'
		});
	}

	return tasks;
}

function createMockProgress(tasks: ConfirmedTask[], currentIndex: number): TaskProgress[] {
	return tasks.map((task, i) => ({
		taskId: task.taskId,
		plannedDurationSec: task.plannedDurationSec,
		actualDurationSec: i < currentIndex ? task.plannedDurationSec : 0,
		completedAt: i < currentIndex ? new Date().toISOString() : null,
		status: i < currentIndex ? 'complete' : i === currentIndex ? 'active' : 'pending'
	}));
}
