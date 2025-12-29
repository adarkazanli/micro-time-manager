<script lang="ts">
	/**
	 * TaskControls Component
	 *
	 * Feature: 002-day-tracking
	 * Task: T018 - Create TaskControls.svelte component with "Start Day" button
	 *
	 * Provides controls for starting, completing tasks and ending day.
	 */

	import type { SessionStatus } from '$lib/types';

	interface Props {
		status: SessionStatus;
		hasSchedule: boolean;
		isLastTask: boolean;
		isLeader?: boolean;
		onStartDay: () => void;
		onCompleteTask: () => void;
		onEndDay: () => void;
	}

	let {
		status,
		hasSchedule,
		isLastTask,
		isLeader = true,
		onStartDay,
		onCompleteTask,
		onEndDay
	}: Props = $props();

	const canStart = $derived(status === 'idle' && hasSchedule && isLeader);
	const canComplete = $derived(status === 'running' && isLeader);
	const isComplete = $derived(status === 'complete');
</script>

<div class="task-controls" data-testid="task-controls">
	{#if !hasSchedule}
		<div class="no-schedule" data-testid="no-schedule-message">
			<p class="message">No schedule imported</p>
			<p class="hint">Import a schedule to start tracking your day.</p>
		</div>
	{:else if isComplete}
		<div class="completed" data-testid="day-completed">
			<p class="message">Day completed!</p>
			<button
				type="button"
				class="btn btn-secondary"
				onclick={onEndDay}
				data-testid="view-summary-btn"
			>
				View Summary
			</button>
		</div>
	{:else if status === 'idle'}
		<button
			type="button"
			class="btn btn-primary btn-large"
			onclick={onStartDay}
			disabled={!canStart}
			data-testid="start-day-btn"
		>
			Start Day
		</button>
	{:else if status === 'running'}
		<div class="running-controls" data-testid="running-controls">
			<button
				type="button"
				class="btn btn-success btn-large"
				onclick={onCompleteTask}
				disabled={!canComplete}
				data-testid="complete-task-btn"
			>
				{#if isLastTask}
					Complete Day
				{:else}
					Complete Task
				{/if}
			</button>
		</div>

		{#if !isLeader}
			<div class="leader-warning" data-testid="leader-warning">
				<p>Another tab is controlling the timer.</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	@reference "tailwindcss";

	/* Mobile-first responsive layout (T025: 013-mobile-responsive) */
	.task-controls {
		@apply flex flex-col items-center;
		@apply gap-3 sm:gap-4; /* Reduced gap on mobile */
		@apply w-full; /* Full width on mobile */
	}

	.no-schedule,
	.completed {
		@apply text-center space-y-2;
	}

	.message {
		@apply text-base sm:text-lg font-medium text-gray-700;
	}

	.hint {
		@apply text-xs sm:text-sm text-gray-500;
	}

	.running-controls {
		@apply flex flex-col items-center;
		@apply gap-2 sm:gap-3;
		@apply w-full; /* Full width on mobile */
	}

	.leader-warning {
		@apply text-amber-600 text-xs sm:text-sm bg-amber-50;
		@apply px-3 py-2 sm:px-4 rounded-lg;
	}

	/* Buttons - responsive with 44px touch targets (T025) */
	.btn {
		@apply inline-flex items-center justify-center;
		@apply px-4 py-3 sm:px-6 rounded-lg font-medium;
		@apply transition-all duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
		@apply min-h-11; /* 44px touch target */
		@apply w-full sm:w-auto; /* Full width on mobile */
		@apply text-sm sm:text-base;
		/* Active state feedback (T024) */
		@apply active:scale-[0.98];
		/* Ensure proper touch handling on mobile (no 300ms delay) */
		touch-action: manipulation;
	}

	.btn:disabled {
		@apply opacity-50 cursor-not-allowed;
	}

	/* Large button - responsive (T025) */
	.btn-large {
		@apply px-6 py-4 sm:px-8;
		@apply text-base sm:text-lg;
		@apply min-h-12 sm:min-h-14; /* Larger touch target */
	}

	.btn-primary {
		@apply bg-blue-600 text-white;
		@apply hover:bg-blue-700;
		@apply focus:ring-blue-500;
	}

	.btn-success {
		@apply bg-green-600 text-white;
		@apply hover:bg-green-700;
		@apply focus:ring-green-500;
	}

	.btn-secondary {
		@apply bg-gray-200 text-gray-700;
		@apply hover:bg-gray-300;
		@apply focus:ring-gray-500;
	}
</style>
