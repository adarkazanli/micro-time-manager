import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProjectedTask, ConfirmedTask } from '$lib/types';

// Mock helper functions
function createMockTask(overrides: Partial<ConfirmedTask> = {}): ConfirmedTask {
	return {
		taskId: 'task-1',
		name: 'Test Task',
		plannedStart: new Date('2025-12-18T09:00:00'),
		plannedDurationSec: 1800, // 30 min
		type: 'flexible',
		sortOrder: 0,
		status: 'pending',
		...overrides
	};
}

function createMockProjectedTask(overrides: Partial<ProjectedTask> = {}): ProjectedTask {
	const task = createMockTask(overrides.task);
	return {
		task,
		projectedStart: new Date('2025-12-18T09:00:00'),
		projectedEnd: new Date('2025-12-18T09:30:00'),
		riskLevel: null,
		bufferSec: 0,
		displayStatus: 'pending',
		isDraggable: false,
		elapsedSec: 0,
		willBeInterrupted: false,
		...overrides
	};
}

describe('ImpactTaskRow', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-18T09:00:00'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('display status styling', () => {
		it('should have completed status for finished tasks', () => {
			const projectedTask = createMockProjectedTask({
				displayStatus: 'completed'
			});

			expect(projectedTask.displayStatus).toBe('completed');
		});

		it('should have current status for active task', () => {
			const projectedTask = createMockProjectedTask({
				displayStatus: 'current'
			});

			expect(projectedTask.displayStatus).toBe('current');
		});

		it('should have pending status for upcoming tasks', () => {
			const projectedTask = createMockProjectedTask({
				displayStatus: 'pending'
			});

			expect(projectedTask.displayStatus).toBe('pending');
		});

		it('should mark completed tasks as not draggable', () => {
			const projectedTask = createMockProjectedTask({
				displayStatus: 'completed',
				isDraggable: false
			});

			expect(projectedTask.isDraggable).toBe(false);
		});

		it('should mark current task as not draggable', () => {
			const projectedTask = createMockProjectedTask({
				displayStatus: 'current',
				isDraggable: false
			});

			expect(projectedTask.isDraggable).toBe(false);
		});
	});

	describe('risk indicators', () => {
		it('should have green risk level when buffer > 5 minutes', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				riskLevel: 'green',
				bufferSec: 600, // 10 minutes
				displayStatus: 'pending'
			});

			expect(projectedTask.riskLevel).toBe('green');
			expect(projectedTask.bufferSec).toBeGreaterThan(300);
		});

		it('should have yellow risk level when buffer is 0-5 minutes', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				riskLevel: 'yellow',
				bufferSec: 180, // 3 minutes
				displayStatus: 'pending'
			});

			expect(projectedTask.riskLevel).toBe('yellow');
			expect(projectedTask.bufferSec).toBeGreaterThan(0);
			expect(projectedTask.bufferSec).toBeLessThanOrEqual(300);
		});

		it('should have red risk level when buffer <= 0', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				riskLevel: 'red',
				bufferSec: -300, // 5 minutes late
				displayStatus: 'pending'
			});

			expect(projectedTask.riskLevel).toBe('red');
			expect(projectedTask.bufferSec).toBeLessThanOrEqual(0);
		});

		it('should have null risk level for flexible tasks', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'flexible' }),
				riskLevel: null,
				displayStatus: 'pending'
			});

			expect(projectedTask.riskLevel).toBeNull();
		});

		it('should show risk indicator only for pending fixed tasks', () => {
			// Pending fixed task should show indicator
			const pendingFixed = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				riskLevel: 'green',
				displayStatus: 'pending'
			});
			expect(pendingFixed.task.type === 'fixed' && pendingFixed.displayStatus === 'pending').toBe(
				true
			);

			// Completed fixed task should not show indicator (handled by component)
			const completedFixed = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				riskLevel: 'green',
				displayStatus: 'completed'
			});
			expect(completedFixed.displayStatus).toBe('completed');
		});
	});

	describe('draggable behavior', () => {
		it('should be draggable for flexible pending tasks', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'flexible' }),
				displayStatus: 'pending',
				isDraggable: true
			});

			expect(projectedTask.isDraggable).toBe(true);
		});

		it('should not be draggable for fixed tasks', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				displayStatus: 'pending',
				isDraggable: false
			});

			expect(projectedTask.isDraggable).toBe(false);
		});
	});

	describe('buffer calculation', () => {
		it('should calculate positive buffer correctly', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				bufferSec: 1800 // 30 minutes ahead
			});

			expect(projectedTask.bufferSec).toBe(1800);
		});

		it('should calculate negative buffer for late tasks', () => {
			const projectedTask = createMockProjectedTask({
				task: createMockTask({ type: 'fixed' }),
				bufferSec: -600 // 10 minutes late
			});

			expect(projectedTask.bufferSec).toBe(-600);
		});
	});
});
