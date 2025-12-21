<script lang="ts">
	/**
	 * EditInterruptionDialog Component
	 *
	 * Feature: 004-interruption-tracking
	 * Task: T034 - Edit category/note after resume
	 *
	 * Modal dialog for editing interruption category and note.
	 */

	import type { Interruption, InterruptionCategory } from '$lib/types';
	import { INTERRUPTION_CATEGORIES, MAX_INTERRUPTION_NOTE_LENGTH } from '$lib/types';

	interface Props {
		interruption: Interruption | null;
		open: boolean;
		onSave: (updates: { category: InterruptionCategory | null; note: string | null }) => void;
		onClose: () => void;
	}

	let { interruption, open, onSave, onClose }: Props = $props();

	let selectedCategory = $state<InterruptionCategory | null>(null);
	let noteText = $state('');

	// Reset form when dialog opens with new interruption
	$effect(() => {
		if (open && interruption) {
			selectedCategory = interruption.category;
			noteText = interruption.note ?? '';
		}
	});

	function handleSave() {
		onSave({
			category: selectedCategory,
			note: noteText.trim() || null
		});
		onClose();
	}

	function handleCancel() {
		onClose();
	}
</script>

{#if open}
	<div class="dialog-backdrop" data-testid="edit-interruption-dialog">
		<div class="dialog-content">
			<h2 class="dialog-title">Edit Interruption</h2>

			<div class="form-section">
				<label class="section-label">Category</label>
				<div class="category-options">
					{#each INTERRUPTION_CATEGORIES as category (category)}
						<label class="category-option">
							<input
								type="radio"
								name="category"
								value={category}
								checked={selectedCategory === category}
								onchange={() => (selectedCategory = category)}
							/>
							<span class="category-label">{category}</span>
						</label>
					{/each}
					<label class="category-option">
						<input
							type="radio"
							name="category"
							value=""
							checked={selectedCategory === null}
							onchange={() => (selectedCategory = null)}
						/>
						<span class="category-label">None</span>
					</label>
				</div>
			</div>

			<div class="form-section">
				<label for="interruption-note" class="section-label">
					Note <span class="char-count">({noteText.length}/{MAX_INTERRUPTION_NOTE_LENGTH})</span>
				</label>
				<textarea
					id="interruption-note"
					data-testid="interruption-note-input"
					class="note-input"
					bind:value={noteText}
					maxlength={MAX_INTERRUPTION_NOTE_LENGTH}
					placeholder="Add a note about this interruption..."
					rows="3"
				></textarea>
			</div>

			<div class="dialog-actions">
				<button type="button" class="btn btn-secondary" onclick={handleCancel}>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-primary"
					data-testid="save-interruption-btn"
					onclick={handleSave}
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@reference "tailwindcss";

	.dialog-backdrop {
		@apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
	}

	.dialog-content {
		@apply bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4;
	}

	.dialog-title {
		@apply text-lg font-semibold text-gray-900 mb-4;
	}

	.form-section {
		@apply mb-4;
	}

	.section-label {
		@apply block text-sm font-medium text-gray-700 mb-2;
	}

	.char-count {
		@apply text-gray-400 font-normal;
	}

	.category-options {
		@apply flex flex-wrap gap-2;
	}

	.category-option {
		@apply flex items-center gap-1.5 cursor-pointer;
	}

	.category-option input[type="radio"] {
		@apply w-4 h-4 text-blue-600 focus:ring-blue-500;
	}

	.category-label {
		@apply text-sm text-gray-700;
	}

	.note-input {
		@apply w-full px-3 py-2 border border-gray-300 rounded-lg;
		@apply text-sm text-gray-900;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
		@apply resize-none;
	}

	.dialog-actions {
		@apply flex justify-end gap-3 mt-6;
	}

	.btn {
		@apply px-4 py-2 rounded-lg font-medium text-sm;
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
	}
</style>
