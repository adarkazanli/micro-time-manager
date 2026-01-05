/**
 * Unit tests for logging service
 *
 * Feature: 014-ui-logging-system
 * Task: T010 - Unit tests for logging service (context capture, entry creation)
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logging service', () => {
	let mockStorage: Record<string, string>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-03T10:30:00.123Z'));

		// Mock localStorage
		mockStorage = {};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => mockStorage[key] || null);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
			mockStorage[key] = value;
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
			delete mockStorage[key];
		});

		// Mock crypto.randomUUID
		let uuidCounter = 0;
		vi.spyOn(crypto, 'randomUUID').mockImplementation(() => `test-uuid-${++uuidCounter}` as `${string}-${string}-${string}-${string}-${string}`);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	// ==========================================================================
	// logAction() Basic Tests
	// ==========================================================================

	describe('logAction()', () => {
		it('should create a log entry with UUID id', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_DAY');

			expect(logStore.entries[0].id).toMatch(/^test-uuid-/);
		});

		it('should create a log entry with ISO timestamp', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_DAY');

			expect(logStore.entries[0].timestamp).toBe('2026-01-03T10:30:00.123Z');
		});

		it('should record the specified action type', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK');

			expect(logStore.entries[0].action).toBe('COMPLETE_TASK');
		});

		it('should accept optional parameters', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK', { taskId: 'task-123', elapsedMs: 300000 });

			expect(logStore.entries[0].parameters).toEqual({ taskId: 'task-123', elapsedMs: 300000 });
		});

		it('should default parameters to empty object', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_DAY');

			expect(logStore.entries[0].parameters).toEqual({});
		});
	});

	// ==========================================================================
	// Context Capture Tests (FR-003)
	// ==========================================================================

	describe('context capture (FR-003)', () => {
		it('should capture session status from sessionStore', async () => {
			// Set up sessionStore with running status
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			// Mock the status getter
			Object.defineProperty(sessionStore, 'status', {
				get: () => 'running',
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK');

			expect(logStore.entries[0].sessionStatus).toBe('running');
		});

		it('should capture current task ID when task is active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			// Mock currentTask getter
			Object.defineProperty(sessionStore, 'currentTask', {
				get: () => ({ taskId: 'task-abc', taskName: 'Test Task' }),
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK');

			expect(logStore.entries[0].taskId).toBe('task-abc');
		});

		it('should capture current task name when task is active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			Object.defineProperty(sessionStore, 'currentTask', {
				get: () => ({ taskId: 'task-abc', taskName: 'Morning Standup' }),
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK');

			expect(logStore.entries[0].taskName).toBe('Morning Standup');
		});

		it('should set taskId to null when no active task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			Object.defineProperty(sessionStore, 'currentTask', {
				get: () => null,
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_DAY');

			expect(logStore.entries[0].taskId).toBeNull();
		});

		it('should set taskName to null when no active task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			Object.defineProperty(sessionStore, 'currentTask', {
				get: () => null,
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_DAY');

			expect(logStore.entries[0].taskName).toBeNull();
		});

		it('should capture elapsed time from timerStore', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			Object.defineProperty(timerStore, 'elapsedMs', {
				get: () => 150000,
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK');

			expect(logStore.entries[0].elapsedMs).toBe(150000);
		});

		it('should set elapsedMs to null when timer is not running', async () => {
			const { timerStore } = await import('$lib/stores/timerStore.svelte');

			Object.defineProperty(timerStore, 'elapsedMs', {
				get: () => null,
				configurable: true
			});

			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_DAY');

			expect(logStore.entries[0].elapsedMs).toBeNull();
		});
	});

	// ==========================================================================
	// All Action Types Tests (FR-002)
	// ==========================================================================

	describe('all action types (FR-002)', () => {
		const actionTypes = [
			'START_DAY',
			'COMPLETE_TASK',
			'START_TASK',
			'END_DAY',
			'INTERRUPT',
			'RESUME_INTERRUPT',
			'ADD_TASK',
			'REORDER_TASK',
			'EDIT_TASK',
			'UNCOMPLETE_TASK',
			'BACK_TO_IMPORT',
			'START_NEW_DAY'
		] as const;

		for (const action of actionTypes) {
			it(`should accept action type: ${action}`, async () => {
				vi.resetModules();
				const { logAction } = await import('$lib/services/logging');
				const { logStore } = await import('$lib/stores/logStore.svelte');

				logAction(action);

				expect(logStore.entries[0].action).toBe(action);
			});
		}
	});

	// ==========================================================================
	// Parameters for Specific Actions Tests
	// ==========================================================================

	describe('action-specific parameters', () => {
		it('should allow COMPLETE_TASK with taskId and elapsedMs params', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('COMPLETE_TASK', { taskId: 'task-1', elapsedMs: 300000 });

			expect(logStore.entries[0].parameters).toEqual({ taskId: 'task-1', elapsedMs: 300000 });
		});

		it('should allow START_TASK with targetTaskId and previousElapsedMs params', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('START_TASK', { targetTaskId: 'task-2', previousElapsedMs: 120000 });

			expect(logStore.entries[0].parameters).toEqual({ targetTaskId: 'task-2', previousElapsedMs: 120000 });
		});

		it('should allow ADD_TASK with taskName, taskType, and duration params', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('ADD_TASK', { taskName: 'New Task', taskType: 'flexible', duration: 1800 });

			expect(logStore.entries[0].parameters).toEqual({ taskName: 'New Task', taskType: 'flexible', duration: 1800 });
		});

		it('should allow REORDER_TASK with fromIndex and toIndex params', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('REORDER_TASK', { fromIndex: 2, toIndex: 5 });

			expect(logStore.entries[0].parameters).toEqual({ fromIndex: 2, toIndex: 5 });
		});

		it('should allow EDIT_TASK with taskId and changedFields params', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('EDIT_TASK', { taskId: 'task-1', changedFields: ['name', 'duration'] });

			expect(logStore.entries[0].parameters).toEqual({ taskId: 'task-1', changedFields: ['name', 'duration'] });
		});

		it('should allow INTERRUPT with taskId param', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('INTERRUPT', { taskId: 'task-1' });

			expect(logStore.entries[0].parameters).toEqual({ taskId: 'task-1' });
		});

		it('should allow RESUME_INTERRUPT with interruptionDurationMs param', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('RESUME_INTERRUPT', { interruptionDurationMs: 180000 });

			expect(logStore.entries[0].parameters).toEqual({ interruptionDurationMs: 180000 });
		});

		it('should allow UNCOMPLETE_TASK with taskId param', async () => {
			const { logAction } = await import('$lib/services/logging');
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logAction('UNCOMPLETE_TASK', { taskId: 'task-1' });

			expect(logStore.entries[0].parameters).toEqual({ taskId: 'task-1' });
		});
	});
});
