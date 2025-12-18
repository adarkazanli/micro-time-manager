<script lang="ts">
	import type { DraftTask } from '$lib/types';
	import TaskRow from './TaskRow.svelte';

	interface Props {
		tasks: DraftTask[];
		readonly?: boolean;
		onTaskUpdate?: (id: string, changes: Partial<DraftTask>) => void;
		onReorder?: (fromIndex: number, toIndex: number) => void;
		onConfirm?: () => void;
		onCancel?: () => void;
	}

	let {
		tasks,
		readonly = true,
		onTaskUpdate,
		onReorder,
		onConfirm,
		onCancel
	}: Props = $props();

	// Drag state
	let draggedIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	// Sort tasks by sortOrder for display
	const sortedTasks = $derived([...tasks].sort((a, b) => a.sortOrder - b.sortOrder));

	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	function handleDragEnd() {
		draggedIndex = null;
		dropTargetIndex = null;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		// Only allow dropping on flexible tasks or between them
		const targetTask = sortedTasks[index];
		if (targetTask.type === 'fixed') return;

		dropTargetIndex = index;
	}

	function handleDragLeave() {
		dropTargetIndex = null;
	}

	function handleDrop(e: DragEvent, targetIndex: number) {
		e.preventDefault();

		if (draggedIndex === null || draggedIndex === targetIndex) {
			handleDragEnd();
			return;
		}

		// Only reorder if target is flexible
		const targetTask = sortedTasks[targetIndex];
		if (targetTask.type === 'fixed') {
			handleDragEnd();
			return;
		}

		onReorder?.(draggedIndex, targetIndex);
		handleDragEnd();
	}
</script>

<div class="schedule-preview" data-testid="schedule-preview">
	<header class="preview-header">
		<h2 class="preview-title">Schedule Preview</h2>
		<p class="preview-subtitle">
			{tasks.length} task{tasks.length === 1 ? '' : 's'} ready for import
			{#if !readonly}
				<span class="edit-hint">- Click to edit, drag to reorder flexible tasks</span>
			{/if}
		</p>
	</header>

	<div class="task-list" data-testid="task-list">
		{#each sortedTasks as task, index (task.id)}
			<div
				class="task-wrapper"
				class:is-dragging={draggedIndex === index}
				class:is-drop-target={dropTargetIndex === index}
				ondragover={(e) => handleDragOver(e, index)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, index)}
			>
				<TaskRow
					{task}
					{readonly}
					draggable={!readonly}
					onUpdate={onTaskUpdate}
					onDragStart={() => handleDragStart(index)}
					onDragEnd={handleDragEnd}
				/>
			</div>
		{/each}
	</div>

	{#if !readonly}
		<footer class="preview-actions">
			<button type="button" class="btn btn-secondary" onclick={onCancel}>
				Cancel
			</button>
			<button
				type="button"
				class="btn btn-primary"
				onclick={onConfirm}
				disabled={tasks.length === 0}
			>
				Confirm Schedule
			</button>
		</footer>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.schedule-preview {
		@apply flex flex-col gap-4;
	}

	.preview-header {
		@apply mb-2;
	}

	.preview-title {
		@apply text-xl font-semibold text-gray-900;
	}

	.preview-subtitle {
		@apply text-sm text-gray-600;
	}

	.edit-hint {
		@apply text-gray-400;
	}

	.task-list {
		@apply flex flex-col gap-2;
	}

	.task-wrapper {
		@apply transition-all duration-150;
	}

	.task-wrapper.is-dragging {
		@apply opacity-50;
	}

	.task-wrapper.is-drop-target {
		@apply transform scale-[1.02];
	}

	.task-wrapper.is-drop-target::before {
		content: '';
		@apply absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none;
	}

	.preview-actions {
		@apply flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200;
	}

	.btn {
		@apply px-4 py-2 rounded-lg font-medium transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.btn-primary {
		@apply bg-blue-600 text-white;
		@apply hover:bg-blue-700;
		@apply focus:ring-blue-500;
		@apply disabled:opacity-50 disabled:cursor-not-allowed;
	}

	.btn-secondary {
		@apply bg-gray-100 text-gray-700;
		@apply hover:bg-gray-200;
		@apply focus:ring-gray-500;
	}
</style>
