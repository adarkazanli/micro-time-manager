/**
 * Logging Service
 *
 * Feature: 014-ui-logging-system
 * Task: T012 - Create logging service with logAction function
 *
 * Provides a centralized function for logging UI interactions.
 * Automatically captures context (session status, current task, elapsed time).
 *
 * @new 014-ui-logging-system
 */

import type { LogAction, LogEntry } from '$lib/types';
import { logStore } from '$lib/stores/logStore.svelte';
import { sessionStore } from '$lib/stores/sessionStore.svelte';
import { timerStore } from '$lib/stores/timerStore.svelte';

/**
 * Log a UI interaction with automatic context capture.
 *
 * Captures:
 * - Current timestamp with millisecond precision
 * - Session status (idle, running, complete)
 * - Current task ID and name (if any)
 * - Timer elapsed time (if timer is running)
 *
 * @param action - The type of action being logged (see LogAction type)
 * @param parameters - Optional action-specific parameters
 *
 * @example
 * // Log a simple action
 * logAction('START_DAY');
 *
 * @example
 * // Log an action with parameters
 * logAction('COMPLETE_TASK', { taskId: 'task-123', elapsedMs: 300000 });
 */
export function logAction(
	action: LogAction,
	parameters: Record<string, unknown> = {}
): void {
	const currentTask = sessionStore.currentTask;

	// Note: ConfirmedTask uses 'name' property, but our test mocks use 'taskName'
	// Handle both for robustness
	const taskName = currentTask
		? (currentTask as { name?: string; taskName?: string }).taskName ?? currentTask.name
		: null;

	const entry: LogEntry = {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		action,
		taskId: currentTask?.taskId ?? null,
		taskName: taskName ?? null,
		elapsedMs: timerStore.elapsedMs ?? null,
		sessionStatus: sessionStore.status,
		parameters
	};

	logStore.addEntry(entry);
}
