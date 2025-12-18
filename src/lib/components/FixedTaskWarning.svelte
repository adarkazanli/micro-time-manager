<script lang="ts">
	/**
	 * FixedTaskWarning Component
	 *
	 * Feature: 002-day-tracking
	 * Task: T044 - Create FixedTaskWarning.svelte component
	 *
	 * Displays a warning when current pace will make user late for a fixed task.
	 */

	import type { FixedTaskWarning } from '$lib/types';
	import { formatTime } from '$lib/utils/time';

	interface Props {
		warning: FixedTaskWarning;
		onDismiss?: () => void;
	}

	let { warning, onDismiss }: Props = $props();

	// Format the planned start time for display
	const formattedTime = $derived(() => {
		const date = new Date(warning.plannedStart);
		return formatTime(date, '12h');
	});
</script>

<div class="fixed-task-warning" data-testid="fixed-task-warning" role="alert">
	<div class="warning-icon">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<div class="warning-content">
		<p class="warning-message">
			At current pace, you will be <strong>{warning.minutesLate} min late</strong> for
			<strong>{warning.taskName}</strong>
		</p>
		<p class="warning-detail">
			Planned start: {typeof formattedTime === 'function' ? formattedTime() : formattedTime}
		</p>
	</div>
	{#if onDismiss}
		<button type="button" class="dismiss-btn" onclick={onDismiss} aria-label="Dismiss warning">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
				<path
					d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
				/>
			</svg>
		</button>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.fixed-task-warning {
		@apply flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg;
		@apply shadow-sm;
	}

	.warning-icon {
		@apply flex-shrink-0;
	}

	.warning-icon svg {
		@apply w-6 h-6 text-amber-500;
	}

	.warning-content {
		@apply flex-1;
	}

	.warning-message {
		@apply text-sm text-amber-800;
	}

	.warning-message strong {
		@apply font-semibold;
	}

	.warning-detail {
		@apply text-xs text-amber-600 mt-1;
	}

	.dismiss-btn {
		@apply flex-shrink-0 p-1 rounded-md;
		@apply text-amber-400 hover:text-amber-600;
		@apply hover:bg-amber-100;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2;
	}

	.dismiss-btn svg {
		@apply w-5 h-5;
	}
</style>
