<script lang="ts">
	/**
	 * InterruptionSummary Component
	 *
	 * Feature: 004-interruption-tracking
	 * Task: T041 - Per-task interruption count and total time display
	 *
	 * Shows count of interruptions and formatted total time.
	 * Includes "Edit" link to edit the most recent interruption.
	 */

	interface Props {
		count: number;
		totalDurationSec: number;
		onEditLast?: () => void;
	}

	let { count, totalDurationSec, onEditLast }: Props = $props();

	/**
	 * Format seconds as human-readable duration
	 */
	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (minutes === 0) return `${secs}s`;
		if (secs === 0) return `${minutes}m`;
		return `${minutes}m ${secs}s`;
	}

	const formattedDuration = $derived(formatDuration(totalDurationSec));
	const interruptionWord = $derived(count === 1 ? 'interruption' : 'interruptions');
</script>

<div class="interruption-summary" data-testid="interruption-summary">
	<div class="summary-content">
		<span class="count" data-testid="interruption-count">{count}</span>
		<span class="label">{interruptionWord}</span>
		{#if totalDurationSec > 0}
			<span class="duration">({formattedDuration})</span>
		{/if}
	</div>
	{#if count > 0 && onEditLast}
		<button
			type="button"
			class="edit-link"
			data-testid="edit-interruption-link"
			onclick={onEditLast}
		>
			Edit
		</button>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.interruption-summary {
		@apply flex items-center gap-3 text-sm;
	}

	.summary-content {
		@apply flex items-center gap-1.5 text-gray-600;
	}

	.count {
		@apply font-semibold text-amber-600;
	}

	.label {
		@apply text-gray-500;
	}

	.duration {
		@apply text-gray-400;
	}

	.edit-link {
		@apply text-blue-600 hover:text-blue-800 underline text-xs;
		@apply transition-colors duration-150;
	}
</style>
