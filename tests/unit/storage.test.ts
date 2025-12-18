import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '$lib/services/storage';
import type { ConfirmedTask } from '$lib/types';
import { STORAGE_KEY_TASKS, STORAGE_KEY_SCHEMA } from '$lib/types';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] || null),
		// Helper for tests
		_getStore: () => store
	};
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.defineProperty(globalThis as any, 'localStorage', {
	value: localStorageMock,
	writable: true
});

describe('storage service', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	describe('saveTasks', () => {
		it('saves tasks to localStorage', () => {
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Morning Standup',
					plannedStart: new Date('2025-12-17T09:00:00Z'),
					plannedDurationSec: 900,
					type: 'fixed',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Deep Work',
					plannedStart: new Date('2025-12-17T09:15:00Z'),
					plannedDurationSec: 3600,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				}
			];

			const result = storage.saveTasks(tasks);

			expect(result).toBe(true);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY_TASKS,
				expect.any(String)
			);

			// Find the call that saved tasks (not the availability check)
			const tasksSaveCall = localStorageMock.setItem.mock.calls.find(
				(call: string[]) => call[0] === STORAGE_KEY_TASKS
			);
			expect(tasksSaveCall).toBeDefined();
			const saved = JSON.parse(tasksSaveCall![1]);
			expect(saved).toHaveLength(2);
			expect(saved[0].taskId).toBe('task-1');
			expect(saved[0].plannedStart).toBe('2025-12-17T09:00:00.000Z');
		});

		it('serializes dates as ISO strings', () => {
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Test Task',
					plannedStart: new Date('2025-12-17T14:30:00Z'),
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 0,
					status: 'pending'
				}
			];

			storage.saveTasks(tasks);

			// Find the call that saved tasks
			const tasksSaveCall = localStorageMock.setItem.mock.calls.find(
				(call: string[]) => call[0] === STORAGE_KEY_TASKS
			);
			expect(tasksSaveCall).toBeDefined();
			const saved = JSON.parse(tasksSaveCall![1]);
			expect(saved[0].plannedStart).toBe('2025-12-17T14:30:00.000Z');
		});

		it('returns false when localStorage is not available', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const originalLocalStorage = (globalThis as any).localStorage;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Object.defineProperty(globalThis as any, 'localStorage', {
				value: {
					setItem: () => {
						throw new Error('QuotaExceededError');
					},
					getItem: () => {
						throw new Error('QuotaExceededError');
					},
					removeItem: () => {
						throw new Error('QuotaExceededError');
					}
				},
				writable: true
			});

			const result = storage.saveTasks([]);

			expect(result).toBe(false);

			// Restore
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Object.defineProperty(globalThis as any, 'localStorage', {
				value: originalLocalStorage,
				writable: true
			});
		});
	});

	describe('loadTasks', () => {
		it('loads and deserializes tasks from localStorage', () => {
			const stored = [
				{
					taskId: 'task-1',
					name: 'Morning Standup',
					plannedStart: '2025-12-17T09:00:00.000Z',
					plannedDurationSec: 900,
					type: 'fixed',
					sortOrder: 0,
					status: 'pending'
				}
			];
			localStorageMock.setItem(STORAGE_KEY_TASKS, JSON.stringify(stored));

			const tasks = storage.loadTasks();

			expect(tasks).toHaveLength(1);
			expect(tasks[0].taskId).toBe('task-1');
			expect(tasks[0].name).toBe('Morning Standup');
			expect(tasks[0].plannedStart).toBeInstanceOf(Date);
			expect(tasks[0].plannedStart.toISOString()).toBe('2025-12-17T09:00:00.000Z');
		});

		it('returns empty array when no tasks stored', () => {
			const tasks = storage.loadTasks();
			expect(tasks).toEqual([]);
		});

		it('returns empty array on parse error', () => {
			localStorageMock.setItem(STORAGE_KEY_TASKS, 'invalid json');

			const tasks = storage.loadTasks();

			expect(tasks).toEqual([]);
		});
	});

	describe('clearTasks', () => {
		it('removes tasks from localStorage', () => {
			localStorageMock.setItem(STORAGE_KEY_TASKS, '[]');

			const result = storage.clearTasks();

			expect(result).toBe(true);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY_TASKS);
		});
	});

	describe('hasSavedTasks', () => {
		it('returns true when tasks exist', () => {
			localStorageMock.setItem(
				STORAGE_KEY_TASKS,
				JSON.stringify([{ taskId: 'task-1' }])
			);

			expect(storage.hasSavedTasks()).toBe(true);
		});

		it('returns false when no tasks stored', () => {
			expect(storage.hasSavedTasks()).toBe(false);
		});

		it('returns false when stored value is empty array', () => {
			localStorageMock.setItem(STORAGE_KEY_TASKS, '[]');

			expect(storage.hasSavedTasks()).toBe(false);
		});

		it('returns false on invalid JSON', () => {
			localStorageMock.setItem(STORAGE_KEY_TASKS, 'invalid');

			expect(storage.hasSavedTasks()).toBe(false);
		});
	});

	describe('schema versioning', () => {
		it('initializes schema version on first use', () => {
			storage.init();

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY_SCHEMA,
				'1'
			);
		});

		it('does not update schema when version matches', () => {
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '1');
			vi.clearAllMocks(); // Clear the manual setItem call

			storage.init();

			// Should not set schema version since it matches
			const schemaCall = localStorageMock.setItem.mock.calls.find(
				(call: string[]) => call[0] === STORAGE_KEY_SCHEMA
			);
			expect(schemaCall).toBeUndefined();
		});

		it('returns current schema version', () => {
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '1');

			expect(storage.getSchemaVersion()).toBe(1);
		});

		it('returns 0 when no schema version set', () => {
			expect(storage.getSchemaVersion()).toBe(0);
		});
	});

	describe('round-trip persistence', () => {
		it('preserves task data through save/load cycle', () => {
			const originalTasks: ConfirmedTask[] = [
				{
					taskId: 'uuid-123',
					name: 'Team Meeting',
					plannedStart: new Date('2025-12-17T10:00:00Z'),
					plannedDurationSec: 3600,
					type: 'fixed',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'uuid-456',
					name: 'Code Review',
					plannedStart: new Date('2025-12-17T11:00:00Z'),
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'active'
				}
			];

			storage.saveTasks(originalTasks);
			const loadedTasks = storage.loadTasks();

			expect(loadedTasks).toHaveLength(2);
			expect(loadedTasks[0].taskId).toBe('uuid-123');
			expect(loadedTasks[0].name).toBe('Team Meeting');
			expect(loadedTasks[0].plannedStart.getTime()).toBe(
				new Date('2025-12-17T10:00:00Z').getTime()
			);
			expect(loadedTasks[0].plannedDurationSec).toBe(3600);
			expect(loadedTasks[0].type).toBe('fixed');
			expect(loadedTasks[0].status).toBe('pending');

			expect(loadedTasks[1].taskId).toBe('uuid-456');
			expect(loadedTasks[1].status).toBe('active');
		});
	});
});
