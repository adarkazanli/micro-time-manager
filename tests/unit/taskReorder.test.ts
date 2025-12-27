/**
 * Unit tests for task reorder utilities
 *
 * Feature: 012-fixed-task-reorder
 * Task: T005
 */

import { describe, it, expect } from 'vitest';
import { reorderTaskChronologically, findChronologicalPosition } from '$lib/utils/taskOrder';
import type { ConfirmedTask, DraftTask } from '$lib/types';

// Helper to create a mock ConfirmedTask
function createConfirmedTask(
	taskId: string,
	startTime: Date,
	type: 'fixed' | 'flexible' = 'flexible'
): ConfirmedTask {
	return {
		taskId,
		name: `Task ${taskId}`,
		plannedStart: startTime,
		plannedDurationSec: 1800, // 30 minutes
		type,
		sortOrder: 0,
		status: 'pending'
	};
}

// Helper to create a mock DraftTask
function createDraftTask(
	id: string,
	startTime: Date,
	type: 'fixed' | 'flexible' = 'flexible'
): DraftTask {
	return {
		id,
		name: `Task ${id}`,
		startTime,
		durationSeconds: 1800,
		type,
		sortOrder: 0,
		hasWarning: false
	};
}

describe('reorderTaskChronologically', () => {
	describe('with ConfirmedTask', () => {
		it('moves task to correct position when time is earlier than others', () => {
			const tasks = [
				createConfirmedTask('a', new Date('2025-01-01T08:00')),
				createConfirmedTask('b', new Date('2025-01-01T09:00')),
				createConfirmedTask('c', new Date('2025-01-01T10:00'))
			];

			// Move task 'c' to 7:30 (before all others)
			const result = reorderTaskChronologically(
				tasks,
				'c',
				new Date('2025-01-01T07:30')
			);

			expect(result.map((t) => t.taskId)).toEqual(['c', 'a', 'b']);
			expect(result[0].type).toBe('fixed');
			expect(result[0].plannedStart.getTime()).toBe(
				new Date('2025-01-01T07:30').getTime()
			);
		});

		it('moves task to correct position when time is in the middle', () => {
			const tasks = [
				createConfirmedTask('a', new Date('2025-01-01T08:00')),
				createConfirmedTask('b', new Date('2025-01-01T09:00')),
				createConfirmedTask('c', new Date('2025-01-01T11:00'))
			];

			// Move task 'a' to 10:00 (between b and c)
			const result = reorderTaskChronologically(
				tasks,
				'a',
				new Date('2025-01-01T10:00')
			);

			expect(result.map((t) => t.taskId)).toEqual(['b', 'a', 'c']);
		});

		it('moves task to end when time is later than all others', () => {
			const tasks = [
				createConfirmedTask('a', new Date('2025-01-01T08:00')),
				createConfirmedTask('b', new Date('2025-01-01T09:00')),
				createConfirmedTask('c', new Date('2025-01-01T10:00'))
			];

			// Move task 'a' to 11:00 (after all others)
			const result = reorderTaskChronologically(
				tasks,
				'a',
				new Date('2025-01-01T11:00')
			);

			expect(result.map((t) => t.taskId)).toEqual(['b', 'c', 'a']);
		});

		it('keeps task in place when position is already correct', () => {
			const tasks = [
				createConfirmedTask('a', new Date('2025-01-01T08:00')),
				createConfirmedTask('b', new Date('2025-01-01T09:00'))
			];

			// Move task 'a' to 7:00 (still first)
			const result = reorderTaskChronologically(
				tasks,
				'a',
				new Date('2025-01-01T07:00')
			);

			expect(result.map((t) => t.taskId)).toEqual(['a', 'b']);
		});

		it('returns original array when task not found', () => {
			const tasks = [
				createConfirmedTask('a', new Date('2025-01-01T08:00')),
				createConfirmedTask('b', new Date('2025-01-01T09:00'))
			];

			const result = reorderTaskChronologically(
				tasks,
				'nonexistent',
				new Date('2025-01-01T10:00')
			);

			expect(result).toBe(tasks);
		});

		it('handles single task array', () => {
			const tasks = [createConfirmedTask('a', new Date('2025-01-01T08:00'))];

			const result = reorderTaskChronologically(
				tasks,
				'a',
				new Date('2025-01-01T10:00')
			);

			expect(result.length).toBe(1);
			expect(result[0].taskId).toBe('a');
			expect(result[0].type).toBe('fixed');
		});

		it('handles same-time tasks by inserting before the matching time', () => {
			const tasks = [
				createConfirmedTask('a', new Date('2025-01-01T08:00')),
				createConfirmedTask('b', new Date('2025-01-01T09:00')),
				createConfirmedTask('c', new Date('2025-01-01T10:00'))
			];

			// Move task 'c' to same time as 'b' (9:00)
			const result = reorderTaskChronologically(
				tasks,
				'c',
				new Date('2025-01-01T09:00')
			);

			// Should be inserted before 'b' since times are equal
			expect(result.map((t) => t.taskId)).toEqual(['a', 'c', 'b']);
		});
	});

	describe('with DraftTask', () => {
		it('moves draft task to correct position', () => {
			const tasks = [
				createDraftTask('a', new Date('2025-01-01T08:00')),
				createDraftTask('b', new Date('2025-01-01T09:00')),
				createDraftTask('c', new Date('2025-01-01T10:00'))
			];

			const result = reorderTaskChronologically(
				tasks,
				'c',
				new Date('2025-01-01T07:30')
			);

			expect(result.map((t) => t.id)).toEqual(['c', 'a', 'b']);
			expect(result[0].type).toBe('fixed');
		});
	});
});

describe('findChronologicalPosition', () => {
	it('returns 0 for earliest time', () => {
		const tasks = [
			createConfirmedTask('a', new Date('2025-01-01T08:00')),
			createConfirmedTask('b', new Date('2025-01-01T09:00'))
		];

		const position = findChronologicalPosition(
			tasks,
			'b',
			new Date('2025-01-01T07:00')
		);

		expect(position).toBe(0);
	});

	it('returns correct position for middle time', () => {
		const tasks = [
			createConfirmedTask('a', new Date('2025-01-01T08:00')),
			createConfirmedTask('b', new Date('2025-01-01T09:00')),
			createConfirmedTask('c', new Date('2025-01-01T11:00'))
		];

		const position = findChronologicalPosition(
			tasks,
			'b',
			new Date('2025-01-01T10:00')
		);

		// Should be position 1 (after 'a', before 'c', excluding 'b' from count)
		expect(position).toBe(1);
	});

	it('returns array length for latest time', () => {
		const tasks = [
			createConfirmedTask('a', new Date('2025-01-01T08:00')),
			createConfirmedTask('b', new Date('2025-01-01T09:00'))
		];

		const position = findChronologicalPosition(
			tasks,
			'a',
			new Date('2025-01-01T10:00')
		);

		// Should be position 1 (end of array excluding 'a')
		expect(position).toBe(1);
	});
});
