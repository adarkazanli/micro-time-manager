<script lang="ts">
	/**
	 * NoteRow Component
	 *
	 * Feature: 005-note-capture
	 * Task: T022 - Create NoteRow component with content, timestamp, task name
	 *
	 * Displays a single note with its content, timestamp, and associated task.
	 */

	import type { Note } from '$lib/types';
	import { formatRelativeTime } from '$lib/utils/time';

	interface Props {
		note: Note;
		taskName: string | null;
		onEdit?: (noteId: string) => void;
		onDelete?: (noteId: string) => void;
	}

	let { note, taskName, onEdit, onDelete }: Props = $props();

	const displayTaskName = $derived(taskName ?? 'General');
	const relativeTime = $derived(formatRelativeTime(note.createdAt));
	const wasEdited = $derived(note.updatedAt !== null);
</script>

<div class="note-row" data-testid="note-row">
	<div class="note-header">
		<span class="note-task" data-testid="note-task-name">{displayTaskName}</span>
		<span class="note-time" title={note.createdAt}>
			{relativeTime}
			{#if wasEdited}
				<span class="edited-indicator">(edited)</span>
			{/if}
		</span>
	</div>
	<div class="note-content" data-testid="note-content">{note.content}</div>
	{#if onEdit || onDelete}
		<div class="note-actions">
			{#if onEdit}
				<button
					type="button"
					class="btn-action btn-edit"
					onclick={() => onEdit(note.noteId)}
					data-testid="note-edit-btn"
				>
					Edit
				</button>
			{/if}
			{#if onDelete}
				<button
					type="button"
					class="btn-action btn-delete"
					onclick={() => onDelete(note.noteId)}
					data-testid="note-delete-btn"
				>
					Delete
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.note-row {
		@apply p-3 bg-white border border-gray-200 rounded-lg;
	}

	.note-header {
		@apply flex items-center justify-between mb-2;
	}

	.note-task {
		@apply text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded;
	}

	.note-time {
		@apply text-xs text-gray-400;
	}

	.edited-indicator {
		@apply text-gray-300 ml-1;
	}

	.note-content {
		@apply text-sm text-gray-700 whitespace-pre-wrap break-words;
	}

	.note-actions {
		@apply flex gap-2 mt-2 pt-2 border-t border-gray-100;
	}

	.btn-action {
		@apply text-xs font-medium px-2 py-1 rounded;
		@apply transition-colors duration-150;
	}

	.btn-edit {
		@apply text-gray-500 hover:text-gray-700 hover:bg-gray-100;
	}

	.btn-delete {
		@apply text-red-500 hover:text-red-700 hover:bg-red-50;
	}
</style>
