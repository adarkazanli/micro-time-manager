<script lang="ts">
	/**
	 * NotesView Component
	 *
	 * Feature: 005-note-capture
	 * Task: T024 - Create NotesView component with notes list
	 * Task: T027 - Add empty state message
	 * Task: T033-T034 - Add task filter dropdown
	 * Task: T040-T041 - Add search input field
	 *
	 * Panel displaying all notes with search and filter capabilities.
	 */

	import type { ConfirmedTask } from '$lib/types';
	import { noteStore } from '$lib/stores/noteStore.svelte';
	import NoteRow from './NoteRow.svelte';

	interface Props {
		tasks: ConfirmedTask[];
		onEdit?: (noteId: string) => void;
		onDelete?: (noteId: string) => void;
		onClose: () => void;
	}

	let { tasks, onEdit, onDelete, onClose }: Props = $props();

	// Get task name by ID
	function getTaskName(taskId: string | null): string | null {
		if (!taskId) return null;
		const task = tasks.find((t) => t.taskId === taskId);
		return task?.name ?? null;
	}

	// Get unique task IDs that have notes
	const tasksWithNotes = $derived(() => {
		const taskIds = new Set(noteStore.notes.map((n) => n.taskId).filter((id) => id !== null));
		return Array.from(taskIds) as string[];
	});

	// Check if there are any general notes (taskId = null)
	const hasGeneralNotes = $derived(noteStore.notes.some((n) => n.taskId === null));
</script>

<div class="notes-view" data-testid="notes-view">
	<div class="notes-header">
		<h2 class="notes-title">Notes</h2>
		<button
			type="button"
			class="btn-close"
			onclick={onClose}
			aria-label="Close notes"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
				<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
			</svg>
		</button>
	</div>

	<!-- Search and Filter -->
	<div class="notes-filters">
		<input
			type="text"
			class="search-input"
			placeholder="Search notes..."
			value={noteStore.searchQuery}
			oninput={(e) => noteStore.setSearchQuery((e.target as HTMLInputElement).value)}
			data-testid="notes-search"
		/>
		<select
			class="task-filter"
			value={noteStore.taskFilter ?? ''}
			onchange={(e) => {
				const value = (e.target as HTMLSelectElement).value;
				noteStore.setTaskFilter(value === '' ? null : value === '__general__' ? null : value);
				// Special handling for "General Notes" filter
				if (value === '__general__') {
					noteStore.setTaskFilter(null);
				}
			}}
			data-testid="notes-task-filter"
		>
			<option value="">All Tasks</option>
			{#if hasGeneralNotes}
				<option value="__general__">General Notes</option>
			{/if}
			{#each tasksWithNotes() as taskId (taskId)}
				<option value={taskId}>{getTaskName(taskId) ?? 'Unknown Task'}</option>
			{/each}
		</select>
	</div>

	<!-- Notes List -->
	<div class="notes-list" data-testid="notes-list">
		{#if noteStore.filteredNotes.length === 0}
			<div class="empty-state" data-testid="notes-empty-state">
				{#if noteStore.notes.length === 0}
					<p class="empty-message">No notes yet</p>
					<p class="empty-hint">Press Ctrl+N (Cmd+N on Mac) or click "Add Note" to create your first note</p>
				{:else}
					<p class="empty-message">No notes found</p>
					<p class="empty-hint">Try adjusting your search or filter</p>
				{/if}
			</div>
		{:else}
			{#each noteStore.filteredNotes as note (note.noteId)}
				<NoteRow
					{note}
					taskName={getTaskName(note.taskId)}
					{onEdit}
					{onDelete}
				/>
			{/each}
		{/if}
	</div>

	<!-- Clear Filters Button -->
	{#if noteStore.searchQuery || noteStore.taskFilter !== null}
		<div class="clear-filters">
			<button
				type="button"
				class="btn-clear"
				onclick={() => noteStore.clearFilters()}
			>
				Clear filters
			</button>
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.notes-view {
		@apply bg-white rounded-lg shadow-lg border border-gray-200;
		@apply w-full max-w-md max-h-[80vh] flex flex-col;
	}

	.notes-header {
		@apply flex items-center justify-between p-4 border-b border-gray-200;
	}

	.notes-title {
		@apply text-lg font-semibold text-gray-900;
	}

	.btn-close {
		@apply w-8 h-8 flex items-center justify-center;
		@apply text-gray-400 hover:text-gray-600;
		@apply rounded-full hover:bg-gray-100;
		@apply transition-colors duration-150;
	}

	.btn-close svg {
		@apply w-5 h-5;
	}

	.notes-filters {
		@apply flex gap-2 p-4 border-b border-gray-100;
	}

	.search-input {
		@apply flex-1 px-3 py-2 text-sm;
		@apply border border-gray-300 rounded-lg;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}

	.task-filter {
		@apply px-3 py-2 text-sm;
		@apply border border-gray-300 rounded-lg bg-white;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}

	.notes-list {
		@apply flex-1 overflow-y-auto p-4 space-y-3;
	}

	.empty-state {
		@apply flex flex-col items-center justify-center py-8 text-center;
	}

	.empty-message {
		@apply text-gray-500 font-medium;
	}

	.empty-hint {
		@apply text-gray-400 text-sm mt-1;
	}

	.clear-filters {
		@apply p-4 border-t border-gray-100;
	}

	.btn-clear {
		@apply w-full py-2 text-sm text-gray-500 hover:text-gray-700;
		@apply hover:bg-gray-50 rounded-lg;
		@apply transition-colors duration-150;
	}
</style>
