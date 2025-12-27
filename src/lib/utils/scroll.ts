/**
 * Scroll utilities for task list navigation
 *
 * Feature: 012-fixed-task-reorder
 */

/**
 * Scrolls to a task element and applies a temporary highlight.
 *
 * @param taskId - The task ID to scroll to
 * @param setHighlightedId - State setter for highlighted task ID
 * @param highlightDurationMs - Duration of highlight in ms (default: 1500)
 *
 * @example
 * ```ts
 * let highlightedTaskId = $state<string | null>(null);
 * scrollToTaskAndHighlight('task-123', (id) => highlightedTaskId = id);
 * ```
 */
export function scrollToTaskAndHighlight(
	taskId: string,
	setHighlightedId: (id: string | null) => void,
	highlightDurationMs: number = 1500
): void {
	// Find the element by data-task-id attribute
	const element = document.querySelector(`[data-task-id="${taskId}"]`);
	if (!element) return;

	// Check if element is in viewport
	const rect = element.getBoundingClientRect();
	const inViewport =
		rect.top >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);

	// Scroll if needed
	if (!inViewport) {
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'center'
		});
	}

	// Apply highlight
	setHighlightedId(taskId);
	setTimeout(() => {
		setHighlightedId(null);
	}, highlightDurationMs);
}
