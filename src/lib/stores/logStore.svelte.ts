/**
 * Log Store
 *
 * Feature: 014-ui-logging-system
 * Task: T011 - Create logStore with entries state, addEntry, loadFromStorage methods
 *
 * Manages UI interaction log entries for debugging.
 * Uses Svelte 5 runes for reactive state management.
 *
 * @new 014-ui-logging-system
 */

import type { LogEntry } from '$lib/types';
import { MAX_LOG_ENTRIES } from '$lib/types';
import { storage } from '$lib/services/storage';

// =============================================================================
// State
// =============================================================================

let entriesState = $state<LogEntry[]>([]);
let isLoadedState = $state(false);

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Creates the log store with state management and persistence.
 */
function createLogStore() {
	return {
		// -------------------------------------------------------------------------
		// Readable State (getters)
		// -------------------------------------------------------------------------

		/**
		 * All log entries, newest first for display.
		 */
		get entries(): LogEntry[] {
			return entriesState;
		},

		/**
		 * Whether logs have been loaded from storage.
		 */
		get isLoaded(): boolean {
			return isLoadedState;
		},

		// -------------------------------------------------------------------------
		// Actions
		// -------------------------------------------------------------------------

		/**
		 * Add a new log entry.
		 * Entry is prepended (newest first) and persisted to storage.
		 * Enforces MAX_LOG_ENTRIES limit by removing oldest entries.
		 *
		 * @param entry - The log entry to add
		 */
		addEntry(entry: LogEntry): void {
			// Prepend new entry (newest first) and limit to MAX_LOG_ENTRIES
			entriesState = [entry, ...entriesState].slice(0, MAX_LOG_ENTRIES);

			// Persist to storage (storage expects newest-first, stores oldest-first)
			storage.saveLogs(entriesState);
		},

		/**
		 * Load log entries from localStorage.
		 * Entries are stored oldest-first but displayed newest-first.
		 */
		loadFromStorage(): void {
			try {
				const loaded = storage.loadLogs();
				// Storage returns oldest-first, reverse for display (newest-first)
				entriesState = [...loaded].reverse();
			} catch {
				entriesState = [];
			}
			isLoadedState = true;
		},

		/**
		 * Clear all log entries from state and storage.
		 */
		clearAll(): void {
			entriesState = [];
			storage.clearLogs();
		},

		/**
		 * Export all log entries to CSV format.
		 * Headers: timestamp, action, taskId, taskName, elapsedMs, sessionStatus, parameters
		 *
		 * @returns CSV string with headers and all entries
		 */
		exportToCsv(): string {
			const headers = ['timestamp', 'action', 'taskId', 'taskName', 'elapsedMs', 'sessionStatus', 'parameters'];

			const rows = entriesState.map(entry => {
				const values = [
					entry.timestamp,
					entry.action,
					entry.taskId ?? '',
					entry.taskName ?? '',
					entry.elapsedMs?.toString() ?? '',
					entry.sessionStatus,
					JSON.stringify(entry.parameters)
				];

				// CSV escaping: wrap in quotes and escape internal quotes by doubling them
				return values
					.map(v => `"${String(v).replace(/"/g, '""')}"`)
					.join(',');
			});

			return [headers.join(','), ...rows].join('\n');
		}
	};
}

/**
 * The log store singleton.
 */
export const logStore = createLogStore();
