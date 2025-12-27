<script lang="ts">
	/**
	 * ScheduleOverflowWarning Component
	 *
	 * Feature: 011-auto-start-time
	 * Tasks: T066-T068 (User Story 4)
	 *
	 * Displays a warning when the schedule extends past midnight.
	 * Shows the projected end time on the next day.
	 */

	import { formatTime } from '$lib/utils/time';

	interface Props {
		/** The projected end time of the schedule */
		scheduleEndTime: Date;
		/** Whether the warning can be dismissed */
		dismissible?: boolean;
		/** Called when user dismisses the warning */
		onDismiss?: () => void;
	}

	let { scheduleEndTime, dismissible = false, onDismiss }: Props = $props();

	// Format end time for display
	const endTimeDisplay = $derived(formatTime(scheduleEndTime, '12h'));

	// Calculate how far past midnight (for context)
	const minutesPastMidnight = $derived(() => {
		const hours = scheduleEndTime.getHours();
		const minutes = scheduleEndTime.getMinutes();
		return hours * 60 + minutes;
	});

	// Display "next day" context
	const nextDayLabel = $derived(() => {
		const mins = minutesPastMidnight();
		if (mins < 360) {
			// Before 6 AM
			return 'early next morning';
		} else if (mins < 720) {
			// Before noon
			return 'next morning';
		} else {
			return 'next day';
		}
	});

	function handleDismiss() {
		onDismiss?.();
	}
</script>

<div
	class="overflow-warning"
	role="alert"
	aria-live="polite"
	data-testid="overflow-warning"
>
	<!-- Warning icon (clock with exclamation) -->
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
		<span class="warning-title">Schedule Extends Past Midnight</span>
		<span class="warning-message">
			Your schedule will end at
			<span class="end-time">{endTimeDisplay}</span>
			<span class="next-day-label">({nextDayLabel()})</span>
		</span>
	</div>

	{#if dismissible}
		<button
			type="button"
			class="dismiss-btn"
			onclick={handleDismiss}
			aria-label="Dismiss warning"
			data-testid="dismiss-overflow-warning"
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

	.overflow-warning {
		@apply flex items-start gap-3 px-4 py-3 rounded-lg;
		@apply bg-amber-50 text-amber-800;
		@apply border border-amber-200;
	}

	:global(.dark) .overflow-warning {
		@apply bg-amber-900/30 text-amber-300 border-amber-700;
	}

	.warning-icon {
		@apply w-5 h-5 flex-shrink-0 text-amber-500;
	}

	:global(.dark) .warning-icon {
		@apply text-amber-400;
	}

	.warning-content {
		@apply flex-1 flex flex-col gap-0.5;
	}

	.warning-title {
		@apply font-semibold text-sm;
	}

	.warning-message {
		@apply text-sm;
	}

	.end-time {
		@apply font-mono font-semibold text-amber-700;
	}

	:global(.dark) .end-time {
		@apply text-amber-200;
	}

	.next-day-label {
		@apply text-amber-600 italic;
	}

	:global(.dark) .next-day-label {
		@apply text-amber-400;
	}

	.dismiss-btn {
		@apply flex-shrink-0 p-1 rounded;
		@apply text-amber-500 hover:text-amber-700;
		@apply hover:bg-amber-100;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1;
	}

	:global(.dark) .dismiss-btn {
		@apply text-amber-400 hover:text-amber-200;
		@apply hover:bg-amber-800/50;
	}

	.dismiss-icon {
		@apply w-4 h-4;
	}
</style>
