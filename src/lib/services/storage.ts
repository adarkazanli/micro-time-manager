/**
 * localStorage Wrapper Service
 *
 * Provides type-safe access to localStorage with JSON serialization,
 * schema versioning, and migration support.
 */

import type { ConfirmedTask, DaySession, TabInfo } from '$lib/types';
import {
	STORAGE_KEY_TASKS,
	STORAGE_KEY_SCHEMA,
	STORAGE_KEY_SESSION,
	STORAGE_KEY_TAB,
	CURRENT_SCHEMA_VERSION
} from '$lib/types';

/**
 * Serialized task format for localStorage
 * (Dates are stored as ISO strings)
 */
interface SerializedTask {
	taskId: string;
	name: string;
	plannedStart: string; // ISO 8601
	plannedDurationSec: number;
	type: 'fixed' | 'flexible';
	sortOrder: number;
	status: 'pending' | 'active' | 'complete';
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
	try {
		const testKey = '__storage_test__';
		localStorage.setItem(testKey, testKey);
		localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
}

/**
 * Migrate from schema v1 to v2
 *
 * v1 -> v2 changes:
 * - Added session storage (STORAGE_KEY_SESSION)
 * - Added tab info storage (STORAGE_KEY_TAB)
 * - Clears any stale/corrupted session data
 */
function migrateV1toV2(): void {
	// Clear any stale session data that might exist
	// (shouldn't exist in v1, but handle corrupted state)
	try {
		localStorage.removeItem(STORAGE_KEY_SESSION);
		localStorage.removeItem(STORAGE_KEY_TAB);
	} catch {
		// Ignore errors during cleanup
	}
}

/**
 * Run migrations if needed based on schema version
 */
function migrateIfNeeded(): void {
	if (!isLocalStorageAvailable()) {
		return;
	}

	const storedVersion = localStorage.getItem(STORAGE_KEY_SCHEMA);
	const version = storedVersion ? parseInt(storedVersion, 10) : 0;

	if (version < CURRENT_SCHEMA_VERSION) {
		// Run migrations in order
		if (version < 2) {
			migrateV1toV2();
		}

		// Update schema version
		localStorage.setItem(STORAGE_KEY_SCHEMA, String(CURRENT_SCHEMA_VERSION));
	}
}

/**
 * Serialize a ConfirmedTask for storage
 */
function serializeTask(task: ConfirmedTask): SerializedTask {
	return {
		taskId: task.taskId,
		name: task.name,
		plannedStart: task.plannedStart.toISOString(),
		plannedDurationSec: task.plannedDurationSec,
		type: task.type,
		sortOrder: task.sortOrder,
		status: task.status
	};
}

/**
 * Deserialize a task from storage
 */
function deserializeTask(data: SerializedTask): ConfirmedTask {
	return {
		taskId: data.taskId,
		name: data.name,
		plannedStart: new Date(data.plannedStart),
		plannedDurationSec: data.plannedDurationSec,
		type: data.type,
		sortOrder: data.sortOrder,
		status: data.status
	};
}

/**
 * Storage Service
 */
export const storage = {
	/**
	 * Initialize storage (run migrations)
	 */
	init(): void {
		migrateIfNeeded();
	},

	/**
	 * Save confirmed tasks to localStorage
	 */
	saveTasks(tasks: ConfirmedTask[]): boolean {
		if (!isLocalStorageAvailable()) {
			console.warn('localStorage not available');
			return false;
		}

		try {
			const serialized = tasks.map(serializeTask);
			localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(serialized));
			return true;
		} catch (error) {
			console.error('Failed to save tasks:', error);
			return false;
		}
	},

	/**
	 * Load confirmed tasks from localStorage
	 */
	loadTasks(): ConfirmedTask[] {
		if (!isLocalStorageAvailable()) {
			return [];
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY_TASKS);
			if (!stored) {
				return [];
			}

			const parsed = JSON.parse(stored) as SerializedTask[];
			return parsed.map(deserializeTask);
		} catch (error) {
			console.error('Failed to load tasks:', error);
			return [];
		}
	},

	/**
	 * Clear all tasks from localStorage
	 */
	clearTasks(): boolean {
		if (!isLocalStorageAvailable()) {
			return false;
		}

		try {
			localStorage.removeItem(STORAGE_KEY_TASKS);
			return true;
		} catch (error) {
			console.error('Failed to clear tasks:', error);
			return false;
		}
	},

	/**
	 * Check if there are any saved tasks
	 */
	hasSavedTasks(): boolean {
		if (!isLocalStorageAvailable()) {
			return false;
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY_TASKS);
			if (!stored) {
				return false;
			}

			const parsed = JSON.parse(stored);
			return Array.isArray(parsed) && parsed.length > 0;
		} catch {
			return false;
		}
	},

	/**
	 * Get the current schema version
	 */
	getSchemaVersion(): number {
		if (!isLocalStorageAvailable()) {
			return 0;
		}

		const version = localStorage.getItem(STORAGE_KEY_SCHEMA);
		return version ? parseInt(version, 10) : 0;
	},

	// =========================================================================
	// Session Storage (002-day-tracking)
	// =========================================================================

	/**
	 * Save day session to localStorage
	 */
	saveSession(session: DaySession): boolean {
		if (!isLocalStorageAvailable()) {
			console.warn('localStorage not available');
			return false;
		}

		try {
			localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
			return true;
		} catch (error) {
			console.error('Failed to save session:', error);
			return false;
		}
	},

	/**
	 * Load day session from localStorage
	 */
	getSession(): DaySession | null {
		if (!isLocalStorageAvailable()) {
			return null;
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY_SESSION);
			if (!stored) {
				return null;
			}

			return JSON.parse(stored) as DaySession;
		} catch (error) {
			console.error('Failed to load session:', error);
			return null;
		}
	},

	/**
	 * Clear day session from localStorage
	 */
	clearSession(): boolean {
		if (!isLocalStorageAvailable()) {
			return false;
		}

		try {
			localStorage.removeItem(STORAGE_KEY_SESSION);
			return true;
		} catch (error) {
			console.error('Failed to clear session:', error);
			return false;
		}
	},

	// =========================================================================
	// Tab Info Storage (002-day-tracking)
	// =========================================================================

	/**
	 * Load tab info from localStorage
	 */
	getTabInfo(): TabInfo | null {
		if (!isLocalStorageAvailable()) {
			return null;
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY_TAB);
			if (!stored) {
				return null;
			}

			return JSON.parse(stored) as TabInfo;
		} catch (error) {
			console.error('Failed to load tab info:', error);
			return null;
		}
	},

	/**
	 * Save tab info to localStorage
	 */
	saveTabInfo(tabInfo: TabInfo): boolean {
		if (!isLocalStorageAvailable()) {
			console.warn('localStorage not available');
			return false;
		}

		try {
			localStorage.setItem(STORAGE_KEY_TAB, JSON.stringify(tabInfo));
			return true;
		} catch (error) {
			console.error('Failed to save tab info:', error);
			return false;
		}
	},

	/**
	 * Clear tab info from localStorage
	 */
	clearTabInfo(): boolean {
		if (!isLocalStorageAvailable()) {
			return false;
		}

		try {
			localStorage.removeItem(STORAGE_KEY_TAB);
			return true;
		} catch (error) {
			console.error('Failed to clear tab info:', error);
			return false;
		}
	}
};
