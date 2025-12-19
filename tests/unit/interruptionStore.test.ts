/**
 * Unit tests for interruptionStore
 *
 * Feature: 004-interruption-tracking
 * Tasks: T007-T012 - Unit tests for interruptionStore methods
 *
 * Tests: startInterruption, endInterruption, updateInterruption,
 *        getTaskSummary, reset, restore
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Interruption, InterruptionCategory } from '$lib/types';

describe('interruptionStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-19T09:00:00.000Z'));

		// Mock localStorage
		const store: Record<string, string> = {};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] || null);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
			store[key] = value;
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
			delete store[key];
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	// ==========================================================================
	// T007: Create test file with describe blocks
	// ==========================================================================

	describe('initial state', () => {
		it('should start with isInterrupted = false', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			expect(interruptionStore.isInterrupted).toBe(false);
		});

		it('should start with activeInterruption = null', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			expect(interruptionStore.activeInterruption).toBeNull();
		});

		it('should start with elapsedMs = 0', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			expect(interruptionStore.elapsedMs).toBe(0);
		});

		it('should start with empty interruptions array', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			expect(interruptionStore.interruptions).toEqual([]);
		});
	});

	// ==========================================================================
	// T008: Tests for startInterruption()
	// ==========================================================================

	describe('startInterruption()', () => {
		it('should set isInterrupted to true', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(interruptionStore.isInterrupted).toBe(true);
		});

		it('should create activeInterruption with correct taskId', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-123');

			expect(interruptionStore.activeInterruption).not.toBeNull();
			expect(interruptionStore.activeInterruption?.taskId).toBe('task-123');
		});

		it('should create activeInterruption with startedAt timestamp', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(interruptionStore.activeInterruption?.startedAt).toBeDefined();
			// Should be valid ISO string
			expect(new Date(interruptionStore.activeInterruption!.startedAt).toISOString()).toBe(
				interruptionStore.activeInterruption?.startedAt
			);
		});

		it('should create activeInterruption with endedAt = null', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(interruptionStore.activeInterruption?.endedAt).toBeNull();
		});

		it('should create activeInterruption with durationSec = 0', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(interruptionStore.activeInterruption?.durationSec).toBe(0);
		});

		it('should create activeInterruption with category = null', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(interruptionStore.activeInterruption?.category).toBeNull();
		});

		it('should create activeInterruption with note = null', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(interruptionStore.activeInterruption?.note).toBeNull();
		});

		it('should create activeInterruption with UUID interruptionId', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(interruptionStore.activeInterruption?.interruptionId).toMatch(uuidRegex);
		});

		it('should throw error when already interrupted', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			expect(() => interruptionStore.startInterruption('task-2')).toThrow('Already interrupted');
		});
	});

	// ==========================================================================
	// T009: Tests for endInterruption()
	// ==========================================================================

	describe('endInterruption()', () => {
		it('should set isInterrupted to false', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			expect(interruptionStore.isInterrupted).toBe(false);
		});

		it('should set activeInterruption to null', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			expect(interruptionStore.activeInterruption).toBeNull();
		});

		it('should return the completed interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			const result = interruptionStore.endInterruption();

			expect(result).not.toBeNull();
			expect(result.taskId).toBe('task-1');
		});

		it('should set endedAt timestamp on completed interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			const result = interruptionStore.endInterruption();

			expect(result.endedAt).not.toBeNull();
			// Should be valid ISO string
			expect(new Date(result.endedAt!).toISOString()).toBe(result.endedAt);
		});

		it('should calculate durationSec correctly', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');

			// Advance time by 5 minutes (300000ms)
			vi.advanceTimersByTime(300000);

			const result = interruptionStore.endInterruption();

			// Duration should be approximately 300 seconds (5 minutes)
			expect(result.durationSec).toBeGreaterThanOrEqual(299);
			expect(result.durationSec).toBeLessThanOrEqual(301);
		});

		it('should add completed interruption to interruptions array', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			expect(interruptionStore.interruptions).toHaveLength(1);
			expect(interruptionStore.interruptions[0].taskId).toBe('task-1');
		});

		it('should reset elapsedMs to 0', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			expect(interruptionStore.elapsedMs).toBe(0);
		});

		it('should throw error when not interrupted', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			expect(() => interruptionStore.endInterruption()).toThrow('Not interrupted');
		});

		it('should accumulate multiple interruptions', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			interruptionStore.startInterruption('task-2');
			interruptionStore.endInterruption();

			expect(interruptionStore.interruptions).toHaveLength(3);
		});
	});

	// ==========================================================================
	// T010: Tests for updateInterruption()
	// ==========================================================================

	describe('updateInterruption()', () => {
		it('should update category on recorded interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			const completed = interruptionStore.endInterruption();

			interruptionStore.updateInterruption(completed.interruptionId, { category: 'Phone' });

			expect(interruptionStore.interruptions[0].category).toBe('Phone');
		});

		it('should update note on recorded interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			const completed = interruptionStore.endInterruption();

			interruptionStore.updateInterruption(completed.interruptionId, { note: 'Quick call from client' });

			expect(interruptionStore.interruptions[0].note).toBe('Quick call from client');
		});

		it('should update both category and note', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			const completed = interruptionStore.endInterruption();

			interruptionStore.updateInterruption(completed.interruptionId, {
				category: 'Colleague',
				note: 'John needed help'
			});

			expect(interruptionStore.interruptions[0].category).toBe('Colleague');
			expect(interruptionStore.interruptions[0].note).toBe('John needed help');
		});

		it('should not modify other fields', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			const completed = interruptionStore.endInterruption();

			const originalTaskId = completed.taskId;
			const originalDurationSec = completed.durationSec;
			const originalStartedAt = completed.startedAt;

			interruptionStore.updateInterruption(completed.interruptionId, { category: 'Personal' });

			expect(interruptionStore.interruptions[0].taskId).toBe(originalTaskId);
			expect(interruptionStore.interruptions[0].durationSec).toBe(originalDurationSec);
			expect(interruptionStore.interruptions[0].startedAt).toBe(originalStartedAt);
		});

		it('should throw error for invalid ID', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			expect(() =>
				interruptionStore.updateInterruption('non-existent-id', { category: 'Phone' })
			).toThrow('Interruption not found');
		});

		it('should support all valid categories', async () => {
			const { interruptionStore: _store } = await import('$lib/stores/interruptionStore.svelte');
			const categories: InterruptionCategory[] = ['Phone', 'Luci', 'Colleague', 'Personal', 'Other'];

			for (const category of categories) {
				vi.resetModules();
				const { interruptionStore: store } = await import('$lib/stores/interruptionStore.svelte');

				store.startInterruption('task-1');
				const completed = store.endInterruption();
				store.updateInterruption(completed.interruptionId, { category });

				expect(store.interruptions[0].category).toBe(category);
			}
		});
	});

	// ==========================================================================
	// T011: Tests for getTaskSummary()
	// ==========================================================================

	describe('getTaskSummary()', () => {
		it('should return summary with count = 0 for task with no interruptions', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const summary = interruptionStore.getTaskSummary('task-1');

			expect(summary.count).toBe(0);
		});

		it('should return summary with totalDurationSec = 0 for task with no interruptions', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const summary = interruptionStore.getTaskSummary('task-1');

			expect(summary.totalDurationSec).toBe(0);
		});

		it('should return correct taskId in summary', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const summary = interruptionStore.getTaskSummary('task-123');

			expect(summary.taskId).toBe('task-123');
		});

		it('should count single interruption correctly', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000); // 1 minute
			interruptionStore.endInterruption();

			const summary = interruptionStore.getTaskSummary('task-1');

			expect(summary.count).toBe(1);
		});

		it('should calculate totalDurationSec for single interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(120000); // 2 minutes
			interruptionStore.endInterruption();

			const summary = interruptionStore.getTaskSummary('task-1');

			// Should be approximately 120 seconds
			expect(summary.totalDurationSec).toBeGreaterThanOrEqual(119);
			expect(summary.totalDurationSec).toBeLessThanOrEqual(121);
		});

		it('should count multiple interruptions for same task', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// First interruption
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			// Second interruption
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(30000);
			interruptionStore.endInterruption();

			// Third interruption
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(90000);
			interruptionStore.endInterruption();

			const summary = interruptionStore.getTaskSummary('task-1');

			expect(summary.count).toBe(3);
		});

		it('should sum totalDurationSec for multiple interruptions', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// First interruption: 60 seconds
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			// Second interruption: 30 seconds
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(30000);
			interruptionStore.endInterruption();

			const summary = interruptionStore.getTaskSummary('task-1');

			// Should be approximately 90 seconds total
			expect(summary.totalDurationSec).toBeGreaterThanOrEqual(89);
			expect(summary.totalDurationSec).toBeLessThanOrEqual(91);
		});

		it('should only count interruptions for specified task', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// Interruption for task-1
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			// Interruption for task-2
			interruptionStore.startInterruption('task-2');
			vi.advanceTimersByTime(120000);
			interruptionStore.endInterruption();

			// Another for task-1
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(30000);
			interruptionStore.endInterruption();

			const summaryTask1 = interruptionStore.getTaskSummary('task-1');
			const summaryTask2 = interruptionStore.getTaskSummary('task-2');

			expect(summaryTask1.count).toBe(2);
			expect(summaryTask2.count).toBe(1);
		});

		it('should not include active (ongoing) interruption in summary', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// Complete one interruption
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			// Start another but don't end it
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(30000);

			const summary = interruptionStore.getTaskSummary('task-1');

			// Should only count the completed one
			expect(summary.count).toBe(1);
		});
	});

	// ==========================================================================
	// T012: Tests for reset() and restore()
	// ==========================================================================

	describe('reset()', () => {
		it('should set isInterrupted to false', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.reset();

			expect(interruptionStore.isInterrupted).toBe(false);
		});

		it('should set activeInterruption to null', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.reset();

			expect(interruptionStore.activeInterruption).toBeNull();
		});

		it('should clear interruptions array', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();
			interruptionStore.startInterruption('task-2');
			interruptionStore.endInterruption();

			interruptionStore.reset();

			expect(interruptionStore.interruptions).toHaveLength(0);
		});

		it('should reset elapsedMs to 0', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.reset();

			expect(interruptionStore.elapsedMs).toBe(0);
		});
	});

	describe('restore()', () => {
		it('should restore interruptions array from saved data', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'int-1',
					taskId: 'task-1',
					startedAt: '2025-12-19T09:00:00.000Z',
					endedAt: '2025-12-19T09:05:00.000Z',
					durationSec: 300,
					category: 'Phone',
					note: 'Client call'
				},
				{
					interruptionId: 'int-2',
					taskId: 'task-1',
					startedAt: '2025-12-19T09:30:00.000Z',
					endedAt: '2025-12-19T09:32:00.000Z',
					durationSec: 120,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			expect(interruptionStore.interruptions).toHaveLength(2);
			expect(interruptionStore.interruptions[0].interruptionId).toBe('int-1');
			expect(interruptionStore.interruptions[1].interruptionId).toBe('int-2');
		});

		it('should preserve all fields from saved interruptions', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruption: Interruption = {
				interruptionId: 'int-test',
				taskId: 'task-42',
				startedAt: '2025-12-19T09:00:00.000Z',
				endedAt: '2025-12-19T09:10:00.000Z',
				durationSec: 600,
				category: 'Colleague',
				note: 'Help with code review'
			};

			interruptionStore.restore([savedInterruption]);

			const restored = interruptionStore.interruptions[0];
			expect(restored.interruptionId).toBe('int-test');
			expect(restored.taskId).toBe('task-42');
			expect(restored.startedAt).toBe('2025-12-19T09:00:00.000Z');
			expect(restored.endedAt).toBe('2025-12-19T09:10:00.000Z');
			expect(restored.durationSec).toBe(600);
			expect(restored.category).toBe('Colleague');
			expect(restored.note).toBe('Help with code review');
		});

		it('should clear existing interruptions before restoring', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// Add some interruptions first
			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();
			interruptionStore.startInterruption('task-2');
			interruptionStore.endInterruption();

			expect(interruptionStore.interruptions).toHaveLength(2);

			// Restore with different data
			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'int-restored',
					taskId: 'task-3',
					startedAt: '2025-12-19T10:00:00.000Z',
					endedAt: '2025-12-19T10:05:00.000Z',
					durationSec: 300,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			expect(interruptionStore.interruptions).toHaveLength(1);
			expect(interruptionStore.interruptions[0].interruptionId).toBe('int-restored');
		});

		it('should handle empty array restore', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			interruptionStore.endInterruption();

			interruptionStore.restore([]);

			expect(interruptionStore.interruptions).toHaveLength(0);
		});

		it('should allow getTaskSummary after restore', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'int-1',
					taskId: 'task-1',
					startedAt: '2025-12-19T09:00:00.000Z',
					endedAt: '2025-12-19T09:05:00.000Z',
					durationSec: 300,
					category: null,
					note: null
				},
				{
					interruptionId: 'int-2',
					taskId: 'task-1',
					startedAt: '2025-12-19T09:10:00.000Z',
					endedAt: '2025-12-19T09:12:00.000Z',
					durationSec: 120,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			const summary = interruptionStore.getTaskSummary('task-1');

			expect(summary.count).toBe(2);
			expect(summary.totalDurationSec).toBe(420); // 300 + 120
		});
	});

	// ==========================================================================
	// T019: Tests for autoEndInterruption() helper
	// ==========================================================================

	describe('autoEndInterruption()', () => {
		it('should end active interruption and return it', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(30000);

			const result = interruptionStore.autoEndInterruption();

			expect(result).not.toBeNull();
			expect(result?.taskId).toBe('task-1');
			expect(interruptionStore.isInterrupted).toBe(false);
		});

		it('should return null when no active interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const result = interruptionStore.autoEndInterruption();

			expect(result).toBeNull();
		});

		it('should record the interruption with correct duration', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(45000); // 45 seconds

			interruptionStore.autoEndInterruption();

			expect(interruptionStore.interruptions).toHaveLength(1);
			expect(interruptionStore.interruptions[0].durationSec).toBeGreaterThanOrEqual(44);
			expect(interruptionStore.interruptions[0].durationSec).toBeLessThanOrEqual(46);
		});
	});
});
