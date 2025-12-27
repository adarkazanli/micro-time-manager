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

	import type { ConfirmedTask, TaskType, TaskProgress } from '$lib/types';
	import { formatDuration, parseDuration } from '$lib/utils/duration';

	interface Props {
		task: ConfirmedTask;
		/** Task progress data (for completed task correction) */
		progress?: TaskProgress;
		/** Current elapsed time in ms (for current task) */
		currentElapsedMs?: number;
		/** Whether this is the current active task */
		isCurrentTask?: boolean;
		open: boolean;
		onSave: (updates: Partial<Pick<ConfirmedTask, 'name' | 'plannedStart' | 'plannedDurationSec' | 'type'>>) => void;
		/** Callback to save progress updates (actual duration) */
		onSaveProgress?: (updates: { actualDurationSec: number }) => void;
		/** Callback to update timer elapsed time (for current task) */
		onUpdateElapsed?: (elapsedMs: number) => void;
		/** Callback to mark task as incomplete */
		onUncomplete?: () => void;
		onClose: () => void;
	}

	let { task, progress, currentElapsedMs, isCurrentTask, open, onSave, onSaveProgress, onUpdateElapsed, onUncomplete, onClose }: Props = $props();

	// Form state
	let name = $state('');
	let startTime = $state('');
	let duration = $state('');
	let type = $state<TaskType>('flexible');
	let durationError = $state('');
	let nameError = $state('');

	// Correction state (for completed/current tasks)
	let actualDuration = $state('');
	let actualDurationError = $state('');
	let showUncompleteConfirm = $state(false);

	// Derived: is this task completed?
	const isCompleted = $derived(progress?.status === 'complete');

	// Derived: should we show elapsed time editing? (completed OR current task)
	const showElapsedTime = $derived(isCompleted || isCurrentTask);

	// Reference to name input for auto-focus
	let nameInputRef = $state<HTMLInputElement | null>(null);

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
			nameError = '';

			// Initialize elapsed time for completed or current tasks
			if (progress?.status === 'complete') {
				actualDuration = formatDuration(progress.actualDurationSec);
			} else if (isCurrentTask && currentElapsedMs !== undefined) {
				actualDuration = formatDuration(Math.floor(currentElapsedMs / 1000));
			} else {
				actualDuration = '';
			}
			actualDurationError = '';
			showUncompleteConfirm = false;

			// Auto-focus the name input after a tick to ensure DOM is ready
			setTimeout(() => {
				nameInputRef?.focus();
			}, 0);
		}
	});

	function handleSave() {
		// Validate name (trim and check non-empty)
		const trimmedName = name.trim();
		if (!trimmedName) {
			nameError = 'Task name is required';
			return;
		}
		nameError = '';

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
			name: trimmedName,
			plannedStart: newPlannedStart,
			plannedDurationSec: parsedDuration,
			type
		});
		onClose();
	}

	function handleSaveProgress() {
		// Validate name
		const trimmedName = name.trim();
		if (!trimmedName) {
			nameError = 'Task name is required';
			return;
		}
		nameError = '';

		// Validate actual duration
		const parsedActualDuration = parseDuration(actualDuration);
		if (parsedActualDuration === null || parsedActualDuration <= 0) {
			actualDurationError = 'Invalid duration format (e.g., "30m", "1h 30m", "45:00")';
			return;
		}
		actualDurationError = '';

		// Validate planned duration
		const parsedPlannedDuration = parseDuration(duration);
		if (parsedPlannedDuration === null || parsedPlannedDuration <= 0) {
			durationError = 'Invalid duration format (e.g., "30m", "1h 30m", "45:00")';
			return;
		}
		durationError = '';

		// Build updates object for task properties
		const taskUpdates: Partial<Pick<ConfirmedTask, 'name' | 'plannedDurationSec'>> = {};

		if (trimmedName !== task.name) {
			taskUpdates.name = trimmedName;
		}
		if (parsedPlannedDuration !== task.plannedDurationSec) {
			taskUpdates.plannedDurationSec = parsedPlannedDuration;
		}

		// Save task changes if any
		if (Object.keys(taskUpdates).length > 0) {
			onSave(taskUpdates);
		}

		// Save elapsed time based on task status
		if (isCompleted) {
			// For completed tasks, update the progress record
			onSaveProgress?.({ actualDurationSec: parsedActualDuration });
		} else if (isCurrentTask) {
			// For current task, update the timer
			onUpdateElapsed?.(parsedActualDuration * 1000);
		}
		onClose();
	}

	function handleUncomplete() {
		if (!showUncompleteConfirm) {
			showUncompleteConfirm = true;
			return;
		}
		onUncomplete?.();
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
	>
		<div class="dialog-content" onkeydown={handleKeydown}>
			<h2 id="dialog-title" class="dialog-title">Edit Task</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSave(); }}>
				<!-- Task Name (always shown) -->
				<div class="form-group">
					<label for="task-name" class="form-label">Task Name</label>
					<input
						bind:this={nameInputRef}
						id="task-name"
						type="text"
						class="form-input"
						class:error={nameError}
						bind:value={name}
						required
						maxlength="200"
					/>
					{#if nameError}
						<span class="error-message">{nameError}</span>
					{/if}
				</div>

				{#if showElapsedTime}
					<!-- Completed/Current Task: Show elapsed time editing -->
					<div class="form-group">
						<label for="actual-duration" class="form-label">Elapsed Time</label>
						<input
							id="actual-duration"
							type="text"
							class="form-input"
							class:error={actualDurationError}
							bind:value={actualDuration}
							placeholder="e.g., 30m, 1h 30m, 45:00"
						/>
						{#if actualDurationError}
							<span class="error-message">{actualDurationError}</span>
						{/if}
					</div>

					<!-- Planned Duration (editable to simulate schedule impact) -->
					<div class="form-group">
						<label for="planned-duration" class="form-label">Planned Duration</label>
						<input
							id="planned-duration"
							type="text"
							class="form-input"
							class:error={durationError}
							bind:value={duration}
							placeholder="e.g., 30m, 1h 30m, 45:00"
						/>
						{#if durationError}
							<span class="error-message">{durationError}</span>
						{/if}
						<p class="field-hint">Adjust to see impact on rest of schedule</p>
					</div>

					{#if isCompleted}
						<!-- Mark as Incomplete (only for completed tasks) -->
						<div class="form-group">
							<label class="form-label">Status</label>
							{#if showUncompleteConfirm}
								<p class="confirm-message">Are you sure? This will reset the task timer.</p>
							{/if}
							<button
								type="button"
								class="btn btn-warning"
								onclick={handleUncomplete}
							>
								{showUncompleteConfirm ? 'Confirm: Mark as Incomplete' : 'Mark as Incomplete'}
							</button>
						</div>
					{/if}

					<!-- Actions for completed/current tasks -->
					<div class="dialog-actions">
						<button type="button" class="btn btn-secondary" onclick={onClose}>
							Cancel
						</button>
						<button type="button" class="btn btn-primary" onclick={handleSaveProgress}>
							Save Changes
						</button>
					</div>
				{:else}
					<!-- Non-completed Task: Show planning fields -->
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

					<!-- Actions for non-completed tasks -->
					<div class="dialog-actions">
						<button type="button" class="btn btn-secondary" onclick={onClose}>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary">
							Save
						</button>
					</div>
				{/if}
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
		@apply bg-white text-gray-900;
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

	/* Field hint for showing planned duration */
	.field-hint {
		@apply text-sm text-gray-500 mt-1;
	}

	.btn-warning {
		@apply w-full bg-amber-100 text-amber-800 border border-amber-300;
		@apply hover:bg-amber-200;
	}

	.confirm-message {
		@apply text-sm text-amber-700 mb-2;
	}
</style>
