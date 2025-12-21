<script lang="ts">
	/**
	 * AddTaskDialog Component
	 *
	 * Feature: 009-ad-hoc-tasks
	 * Tasks: T016-T022 - Create ad-hoc task dialog
	 *
	 * A modal dialog for creating ad-hoc tasks during an active session:
	 * - Task name (required)
	 * - Duration (required)
	 * - Type (flexible/fixed, defaults based on context)
	 * - Start time (required for fixed tasks)
	 *
	 * Includes warnings for past time and overlapping fixed tasks.
	 */

	import type { ConfirmedTask, TaskType } from '$lib/types';
	import { parseDuration } from '$lib/utils/duration';
	import { sessionStore } from '$lib/stores/sessionStore.svelte';

	interface Props {
		/** Whether the dialog is open */
		open: boolean;
		/** Callback when dialog should close */
		onClose: () => void;
		/** Callback when task is successfully created */
		onTaskCreated?: (task: ConfirmedTask) => void;
	}

	let { open, onClose, onTaskCreated }: Props = $props();

	// Form state
	let name = $state('');
	let duration = $state('');
	let type = $state<TaskType>('flexible');
	let startTime = $state('');

	// Validation errors
	let nameError = $state('');
	let durationError = $state('');
	let startTimeError = $state('');

	// Warnings (non-blocking)
	let warnings = $state<string[]>([]);

	// T029: Context-based type switching - when startTime is entered, switch to fixed
	$effect(() => {
		if (startTime && startTime.length > 0 && type === 'flexible') {
			type = 'fixed';
		}
	});

	// Reference to name input for auto-focus
	let nameInputRef = $state<HTMLInputElement | null>(null);

	// Reset form when dialog opens/closes (T037)
	$effect(() => {
		if (open) {
			resetForm();
			// Auto-focus the name input after a tick to ensure DOM is ready
			setTimeout(() => {
				nameInputRef?.focus();
			}, 0);
		}
	});

	function resetForm() {
		name = '';
		duration = '';
		type = 'flexible';
		startTime = '';
		nameError = '';
		durationError = '';
		startTimeError = '';
		warnings = [];
	}

	/**
	 * Parse time string (HH:MM) to Date object for today
	 */
	function parseTimeToDate(timeStr: string): Date {
		const [hours, minutes] = timeStr.split(':').map(Number);
		const now = new Date();
		return new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			hours,
			minutes,
			0,
			0
		);
	}

	/**
	 * Format time for display
	 */
	function formatTime(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	/**
	 * Check if a fixed task overlaps with existing fixed tasks (FR-014)
	 */
	function checkFixedTaskOverlap(startDate: Date, durationSec: number): ConfirmedTask | null {
		const endTime = new Date(startDate.getTime() + durationSec * 1000);

		for (const task of sessionStore.tasks) {
			if (task.type === 'fixed') {
				const taskEnd = new Date(task.plannedStart.getTime() + task.plannedDurationSec * 1000);
				// Check if time ranges overlap
				if (startDate < taskEnd && endTime > task.plannedStart) {
					return task;
				}
			}
		}
		return null;
	}

	/**
	 * Validate form inputs (T018)
	 */
	function validate(): boolean {
		let valid = true;
		warnings = [];

		// Name validation
		const trimmedName = name.trim();
		if (!trimmedName) {
			nameError = 'Task name is required';
			valid = false;
		} else if (trimmedName.length > 200) {
			nameError = 'Task name too long (max 200 characters)';
			valid = false;
		} else {
			nameError = '';
		}

		// Duration validation
		const parsedDuration = parseDuration(duration);
		if (parsedDuration === null || parsedDuration <= 0) {
			durationError = 'Invalid duration (e.g., "30m", "1h 30m")';
			valid = false;
		} else if (parsedDuration > 86400) {
			durationError = 'Duration cannot exceed 24 hours';
			valid = false;
		} else {
			durationError = '';
		}

		// Start time validation (fixed tasks only)
		if (type === 'fixed') {
			if (!startTime) {
				startTimeError = 'Start time required for fixed tasks';
				valid = false;
			} else {
				startTimeError = '';
				const parsedTime = parseTimeToDate(startTime);

				// T019: Warning for past time (FR-013)
				if (parsedTime < new Date()) {
					warnings.push("This task's scheduled time has already passed");
				}

				// T020: Warning for overlap (FR-014)
				if (parsedDuration !== null && parsedDuration > 0) {
					const overlap = checkFixedTaskOverlap(parsedTime, parsedDuration);
					if (overlap) {
						warnings.push(`Overlaps with "${overlap.name}" at ${formatTime(overlap.plannedStart)}`);
					}
				}
			}
		} else {
			startTimeError = '';
		}

		return valid;
	}

	/**
	 * Handle form submission (T021)
	 */
	function handleSubmit() {
		if (!validate()) return;

		const parsedDuration = parseDuration(duration)!;
		const taskStartTime = type === 'fixed'
			? parseTimeToDate(startTime)
			: undefined;

		try {
			const task = sessionStore.addTask({
				name: name.trim(),
				durationSec: parsedDuration,
				type,
				startTime: taskStartTime
			});

			if (task) {
				onTaskCreated?.(task);
				onClose();
			} else {
				nameError = 'No active session';
			}
		} catch (error) {
			// Handle unexpected errors
			nameError = error instanceof Error ? error.message : 'Failed to create task';
		}
	}

	/**
	 * Handle keyboard events (T038)
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		} else if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
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
		aria-labelledby="add-task-title"
		onclick={handleBackdropClick}
	>
		<div class="dialog-content" onkeydown={handleKeydown}>
			<h2 id="add-task-title" class="dialog-title">Add Task</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Task Name -->
				<div class="form-group">
					<label for="add-task-name" class="form-label">Task Name</label>
					<input
						bind:this={nameInputRef}
						id="add-task-name"
						type="text"
						class="form-input"
						class:error={nameError}
						bind:value={name}
						placeholder="Enter task name"
						required
						maxlength="200"
					/>
					{#if nameError}
						<span class="error-message">{nameError}</span>
					{/if}
				</div>

				<!-- Duration -->
				<div class="form-group">
					<label for="add-task-duration" class="form-label">Duration</label>
					<input
						id="add-task-duration"
						type="text"
						class="form-input"
						class:error={durationError}
						bind:value={duration}
						placeholder="e.g., 30m, 1h 30m"
						required
					/>
					{#if durationError}
						<span class="error-message">{durationError}</span>
					{/if}
				</div>

				<!-- Type (T030: conditional start time) -->
				<div class="form-group">
					<label class="form-label">Type</label>
					<div class="type-buttons">
						<button
							type="button"
							class="type-button"
							class:selected={type === 'flexible'}
							onclick={() => { type = 'flexible'; startTime = ''; }}
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

				<!-- Start Time (conditional on fixed type) -->
				{#if type === 'fixed'}
					<div class="form-group">
						<label for="add-task-start-time" class="form-label">Start Time</label>
						<input
							id="add-task-start-time"
							type="time"
							class="form-input"
							class:error={startTimeError}
							bind:value={startTime}
							required
						/>
						{#if startTimeError}
							<span class="error-message">{startTimeError}</span>
						{/if}
					</div>
				{/if}

				<!-- Warnings (non-blocking) -->
				{#if warnings.length > 0}
					<div class="warnings">
						{#each warnings as warning, idx (idx)}
							<p class="warning-message">{warning}</p>
						{/each}
					</div>
				{/if}

				<!-- Actions -->
				<div class="dialog-actions">
					<button type="button" class="btn btn-secondary" onclick={onClose}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Add Task
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	@import "tailwindcss";

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

	.warnings {
		@apply mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md;
	}

	.warning-message {
		@apply text-sm text-amber-700 flex items-center gap-2;
	}

	.warning-message::before {
		content: "⚠️";
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
