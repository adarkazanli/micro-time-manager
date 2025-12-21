/**
 * Unit tests for interruption persistence
 *
 * Feature: 010-timer-persistence
 * Tasks: T033-T034 - Unit tests for interruption recovery
 *
 * Tests the interruption persistence flow including:
 * - Wall-clock elapsed calculation on restore
 * - Active interruption state restoration
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Interruption } from '$lib/types';

describe('interruptionStore persistence (010-timer-persistence)', () => {
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
	// T033: Unit test: Interruption recovery calculates correct elapsed
	// ==========================================================================

	describe('T033: Interruption recovery calculates correct elapsed', () => {
		it('should calculate elapsed time from startedAt using wall-clock', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const fiveMinutesAgo = new Date('2025-12-19T08:55:00.000Z');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'active-int',
					taskId: 'task-1',
					startedAt: fiveMinutesAgo.toISOString(),
					endedAt: null, // Active interruption
					durationSec: 0,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			// Should calculate elapsed from startedAt (5 minutes = 300000ms)
			expect(interruptionStore.elapsedMs).toBeGreaterThanOrEqual(299000);
			expect(interruptionStore.elapsedMs).toBeLessThanOrEqual(301000);
		});

		it('should handle 30 minutes of away time correctly', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// 30 minutes ago
			const thirtyMinutesAgo = new Date('2025-12-19T08:30:00.000Z');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'active-int',
					taskId: 'task-1',
					startedAt: thirtyMinutesAgo.toISOString(),
					endedAt: null,
					durationSec: 0,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			// Should calculate elapsed from startedAt (30 minutes = 1800000ms)
			expect(interruptionStore.elapsedMs).toBeGreaterThanOrEqual(1799000);
			expect(interruptionStore.elapsedMs).toBeLessThanOrEqual(1801000);
		});

		it('should continue timer from recovered elapsed position', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const twoMinutesAgo = new Date('2025-12-19T08:58:00.000Z');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'active-int',
					taskId: 'task-1',
					startedAt: twoMinutesAgo.toISOString(),
					endedAt: null,
					durationSec: 0,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			// Initial elapsed ~2 minutes
			const initialElapsed = interruptionStore.elapsedMs;

			// Advance by 1 minute
			vi.advanceTimersByTime(60000);

			// Elapsed should now be ~3 minutes
			expect(interruptionStore.elapsedMs).toBeGreaterThan(initialElapsed);
			expect(interruptionStore.elapsedMs).toBeGreaterThanOrEqual(179000); // ~3 min
			expect(interruptionStore.elapsedMs).toBeLessThanOrEqual(181000);
		});
	});

	// ==========================================================================
	// T034: Unit test: Active interruption restores isInterrupted state
	// ==========================================================================

	describe('T034: Active interruption restores isInterrupted state', () => {
		it('should set isInterrupted to true when restoring active interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'active-int',
					taskId: 'task-1',
					startedAt: new Date('2025-12-19T08:55:00.000Z').toISOString(),
					endedAt: null, // Active (not completed)
					durationSec: 0,
					category: null,
					note: null
				}
			];

			const wasInterrupted = interruptionStore.restore(savedInterruptions);

			expect(wasInterrupted).toBe(true);
			expect(interruptionStore.isInterrupted).toBe(true);
		});

		it('should restore activeInterruption from saved data', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'active-int-123',
					taskId: 'task-42',
					startedAt: new Date('2025-12-19T08:55:00.000Z').toISOString(),
					endedAt: null,
					durationSec: 0,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			expect(interruptionStore.activeInterruption).not.toBeNull();
			expect(interruptionStore.activeInterruption?.interruptionId).toBe('active-int-123');
			expect(interruptionStore.activeInterruption?.taskId).toBe('task-42');
		});

		it('should return false when no active interruption in saved data', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'completed-int',
					taskId: 'task-1',
					startedAt: new Date('2025-12-19T08:55:00.000Z').toISOString(),
					endedAt: new Date('2025-12-19T09:00:00.000Z').toISOString(),
					durationSec: 300,
					category: 'Phone',
					note: null
				}
			];

			const wasInterrupted = interruptionStore.restore(savedInterruptions);

			expect(wasInterrupted).toBe(false);
			expect(interruptionStore.isInterrupted).toBe(false);
			expect(interruptionStore.activeInterruption).toBeNull();
		});

		it('should separate active from completed interruptions', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'completed-1',
					taskId: 'task-1',
					startedAt: new Date('2025-12-19T08:00:00.000Z').toISOString(),
					endedAt: new Date('2025-12-19T08:05:00.000Z').toISOString(),
					durationSec: 300,
					category: null,
					note: null
				},
				{
					interruptionId: 'completed-2',
					taskId: 'task-1',
					startedAt: new Date('2025-12-19T08:30:00.000Z').toISOString(),
					endedAt: new Date('2025-12-19T08:35:00.000Z').toISOString(),
					durationSec: 300,
					category: null,
					note: null
				},
				{
					interruptionId: 'active-int',
					taskId: 'task-1',
					startedAt: new Date('2025-12-19T08:55:00.000Z').toISOString(),
					endedAt: null, // Active
					durationSec: 0,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			// Should have 2 completed in interruptions array
			expect(interruptionStore.interruptions).toHaveLength(2);
			expect(interruptionStore.interruptions[0].interruptionId).toBe('completed-1');
			expect(interruptionStore.interruptions[1].interruptionId).toBe('completed-2');

			// Active one should be in activeInterruption
			expect(interruptionStore.activeInterruption?.interruptionId).toBe('active-int');
		});

		it('should allow ending recovered interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			const fiveMinutesAgo = new Date('2025-12-19T08:55:00.000Z');

			const savedInterruptions: Interruption[] = [
				{
					interruptionId: 'active-int',
					taskId: 'task-1',
					startedAt: fiveMinutesAgo.toISOString(),
					endedAt: null,
					durationSec: 0,
					category: null,
					note: null
				}
			];

			interruptionStore.restore(savedInterruptions);

			// Should be able to end the restored interruption
			const completed = interruptionStore.endInterruption();

			expect(completed.interruptionId).toBe('active-int');
			expect(completed.durationSec).toBeGreaterThanOrEqual(299); // ~5 min
			expect(completed.durationSec).toBeLessThanOrEqual(301);
			expect(interruptionStore.isInterrupted).toBe(false);
			expect(interruptionStore.interruptions).toHaveLength(1);
		});
	});

	// ==========================================================================
	// Additional persistence tests
	// ==========================================================================

	describe('allInterruptionsForPersistence getter', () => {
		it('should include active interruption when present', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// Complete one
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			// Start another (active)
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(30000);

			const allForPersistence = interruptionStore.allInterruptionsForPersistence;

			expect(allForPersistence).toHaveLength(2);
			// First should be completed
			expect(allForPersistence[0].endedAt).not.toBeNull();
			// Second should be active
			expect(allForPersistence[1].endedAt).toBeNull();
		});

		it('should not duplicate when no active interruption', async () => {
			const { interruptionStore } = await import('$lib/stores/interruptionStore.svelte');

			// Complete one
			interruptionStore.startInterruption('task-1');
			vi.advanceTimersByTime(60000);
			interruptionStore.endInterruption();

			const allForPersistence = interruptionStore.allInterruptionsForPersistence;

			expect(allForPersistence).toHaveLength(1);
			expect(allForPersistence[0].endedAt).not.toBeNull();
		});
	});
});
