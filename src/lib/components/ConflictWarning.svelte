<script lang="ts">
	/**
	 * ConflictWarning Component
	 *
	 * Feature: 011-auto-start-time
	 * Tasks: T063-T065 (User Story 4)
	 *
	 * Displays a warning when fixed tasks have scheduling conflicts (overlap).
	 * Shows task names and overlap duration with option to dismiss.
	 */

	import type { FixedTaskConflict } from '$lib/types';
	import { formatDuration } from '$lib/utils/duration';

	interface Props {
		/** The conflict to display */
		conflict: FixedTaskConflict;
		/** Task names lookup for display (taskId -> name) */
		taskNames?: Map<string, string>;
		/** Whether the warning can be dismissed */
		dismissible?: boolean;
		/** Called when user dismisses the warning */
		onDismiss?: () => void;
	}

	let { conflict, taskNames, dismissible = false, onDismiss }: Props = $props();

	// Get task names for display
	const taskName1 = $derived(taskNames?.get(conflict.taskId1) ?? 'Task 1');
	const taskName2 = $derived(taskNames?.get(conflict.taskId2) ?? 'Task 2');

	// Format overlap duration
	const overlapDisplay = $derived(formatDuration(conflict.overlapSec));

	function handleDismiss() {
		onDismiss?.();
	}
</script>

<div
	class="conflict-warning"
	role="alert"
	aria-live="polite"
	data-testid="conflict-warning"
>
	<!-- Warning icon -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 20 20"
		fill="currentColor"
		class="warning-icon"
		aria-hidden="true"
	>
		<path
			fill-rule="evenodd"
			d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
			clip-rule="evenodd"
		/>
	</svg>

	<div class="warning-content">
		<span class="warning-title">Schedule Conflict</span>
		<span class="warning-message">
			<span class="task-name">{taskName1}</span>
			<span class="separator">and</span>
			<span class="task-name">{taskName2}</span>
			<span class="separator">overlap by</span>
			<span class="overlap-duration">{overlapDisplay}</span>
		</span>
	</div>

	{#if dismissible}
		<button
			type="button"
			class="dismiss-btn"
			onclick={handleDismiss}
			aria-label="Dismiss warning"
			data-testid="dismiss-conflict-warning"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="dismiss-icon"
			>
				<path
					d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
				/>
			</svg>
		</button>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.conflict-warning {
		@apply flex items-start gap-3 px-4 py-3 rounded-lg;
		@apply bg-red-50 text-red-800;
		@apply border border-red-200;
	}

	:global(.dark) .conflict-warning {
		@apply bg-red-900/30 text-red-300 border-red-700;
	}

	.warning-icon {
		@apply w-5 h-5 flex-shrink-0 text-red-500;
	}

	:global(.dark) .warning-icon {
		@apply text-red-400;
	}

	.warning-content {
		@apply flex-1 flex flex-col gap-0.5;
	}

	.warning-title {
		@apply font-semibold text-sm;
	}

	.warning-message {
		@apply text-sm flex flex-wrap items-center gap-1;
	}

	.task-name {
		@apply font-medium text-red-900;
	}

	:global(.dark) .task-name {
		@apply text-red-200;
	}

	.separator {
		@apply text-red-600;
	}

	:global(.dark) .separator {
		@apply text-red-400;
	}

	.overlap-duration {
		@apply font-mono font-semibold text-red-700;
	}

	:global(.dark) .overlap-duration {
		@apply text-red-300;
	}

	.dismiss-btn {
		@apply flex-shrink-0 p-1 rounded;
		@apply text-red-500 hover:text-red-700;
		@apply hover:bg-red-100;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1;
	}

	:global(.dark) .dismiss-btn {
		@apply text-red-400 hover:text-red-200;
		@apply hover:bg-red-800/50;
	}

	.dismiss-icon {
		@apply w-4 h-4;
	}
</style>
