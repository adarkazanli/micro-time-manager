<script lang="ts">
	/**
	 * ImpactPanel Component
	 *
	 * Feature: 003-impact-panel
	 * Tasks: T020-T026, T033-T034, T048-T052
	 *
	 * Displays the schedule impact panel showing all tasks with:
	 * - Visual status indicators (completed/current/pending)
	 * - Risk indicators for fixed tasks
	 * - Real-time projection updates
	 * - Drag-and-drop reordering support
	 */

	import type { ConfirmedTask, TaskProgress } from '$lib/types';
	import { createProjectedTasks } from '$lib/services/projection';
	import ImpactTaskRow from './ImpactTaskRow.svelte';

	interface Props {
		tasks: ConfirmedTask[];
		progress: TaskProgress[];
		currentIndex: number;
		elapsedMs: number;
		onReorder?: (fromIndex: number, toIndex: number) => void;
	}

	let { tasks, progress, currentIndex, elapsedMs, onReorder }: Props = $props();

	// Drag state
	let draggedIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	// Derived state for projected tasks (T022: using $derived.by)
	const projectedTasks = $derived.by(() => {
		return createProjectedTasks(tasks, progress, currentIndex, elapsedMs);
	});

	// Summary counts
	const completedCount = $derived(
		projectedTasks.filter((t) => t.displayStatus === 'completed').length
	);
	const _pendingCount = $derived(
		projectedTasks.filter((t) => t.displayStatus === 'pending').length
	);

	// Risk summary for fixed tasks
	const riskSummary = $derived.by(() => {
		const fixedPending = projectedTasks.filter(
			(t) => t.task.type === 'fixed' && t.displayStatus === 'pending'
		);
		return {
			green: fixedPending.filter((t) => t.riskLevel === 'green').length,
			yellow: fixedPending.filter((t) => t.riskLevel === 'yellow').length,
			red: fixedPending.filter((t) => t.riskLevel === 'red').length
		};
	});

	// Check if reordering is possible (used for future edge case display)
	const _canReorder = $derived(
		projectedTasks.some((t) => t.isDraggable) && onReorder !== undefined
	);

	// Drag handlers
	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragEnd() {
		draggedIndex = null;
		dropTargetIndex = null;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		// Only allow dropping on valid targets (after current task)
		if (index <= currentIndex) return;

		dropTargetIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDragLeave() {
		dropTargetIndex = null;
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) {
			handleDragEnd();
			return;
		}

		// Call reorder handler
		onReorder?.(draggedIndex, index);
		handleDragEnd();
	}
</script>

<div class="impact-panel" data-testid="impact-panel">
	<!-- Panel header with task count (T026) -->
	<div class="panel-header">
		<h3 class="panel-title">Schedule Impact</h3>
		<div class="task-counts">
			<span class="count-item" data-testid="completed-count">
				<span class="count-value">{completedCount}</span>
				<span class="count-label">done</span>
			</span>
			<span class="count-separator">/</span>
			<span class="count-item" data-testid="total-count">
				<span class="count-value">{tasks.length}</span>
				<span class="count-label">total</span>
			</span>
		</div>
	</div>

	<!-- Risk summary for fixed tasks -->
	{#if riskSummary.green + riskSummary.yellow + riskSummary.red > 0}
		<div class="risk-summary" data-testid="risk-summary">
			{#if riskSummary.green > 0}
				<span class="risk-count green" title="On schedule">
					<span class="risk-dot"></span>
					{riskSummary.green}
				</span>
			{/if}
			{#if riskSummary.yellow > 0}
				<span class="risk-count yellow" title="At risk">
					<span class="risk-dot"></span>
					{riskSummary.yellow}
				</span>
			{/if}
			{#if riskSummary.red > 0}
				<span class="risk-count red" title="Will be late">
					<span class="risk-dot"></span>
					{riskSummary.red}
				</span>
			{/if}
		</div>
	{/if}

	<!-- Task list (T023: render list of ImpactTaskRow) -->
	<div class="task-list" role="list" data-testid="task-list">
		{#each projectedTasks as projectedTask, index (projectedTask.task.taskId)}
			<div
				class="task-item"
				role="listitem"
				class:drop-target={dropTargetIndex === index}
				class:dragging={draggedIndex === index}
				ondragover={(e) => handleDragOver(e, index)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, index)}
			>
				<ImpactTaskRow
					{projectedTask}
					{index}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				/>
			</div>
		{/each}
		<!-- Drop zone for moving tasks to end of list -->
		{#if draggedIndex !== null && draggedIndex < projectedTasks.length - 1}
			<div
				class="end-drop-zone"
				role="listitem"
				class:drop-target={dropTargetIndex === projectedTasks.length}
				ondragover={(e) => handleDragOver(e, projectedTasks.length)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, projectedTasks.length)}
			>
				<span class="drop-hint">Drop here to move to end</span>
			</div>
		{/if}
	</div>

	<!-- Empty state -->
	{#if tasks.length === 0}
		<div class="empty-state" data-testid="empty-state">
			<p>No tasks in schedule</p>
		</div>
	{/if}

	<!-- All complete state -->
	{#if completedCount === tasks.length && tasks.length > 0}
		<div class="complete-state" data-testid="complete-state">
			<p>All tasks completed!</p>
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.impact-panel {
		@apply bg-white rounded-lg border border-gray-200 p-4;
		@apply flex flex-col gap-4;
	}

	/* Header */
	.panel-header {
		@apply flex items-center justify-between;
	}

	.panel-title {
		@apply text-lg font-semibold text-gray-900;
	}

	.task-counts {
		@apply flex items-center gap-1 text-sm text-gray-500;
	}

	.count-item {
		@apply flex items-center gap-1;
	}

	.count-value {
		@apply font-medium text-gray-700;
	}

	.count-label {
		@apply text-gray-400;
	}

	.count-separator {
		@apply text-gray-300;
	}

	/* Risk summary */
	.risk-summary {
		@apply flex items-center gap-3 text-sm;
	}

	.risk-count {
		@apply flex items-center gap-1 font-medium;
	}

	.risk-count .risk-dot {
		@apply w-2 h-2 rounded-full;
	}

	.risk-count.green {
		@apply text-green-700;
	}

	.risk-count.green .risk-dot {
		@apply bg-green-500;
	}

	.risk-count.yellow {
		@apply text-yellow-700;
	}

	.risk-count.yellow .risk-dot {
		@apply bg-yellow-500;
	}

	.risk-count.red {
		@apply text-red-700;
	}

	.risk-count.red .risk-dot {
		@apply bg-red-500;
	}

	/* Task list */
	.task-list {
		@apply flex flex-col gap-1;
		@apply max-h-[400px] overflow-y-auto;
	}

	.task-item {
		@apply transition-all duration-150;
	}

	.task-item.drop-target {
		@apply border-t-2 border-blue-400;
	}

	.task-item.dragging {
		@apply opacity-50;
	}

	/* End drop zone */
	.end-drop-zone {
		@apply py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg;
		@apply text-center text-sm text-gray-400;
		@apply transition-all duration-150;
	}

	.end-drop-zone.drop-target {
		@apply border-blue-400 bg-blue-50 text-blue-600;
	}

	.drop-hint {
		@apply pointer-events-none;
	}

	/* Empty/complete states */
	.empty-state,
	.complete-state {
		@apply text-center py-8 text-gray-500;
	}

	.complete-state {
		@apply text-green-600 font-medium;
	}
</style>
