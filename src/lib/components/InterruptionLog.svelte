<script lang="ts">
	/**
	 * InterruptionLog Component
	 *
	 * Feature: 004-interruption-tracking
	 * Tasks: T047, T048 - Full interruption history view
	 *
	 * Shows list of all interruptions with details.
	 * Entries display timestamp, duration, category, note, and task name.
	 */

	import type { Interruption, ConfirmedTask } from '$lib/types';

	interface Props {
		interruptions: Interruption[];
		tasks: ConfirmedTask[];
		onClose: () => void;
	}

	let { interruptions, tasks, onClose }: Props = $props();

	/**
	 * Get task name by ID
	 */
	function getTaskName(taskId: string): string {
		const task = tasks.find((t) => t.taskId === taskId);
		return task?.name ?? 'Unknown Task';
	}

	/**
	 * Format ISO timestamp as local time (HH:MM)
	 */
	function formatTime(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	/**
	 * Format seconds as duration string
	 */
	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (minutes === 0) return `${secs}s`;
		if (secs === 0) return `${minutes}m`;
		return `${minutes}m ${secs}s`;
	}

	// Sort interruptions by startedAt descending (most recent first)
	const sortedInterruptions = $derived(
		[...interruptions]
			.filter((i) => i.endedAt !== null)
			.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
	);
</script>

<div class="interruption-log" data-testid="interruption-log">
	<div class="log-header">
		<h3 class="log-title">Interruption Log</h3>
		<button type="button" class="close-btn" onclick={onClose}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon">
				<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
			</svg>
		</button>
	</div>

	{#if sortedInterruptions.length === 0}
		<p class="empty-message">No interruptions recorded yet.</p>
	{:else}
		<ul class="entry-list">
			{#each sortedInterruptions as interruption (interruption.interruptionId)}
				<li class="entry" data-testid="interruption-entry">
					<div class="entry-main">
						<span class="entry-time">{formatTime(interruption.startedAt)}</span>
						<span class="entry-duration">{formatDuration(interruption.durationSec)}</span>
						<span class="entry-task">{getTaskName(interruption.taskId)}</span>
					</div>
					<div class="entry-details">
						{#if interruption.category}
							<span class="entry-category" data-testid="interruption-category">
								{interruption.category}
							</span>
						{/if}
						{#if interruption.note}
							<span class="entry-note" data-testid="interruption-note">
								{interruption.note}
							</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.interruption-log {
		@apply bg-white rounded-lg border border-gray-200 shadow-sm;
		@apply max-h-96 overflow-hidden flex flex-col;
	}

	.log-header {
		@apply flex items-center justify-between px-4 py-3 border-b border-gray-200;
	}

	.log-title {
		@apply text-sm font-semibold text-gray-900;
	}

	.close-btn {
		@apply p-1 text-gray-400 hover:text-gray-600;
		@apply transition-colors duration-150;
	}

	.icon {
		@apply w-5 h-5;
	}

	.empty-message {
		@apply px-4 py-6 text-center text-sm text-gray-500;
	}

	.entry-list {
		@apply divide-y divide-gray-100 overflow-y-auto;
	}

	.entry {
		@apply px-4 py-3;
	}

	.entry-main {
		@apply flex items-center gap-3 text-sm;
	}

	.entry-time {
		@apply text-gray-500 font-mono text-xs;
	}

	.entry-duration {
		@apply font-medium text-amber-600;
	}

	.entry-task {
		@apply text-gray-700 truncate flex-1;
	}

	.entry-details {
		@apply flex flex-wrap gap-2 mt-1;
	}

	.entry-category {
		@apply text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600;
	}

	.entry-note {
		@apply text-xs text-gray-500 italic;
	}
</style>
