/**
 * localStorage Wrapper Service
 *
 * Provides type-safe access to localStorage with JSON serialization,
 * schema versioning, and migration support.
 */

import type { ConfirmedTask } from '$lib/types';
import {
	STORAGE_KEY_TASKS,
	STORAGE_KEY_SCHEMA,
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
 * Run migrations if needed based on schema version
 */
function migrateIfNeeded(): void {
	if (!isLocalStorageAvailable()) {
		return;
	}

	const storedVersion = localStorage.getItem(STORAGE_KEY_SCHEMA);
	const version = storedVersion ? parseInt(storedVersion, 10) : 0;

	if (version < CURRENT_SCHEMA_VERSION) {
		// Run migrations here as needed
		// Currently at v1, no migrations needed yet

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
	}
};
