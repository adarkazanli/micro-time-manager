<script lang="ts">
	/**
	 * EditTaskDialog Component
	 *
	 * Feature: 003-impact-panel
	 *
	 * A modal dialog for editing task properties:
	 * - Task name
	 * - Scheduled start time
	 * - Duration
	 * - Type (fixed/flexible)
	 */

	import type { ConfirmedTask, TaskType } from '$lib/types';
	import { formatDuration, parseDuration } from '$lib/utils/duration';

	interface Props {
		task: ConfirmedTask;
		open: boolean;
		onSave: (updates: Partial<Pick<ConfirmedTask, 'name' | 'plannedStart' | 'plannedDurationSec' | 'type'>>) => void;
		onClose: () => void;
	}

	let { task, open, onSave, onClose }: Props = $props();

	// Form state
	let name = $state('');
	let startTime = $state('');
	let duration = $state('');
	let type = $state<TaskType>('flexible');
	let durationError = $state('');

	// Initialize form when task changes
	$effect(() => {
		if (task && open) {
			name = task.name;
			// Format time as HH:MM for input
			const hours = task.plannedStart.getHours().toString().padStart(2, '0');
			const minutes = task.plannedStart.getMinutes().toString().padStart(2, '0');
			startTime = `${hours}:${minutes}`;
			duration = formatDuration(task.plannedDurationSec);
			type = task.type;
			durationError = '';
		}
	});

	function handleSave() {
		// Validate duration
		const parsedDuration = parseDuration(duration);
		if (parsedDuration === null || parsedDuration <= 0) {
			durationError = 'Invalid duration format (e.g., "30m", "1h 30m", "45:00")';
			return;
		}

		// Parse start time - create new Date with updated hours/minutes
		const [hours, minutes] = startTime.split(':').map(Number);
		const newPlannedStart = new Date(
			task.plannedStart.getFullYear(),
			task.plannedStart.getMonth(),
			task.plannedStart.getDate(),
			hours,
			minutes,
			0,
			0
		);

		onSave({
			name: name.trim(),
			plannedStart: newPlannedStart,
			plannedDurationSec: parsedDuration,
			type
		});
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if open}
	<div
		class="dialog-backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="dialog-title"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div class="dialog-content">
			<h2 id="dialog-title" class="dialog-title">Edit Task</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
				<!-- Task Name -->
				<div class="form-group">
					<label for="task-name" class="form-label">Task Name</label>
					<input
						id="task-name"
						type="text"
						class="form-input"
						bind:value={name}
						required
						maxlength="200"
					/>
				</div>

				<!-- Start Time -->
				<div class="form-group">
					<label for="start-time" class="form-label">Start Time</label>
					<input
						id="start-time"
						type="time"
						class="form-input"
						bind:value={startTime}
						required
					/>
				</div>

				<!-- Duration -->
				<div class="form-group">
					<label for="duration" class="form-label">Duration</label>
					<input
						id="duration"
						type="text"
						class="form-input"
						class:error={durationError}
						bind:value={duration}
						placeholder="e.g., 30m, 1h 30m, 45:00"
						required
					/>
					{#if durationError}
						<span class="error-message">{durationError}</span>
					{/if}
				</div>

				<!-- Type -->
				<div class="form-group">
					<label class="form-label">Type</label>
					<div class="type-buttons">
						<button
							type="button"
							class="type-button"
							class:selected={type === 'flexible'}
							onclick={() => type = 'flexible'}
						>
							Flexible
						</button>
						<button
							type="button"
							class="type-button"
							class:selected={type === 'fixed'}
							onclick={() => type = 'fixed'}
						>
							Fixed
						</button>
					</div>
				</div>

				<!-- Actions -->
				<div class="dialog-actions">
					<button type="button" class="btn btn-secondary" onclick={onClose}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Save
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	@reference "tailwindcss";

	.dialog-backdrop {
		@apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
	}

	.dialog-content {
		@apply bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4;
	}

	.dialog-title {
		@apply text-xl font-semibold text-gray-900 mb-4;
	}

	.form-group {
		@apply mb-4;
	}

	.form-label {
		@apply block text-sm font-medium text-gray-700 mb-1;
	}

	.form-input {
		@apply w-full px-3 py-2 border border-gray-300 rounded-md;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}

	.form-input.error {
		@apply border-red-500;
	}

	.error-message {
		@apply text-sm text-red-600 mt-1;
	}

	.type-buttons {
		@apply flex gap-2;
	}

	.type-button {
		@apply flex-1 px-4 py-2 border rounded-md text-sm font-medium;
		@apply transition-colors duration-150;
		@apply border-gray-300 text-gray-700 bg-white;
		@apply hover:bg-gray-50;
	}

	.type-button.selected {
		@apply border-blue-500 bg-blue-50 text-blue-700;
	}

	.dialog-actions {
		@apply flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200;
	}

	.btn {
		@apply px-4 py-2 rounded-md text-sm font-medium;
		@apply transition-colors duration-150;
	}

	.btn-secondary {
		@apply border border-gray-300 text-gray-700 bg-white;
		@apply hover:bg-gray-50;
	}

	.btn-primary {
		@apply bg-blue-600 text-white;
		@apply hover:bg-blue-700;
	}
</style>
