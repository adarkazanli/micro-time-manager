import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '$lib/services/storage';
import type { ConfirmedTask, DaySession, TabInfo } from '$lib/types';
import {
	STORAGE_KEY_TASKS,
	STORAGE_KEY_SCHEMA,
	STORAGE_KEY_SESSION,
	STORAGE_KEY_TAB
} from '$lib/types';

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
				'5'
			);
		});

		it('does not update schema when version matches', () => {
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '5');
			vi.clearAllMocks(); // Clear the manual setItem call

			storage.init();

			// Should not set schema version since it matches
			const schemaCall = localStorageMock.setItem.mock.calls.find(
				(call: string[]) => call[0] === STORAGE_KEY_SCHEMA
			);
			expect(schemaCall).toBeUndefined();
		});

		it('returns current schema version', () => {
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '3');

			expect(storage.getSchemaVersion()).toBe(3);
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

	// ==========================================================================
	// Session Storage Tests (T006 - 002-day-tracking)
	// ==========================================================================

	describe('saveSession', () => {
		it('saves session to localStorage', () => {
			const session: DaySession = {
				sessionId: 'session-123',
				startedAt: '2025-12-18T09:00:00.000Z',
				endedAt: null,
				status: 'running',
				currentTaskIndex: 0,
				currentTaskElapsedMs: 5000,
				lastPersistedAt: Date.now(),
				totalLagSec: 0,
				taskProgress: [
					{
						taskId: 'task-1',
						plannedDurationSec: 900,
						actualDurationSec: 0,
						completedAt: null,
						status: 'active'
					}
				]
			};

			const result = storage.saveSession(session);

			expect(result).toBe(true);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY_SESSION,
				expect.any(String)
			);

			const sessionSaveCall = localStorageMock.setItem.mock.calls.find(
				(call: string[]) => call[0] === STORAGE_KEY_SESSION
			);
			expect(sessionSaveCall).toBeDefined();
			const saved = JSON.parse(sessionSaveCall![1]);
			expect(saved.sessionId).toBe('session-123');
			expect(saved.status).toBe('running');
		});
	});

	describe('getSession', () => {
		it('loads session from localStorage', () => {
			const stored = {
				sessionId: 'session-456',
				startedAt: '2025-12-18T09:00:00.000Z',
				endedAt: null,
				status: 'running',
				currentTaskIndex: 1,
				currentTaskElapsedMs: 30000,
				lastPersistedAt: 1702893600000,
				totalLagSec: -60,
				taskProgress: []
			};
			localStorageMock.setItem(STORAGE_KEY_SESSION, JSON.stringify(stored));

			const session = storage.getSession();

			expect(session).not.toBeNull();
			expect(session?.sessionId).toBe('session-456');
			expect(session?.currentTaskIndex).toBe(1);
			expect(session?.totalLagSec).toBe(-60);
		});

		it('returns null when no session stored', () => {
			const session = storage.getSession();
			expect(session).toBeNull();
		});

		it('returns null on parse error', () => {
			localStorageMock.setItem(STORAGE_KEY_SESSION, 'invalid json');

			const session = storage.getSession();

			expect(session).toBeNull();
		});
	});

	describe('clearSession', () => {
		it('removes session from localStorage', () => {
			localStorageMock.setItem(STORAGE_KEY_SESSION, '{}');

			const result = storage.clearSession();

			expect(result).toBe(true);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY_SESSION);
		});
	});

	describe('getTabInfo', () => {
		it('loads tab info from localStorage', () => {
			const stored: TabInfo = {
				tabId: 'tab-123',
				activeSince: 1702893600000,
				lastHeartbeat: 1702893602000
			};
			localStorageMock.setItem(STORAGE_KEY_TAB, JSON.stringify(stored));

			const tabInfo = storage.getTabInfo();

			expect(tabInfo).not.toBeNull();
			expect(tabInfo?.tabId).toBe('tab-123');
			expect(tabInfo?.activeSince).toBe(1702893600000);
		});

		it('returns null when no tab info stored', () => {
			const tabInfo = storage.getTabInfo();
			expect(tabInfo).toBeNull();
		});
	});

	describe('saveTabInfo', () => {
		it('saves tab info to localStorage', () => {
			const tabInfo: TabInfo = {
				tabId: 'tab-456',
				activeSince: Date.now(),
				lastHeartbeat: Date.now()
			};

			const result = storage.saveTabInfo(tabInfo);

			expect(result).toBe(true);
			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY_TAB,
				expect.any(String)
			);
		});
	});

	describe('clearTabInfo', () => {
		it('removes tab info from localStorage', () => {
			localStorageMock.setItem(STORAGE_KEY_TAB, '{}');

			const result = storage.clearTabInfo();

			expect(result).toBe(true);
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY_TAB);
		});
	});

	describe('schema migration v1 to v2 to v3', () => {
		it('migrates schema from v1 to v3', () => {
			// Set up v1 state (only tasks, no session)
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '1');
			const v1Tasks = [
				{
					taskId: 'task-1',
					name: 'Test Task',
					plannedStart: '2025-12-18T09:00:00.000Z',
					plannedDurationSec: 900,
					type: 'fixed',
					sortOrder: 0,
					status: 'pending'
				}
			];
			localStorageMock.setItem(STORAGE_KEY_TASKS, JSON.stringify(v1Tasks));

			// Initialize storage (triggers migration)
			storage.init();

			// Schema version should be updated to 5
			expect(storage.getSchemaVersion()).toBe(5);

			// Tasks should still be accessible
			const tasks = storage.loadTasks();
			expect(tasks).toHaveLength(1);
			expect(tasks[0].taskId).toBe('task-1');
		});

		it('does not run migration when already at v5', () => {
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '5');
			vi.clearAllMocks();

			storage.init();

			// Should not update schema version since it already matches
			const schemaCall = localStorageMock.setItem.mock.calls.find(
				(call: string[]) => call[0] === STORAGE_KEY_SCHEMA
			);
			expect(schemaCall).toBeUndefined();
		});

		it('clears any stale session data during migration', () => {
			// Simulate v1 with corrupted session data
			localStorageMock.setItem(STORAGE_KEY_SCHEMA, '1');
			localStorageMock.setItem(STORAGE_KEY_SESSION, 'corrupted');

			storage.init();

			// Session should be cleared during migration
			const session = storage.getSession();
			expect(session).toBeNull();
		});
	});

	describe('session round-trip persistence', () => {
		it('preserves session data through save/load cycle', () => {
			const originalSession: DaySession = {
				sessionId: 'session-round-trip',
				startedAt: '2025-12-18T09:00:00.000Z',
				endedAt: null,
				status: 'running',
				currentTaskIndex: 2,
				currentTaskElapsedMs: 45000,
				lastPersistedAt: Date.now(),
				totalLagSec: 120,
				taskProgress: [
					{
						taskId: 'task-1',
						plannedDurationSec: 900,
						actualDurationSec: 850,
						completedAt: '2025-12-18T09:14:10.000Z',
						status: 'complete'
					},
					{
						taskId: 'task-2',
						plannedDurationSec: 1800,
						actualDurationSec: 1920,
						completedAt: '2025-12-18T09:46:10.000Z',
						status: 'complete'
					},
					{
						taskId: 'task-3',
						plannedDurationSec: 3600,
						actualDurationSec: 0,
						completedAt: null,
						status: 'active'
					}
				]
			};

			storage.saveSession(originalSession);
			const loadedSession = storage.getSession();

			expect(loadedSession).not.toBeNull();
			expect(loadedSession?.sessionId).toBe('session-round-trip');
			expect(loadedSession?.status).toBe('running');
			expect(loadedSession?.currentTaskIndex).toBe(2);
			expect(loadedSession?.currentTaskElapsedMs).toBe(45000);
			expect(loadedSession?.totalLagSec).toBe(120);
			expect(loadedSession?.taskProgress).toHaveLength(3);
			expect(loadedSession?.taskProgress[0].status).toBe('complete');
			expect(loadedSession?.taskProgress[2].status).toBe('active');
		});
	});
});
