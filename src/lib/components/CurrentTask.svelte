<script lang="ts">
	/**
	 * CurrentTask Component
	 *
	 * Feature: 002-day-tracking
	 * Task: T017 - Create CurrentTask.svelte component
	 *
	 * Displays current task name and type badge (fixed/flexible).
	 */

	import type { ConfirmedTask } from '$lib/types';

	interface Props {
		task: ConfirmedTask | null;
		currentIndex: number;
		totalTasks: number;
	}

	let { task, currentIndex, totalTasks }: Props = $props();

	const taskNumber = $derived(currentIndex + 1);

	const typeBadgeClasses = $derived(() => {
		if (!task) return '';
		return task.type === 'fixed'
			? 'bg-blue-100 text-blue-800'
			: 'bg-green-100 text-green-800';
	});
</script>

<div class="current-task" data-testid="current-task">
	{#if task}
		<div class="task-header">
			<span class="task-counter" data-testid="task-counter">
				Task {taskNumber} of {totalTasks}
			</span>
			<span class="type-badge {typeBadgeClasses()}" data-testid="task-type-badge">
				{task.type}
			</span>
		</div>

		<h2 class="task-name" data-testid="task-name">
			{task.name}
		</h2>

		<div class="task-meta">
			<span class="task-duration" data-testid="task-duration">
				{formatDuration(task.plannedDurationSec)}
			</span>
		</div>
	{:else}
		<div class="no-task" data-testid="no-task">
			<p>No task selected</p>
		</div>
	{/if}
</div>

<script module lang="ts">
	/**
	 * Format duration in seconds to human-readable string
	 */
	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m planned`;
		}
		return `${minutes}m planned`;
	}
</script>

<style>
	@reference "tailwindcss";

	.current-task {
		@apply text-center space-y-2;
	}

	.task-header {
		@apply flex items-center justify-center gap-3;
	}

	.task-counter {
		@apply text-sm text-gray-500 font-medium;
	}

	.type-badge {
		@apply inline-block px-2 py-0.5 text-xs font-medium rounded-full;
	}

	.task-name {
		@apply text-2xl font-semibold text-gray-900;
		@apply max-w-md mx-auto;
	}

	:global(.dark) .task-name {
		@apply text-white;
	}

	.task-meta {
		@apply text-sm text-gray-500;
	}

	.no-task {
		@apply text-gray-400 py-4;
	}

	/* Dark mode styles */
	:global(.dark) .task-counter {
		@apply text-gray-400;
	}

	:global(.dark) .task-name {
		@apply text-gray-100;
	}

	:global(.dark) .task-meta {
		@apply text-gray-400;
	}

	:global(.dark) .type-badge.bg-blue-100 {
		@apply bg-blue-900 text-blue-200;
	}

	:global(.dark) .type-badge.bg-green-100 {
		@apply bg-green-900 text-green-200;
	}
</style>
