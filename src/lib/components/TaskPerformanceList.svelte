<script lang="ts">
	/**
	 * TaskPerformanceList Component
	 *
	 * Feature: 006-analytics-dashboard
	 * Tasks: T029-T031
	 *
	 * Container for TaskPerformanceRow components.
	 * Displays a list of all tasks with their performance metrics.
	 */

	import type { TaskPerformance } from '$lib/types';
	import TaskPerformanceRow from './TaskPerformanceRow.svelte';

	interface Props {
		taskPerformance: TaskPerformance[];
	}

	let { taskPerformance }: Props = $props();

	const hasData = $derived(taskPerformance.length > 0);
</script>

<div class="task-performance-list" data-testid="task-performance-list">
	<h3 class="card-title">Task Performance</h3>

	{#if hasData}
		<div class="task-list">
			{#each taskPerformance as performance (performance.taskId)}
				<TaskPerformanceRow {performance} />
			{/each}
		</div>
	{:else}
		<div class="empty-state" data-testid="empty-state">
			<p class="empty-text">No tasks to display</p>
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.task-performance-list {
		@apply bg-white rounded-lg border border-gray-200 p-4;
	}

	.card-title {
		@apply text-lg font-semibold text-gray-900 mb-4;
	}

	.task-list {
		@apply divide-y divide-gray-100;
	}

	.empty-state {
		@apply py-6 text-center;
	}

	.empty-text {
		@apply text-sm text-gray-500;
	}
</style>
