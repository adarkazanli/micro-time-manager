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
	<!-- Prominent "Save X min" badge -->
	<div class="save-time-badge" data-testid="save-time-badge">
		<span class="save-time-value">{warning.minutesLate}</span>
		<span class="save-time-unit">min</span>
		<span class="save-time-label">to save</span>
	</div>

	<div class="warning-content">
		<p class="warning-message">
			<strong>Running late for {warning.taskName}</strong>
		</p>
		<p class="warning-detail">
			Appointment at {typeof formattedTime === 'function' ? formattedTime() : formattedTime} — finish current task {warning.minutesLate} min early to make it
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
		@apply flex items-center gap-4 p-4 bg-amber-50 border border-amber-300 rounded-lg;
		@apply shadow-md;
	}

	/* Prominent "Save X min" badge */
	.save-time-badge {
		@apply flex flex-col items-center justify-center;
		@apply bg-amber-500 text-white rounded-lg;
		@apply px-3 py-2 min-w-[70px];
		@apply shadow-sm;
	}

	.save-time-value {
		@apply text-2xl font-bold leading-none;
	}

	.save-time-unit {
		@apply text-xs font-medium opacity-90;
	}

	.save-time-label {
		@apply text-[10px] uppercase tracking-wide opacity-75 mt-0.5;
	}

	.warning-content {
		@apply flex-1;
	}

	.warning-message {
		@apply text-sm text-amber-900;
	}

	.warning-message strong {
		@apply font-semibold;
	}

	.warning-detail {
		@apply text-xs text-amber-700 mt-1;
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
