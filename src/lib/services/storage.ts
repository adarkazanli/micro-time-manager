/**
 * localStorage Wrapper Service
 *
 * Provides type-safe access to localStorage with JSON serialization,
 * schema versioning, and migration support.
 */

import type { ConfirmedTask, DaySession, TabInfo, Interruption } from '$lib/types';
import {
	STORAGE_KEY_TASKS,
	STORAGE_KEY_SCHEMA,
	STORAGE_KEY_SESSION,
	STORAGE_KEY_TAB,
	STORAGE_KEY_INTERRUPTIONS,
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
 * Apply schema migration from version 1 to version 2.
 *
 * Ensures legacy or corrupted session and tab-storage entries are removed by deleting STORAGE_KEY_SESSION and STORAGE_KEY_TAB; errors during cleanup are ignored.
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
 * Ensure the interruptions storage key exists when migrating schema v2 to v3 by initializing STORAGE_KEY_INTERRUPTIONS to an empty array if missing.
 *
 * @remarks
 * Errors encountered during migration are ignored.
 */
function migrateV2toV3(): void {
	try {
		// Initialize interruptions storage if it doesn't exist
		const stored = localStorage.getItem(STORAGE_KEY_INTERRUPTIONS);
		if (!stored) {
			localStorage.setItem(STORAGE_KEY_INTERRUPTIONS, JSON.stringify([]));
		}
	} catch {
		// Ignore errors during migration
	}
}

/**
 * Ensure stored data matches the current schema by running any needed migrations.
 *
 * If localStorage is unavailable this function exits without action. It reads the stored schema
 * version, runs migrations sequentially for any missing versions (v1→v2, v2→v3, …), and then
 * updates the stored schema version to the current value.
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
		if (version < 3) {
			migrateV2toV3();
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
	},

	// =========================================================================
	// Interruption Storage (004-interruption-tracking)
	// =========================================================================

	/**
	 * Save interruptions to localStorage
	 */
	saveInterruptions(interruptions: Interruption[]): boolean {
		if (!isLocalStorageAvailable()) {
			console.warn('localStorage not available');
			return false;
		}

		try {
			localStorage.setItem(STORAGE_KEY_INTERRUPTIONS, JSON.stringify(interruptions));
			return true;
		} catch (error) {
			console.error('Failed to save interruptions:', error);
			return false;
		}
	},

	/**
	 * Load interruptions from localStorage
	 */
	loadInterruptions(): Interruption[] {
		if (!isLocalStorageAvailable()) {
			return [];
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY_INTERRUPTIONS);
			if (!stored) {
				return [];
			}

			return JSON.parse(stored) as Interruption[];
		} catch (error) {
			console.error('Failed to load interruptions:', error);
			return [];
		}
	},

	/**
	 * Clear interruptions from localStorage
	 */
	clearInterruptions(): boolean {
		if (!isLocalStorageAvailable()) {
			return false;
		}

		try {
			localStorage.removeItem(STORAGE_KEY_INTERRUPTIONS);
			return true;
		} catch (error) {
			console.error('Failed to clear interruptions:', error);
			return false;
		}
	}
};