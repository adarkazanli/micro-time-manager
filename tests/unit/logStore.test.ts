/**
 * Unit tests for logStore
 *
 * Feature: 014-ui-logging-system
 * Task: T009 - Unit tests for logStore methods
 *
 * Tests: addEntry, loadFromStorage, clearAll, exportToCsv, 1000 entry limit
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LogEntry, SessionStatus } from '$lib/types';

describe('logStore', () => {
	let mockStorage: Record<string, string>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-03T10:00:00.000Z'));

		// Mock localStorage
		mockStorage = {};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => mockStorage[key] || null);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
			mockStorage[key] = value;
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
			delete mockStorage[key];
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	// Helper to create a test log entry
	function createTestEntry(overrides: Partial<LogEntry> = {}): LogEntry {
		return {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			action: 'START_DAY',
			taskId: null,
			taskName: null,
			elapsedMs: null,
			sessionStatus: 'idle' as SessionStatus,
			parameters: {},
			...overrides
		};
	}

	// ==========================================================================
	// Initial State Tests
	// ==========================================================================

	describe('initial state', () => {
		it('should start with empty entries array', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			expect(logStore.entries).toEqual([]);
		});

		it('should start with isLoaded = false', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			expect(logStore.isLoaded).toBe(false);
		});
	});

	// ==========================================================================
	// addEntry Tests
	// ==========================================================================

	describe('addEntry()', () => {
		it('should add entry to entries array', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			const entry = createTestEntry();

			logStore.addEntry(entry);

			expect(logStore.entries).toHaveLength(1);
			expect(logStore.entries[0].id).toBe(entry.id);
		});

		it('should add entries in newest-first order', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			const entry1 = createTestEntry({ id: 'first' });
			const entry2 = createTestEntry({ id: 'second' });

			logStore.addEntry(entry1);
			logStore.addEntry(entry2);

			expect(logStore.entries[0].id).toBe('second');
			expect(logStore.entries[1].id).toBe('first');
		});

		it('should persist entries to localStorage', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			const entry = createTestEntry();

			logStore.addEntry(entry);

			expect(mockStorage['tm_logs']).toBeDefined();
			const stored = JSON.parse(mockStorage['tm_logs']);
			expect(stored.entries).toHaveLength(1);
		});

		it('should preserve all entry fields', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			const entry = createTestEntry({
				id: 'test-id',
				timestamp: '2026-01-03T10:30:00.123Z',
				action: 'COMPLETE_TASK',
				taskId: 'task-123',
				taskName: 'Morning Standup',
				elapsedMs: 300000,
				sessionStatus: 'running',
				parameters: { elapsedMs: 300000 }
			});

			logStore.addEntry(entry);

			const stored = logStore.entries[0];
			expect(stored.id).toBe('test-id');
			expect(stored.timestamp).toBe('2026-01-03T10:30:00.123Z');
			expect(stored.action).toBe('COMPLETE_TASK');
			expect(stored.taskId).toBe('task-123');
			expect(stored.taskName).toBe('Morning Standup');
			expect(stored.elapsedMs).toBe(300000);
			expect(stored.sessionStatus).toBe('running');
			expect(stored.parameters).toEqual({ elapsedMs: 300000 });
		});
	});

	// ==========================================================================
	// 1000 Entry Limit Tests (FR-011)
	// ==========================================================================

	describe('1000 entry limit (FR-011)', () => {
		it('should enforce maximum of 1000 entries', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			// Add 1005 entries
			for (let i = 0; i < 1005; i++) {
				logStore.addEntry(createTestEntry({ id: `entry-${i}` }));
			}

			expect(logStore.entries.length).toBeLessThanOrEqual(1000);
		});

		it('should remove oldest entries when limit exceeded', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			// Add 1001 entries
			for (let i = 0; i < 1001; i++) {
				logStore.addEntry(createTestEntry({ id: `entry-${i}` }));
			}

			// Newest entry (entry-1000) should be first
			expect(logStore.entries[0].id).toBe('entry-1000');
			// Oldest entry (entry-0) should be removed
			expect(logStore.entries.find(e => e.id === 'entry-0')).toBeUndefined();
		});

		it('should keep newest entries when pruning', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			// Add 1010 entries
			for (let i = 0; i < 1010; i++) {
				logStore.addEntry(createTestEntry({ id: `entry-${i}` }));
			}

			// Most recent 1000 entries should be kept (entry-10 through entry-1009)
			expect(logStore.entries[0].id).toBe('entry-1009');
			expect(logStore.entries[logStore.entries.length - 1].id).toBe('entry-10');
		});
	});

	// ==========================================================================
	// loadFromStorage Tests
	// ==========================================================================

	describe('loadFromStorage()', () => {
		it('should load entries from localStorage', async () => {
			// Pre-populate localStorage
			const storedEntries = [
				createTestEntry({ id: 'stored-1' }),
				createTestEntry({ id: 'stored-2' })
			];
			mockStorage['tm_logs'] = JSON.stringify({
				version: 1,
				entries: storedEntries
			});

			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.loadFromStorage();

			expect(logStore.entries).toHaveLength(2);
		});

		it('should set isLoaded to true after loading', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logStore.loadFromStorage();

			expect(logStore.isLoaded).toBe(true);
		});

		it('should display entries newest-first (reverse storage order)', async () => {
			// Storage has oldest first
			const storedEntries = [
				createTestEntry({ id: 'oldest', timestamp: '2026-01-03T09:00:00.000Z' }),
				createTestEntry({ id: 'newest', timestamp: '2026-01-03T10:00:00.000Z' })
			];
			mockStorage['tm_logs'] = JSON.stringify({
				version: 1,
				entries: storedEntries
			});

			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.loadFromStorage();

			// Display should have newest first
			expect(logStore.entries[0].id).toBe('newest');
			expect(logStore.entries[1].id).toBe('oldest');
		});

		it('should handle empty localStorage gracefully', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logStore.loadFromStorage();

			expect(logStore.entries).toEqual([]);
			expect(logStore.isLoaded).toBe(true);
		});

		it('should handle corrupted localStorage gracefully', async () => {
			mockStorage['tm_logs'] = 'invalid json{{{';

			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.loadFromStorage();

			expect(logStore.entries).toEqual([]);
			expect(logStore.isLoaded).toBe(true);
		});
	});

	// ==========================================================================
	// clearAll Tests
	// ==========================================================================

	describe('clearAll()', () => {
		it('should clear all entries', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logStore.addEntry(createTestEntry());
			logStore.addEntry(createTestEntry());
			expect(logStore.entries).toHaveLength(2);

			logStore.clearAll();

			expect(logStore.entries).toEqual([]);
		});

		it('should clear localStorage', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			logStore.addEntry(createTestEntry());
			expect(mockStorage['tm_logs']).toBeDefined();

			logStore.clearAll();

			expect(mockStorage['tm_logs']).toBeUndefined();
		});
	});

	// ==========================================================================
	// exportToCsv Tests (User Story 2)
	// ==========================================================================

	describe('exportToCsv()', () => {
		it('should return CSV string with headers', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			const csv = logStore.exportToCsv();

			expect(csv).toContain('timestamp,action,taskId,taskName,elapsedMs,sessionStatus,parameters');
		});

		it('should include all entries in CSV', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.addEntry(createTestEntry({ action: 'START_DAY' }));
			logStore.addEntry(createTestEntry({ action: 'END_DAY' }));

			const csv = logStore.exportToCsv();
			const lines = csv.split('\n');

			// Header + 2 data rows
			expect(lines.length).toBe(3);
		});

		it('should properly escape quotes in CSV', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.addEntry(createTestEntry({
				taskName: 'Task with "quotes"'
			}));

			const csv = logStore.exportToCsv();

			// CSV escaping doubles quotes
			expect(csv).toContain('""quotes""');
		});

		it('should JSON stringify parameters column', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.addEntry(createTestEntry({
				parameters: { targetTaskId: 'task-2', previousElapsedMs: 5000 }
			}));

			const csv = logStore.exportToCsv();

			expect(csv).toContain('targetTaskId');
			expect(csv).toContain('previousElapsedMs');
		});

		it('should handle empty entries', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');

			const csv = logStore.exportToCsv();

			// Should have just the header
			const lines = csv.split('\n');
			expect(lines.length).toBe(1);
			expect(lines[0]).toContain('timestamp');
		});

		it('should handle null values', async () => {
			const { logStore } = await import('$lib/stores/logStore.svelte');
			logStore.addEntry(createTestEntry({
				taskId: null,
				taskName: null,
				elapsedMs: null
			}));

			const csv = logStore.exportToCsv();

			// Should not throw and should contain empty values
			expect(csv).toBeDefined();
		});
	});
});
