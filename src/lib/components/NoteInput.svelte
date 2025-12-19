<script lang="ts">
	/**
	 * NoteInput Component
	 *
	 * Feature: 005-note-capture
	 * Task: T012 - Create NoteInput component with textarea and char counter
	 *
	 * Inline note input with character counter and keyboard shortcuts.
	 * Per spec: Enter saves, Escape cancels, character counter with color feedback.
	 */

	import {
		MAX_NOTE_LENGTH,
		NOTE_CHAR_WARNING_THRESHOLD,
		NOTE_CHAR_DANGER_THRESHOLD
	} from '$lib/types';

	interface Props {
		onSave: (content: string) => void;
		onCancel: () => void;
	}

	let { onSave, onCancel }: Props = $props();
	let content = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	const remaining = $derived(MAX_NOTE_LENGTH - content.length);
	const canSave = $derived(content.trim().length > 0 && content.length <= MAX_NOTE_LENGTH);

	const charCountColor = $derived(() => {
		if (remaining < NOTE_CHAR_DANGER_THRESHOLD) return 'text-red-600';
		if (remaining < NOTE_CHAR_WARNING_THRESHOLD) return 'text-yellow-600';
		return 'text-gray-400';
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && canSave) {
			e.preventDefault();
			onSave(content.trim());
			content = '';
		} else if (e.key === 'Escape') {
			e.preventDefault();
			content = '';
			onCancel();
		}
	}

	function handleSave() {
		if (canSave) {
			onSave(content.trim());
			content = '';
		}
	}

	function handleCancel() {
		content = '';
		onCancel();
	}

	// Auto-focus textarea when component mounts
	$effect(() => {
		if (textareaRef) {
			textareaRef.focus();
		}
	});
</script>

<div class="note-input-container" data-testid="note-input">
	<div class="note-input-wrapper">
		<textarea
			bind:this={textareaRef}
			bind:value={content}
			onkeydown={handleKeydown}
			placeholder="Type your note... (Enter to save, Escape to cancel)"
			class="note-textarea"
			maxlength={MAX_NOTE_LENGTH}
			rows="2"
			data-testid="note-textarea"
		></textarea>
		<div class="note-input-footer">
			<span class="char-counter {charCountColor()}" data-testid="char-counter">
				{remaining} characters remaining
			</span>
			<div class="note-actions">
				<button type="button" class="btn btn-secondary" onclick={handleCancel}>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					onclick={handleSave}
					disabled={!canSave}
					data-testid="note-save-btn"
				>
					Save
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	@reference "tailwindcss";

	.note-input-container {
		@apply w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4;
	}

	.note-input-wrapper {
		@apply flex flex-col gap-2;
	}

	.note-textarea {
		@apply w-full px-3 py-2 border border-gray-300 rounded-lg;
		@apply text-sm text-gray-900;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
		@apply resize-none;
	}

	.note-input-footer {
		@apply flex items-center justify-between;
	}

	.char-counter {
		@apply text-xs;
	}

	.note-actions {
		@apply flex gap-2;
	}

	.btn {
		@apply px-3 py-1.5 rounded-md font-medium text-sm;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.btn-secondary {
		@apply bg-gray-100 text-gray-700 hover:bg-gray-200;
		@apply focus:ring-gray-400;
	}

	.btn-primary {
		@apply bg-blue-600 text-white hover:bg-blue-700;
		@apply focus:ring-blue-500;
		@apply disabled:bg-blue-300 disabled:cursor-not-allowed;
	}
</style>
