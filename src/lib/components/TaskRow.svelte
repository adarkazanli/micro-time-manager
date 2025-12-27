<script lang="ts">
	import type { DraftTask, TaskType } from '$lib/types';
	import { formatDuration, parseDuration } from '$lib/utils/duration';
	import { formatTime, parseTime } from '$lib/utils/time';
	import FixedTaskIndicator from './FixedTaskIndicator.svelte';
	import InterruptionBadge from './InterruptionBadge.svelte';

	/**
	 * Interruption info for pre-session planning display (T059-T060)
	 */
	interface InterruptionInfo {
		isInterrupted: boolean;
		pauseTime: Date | null;
		durationBeforePauseSec: number;
		remainingDurationSec: number;
		resumeTime?: Date;
	}

	interface Props {
		task: DraftTask;
		readonly?: boolean;
		draggable?: boolean;
		/** Optional interruption info from schedule calculator (US3) */
		interruption?: InterruptionInfo;
		onUpdate?: (id: string, changes: Partial<DraftTask>) => void;
		onDragStart?: (e: DragEvent) => void;
		onDragEnd?: (e: DragEvent) => void;
	}

	let {
		task,
		readonly = true,
		draggable = false,
		interruption,
		onUpdate,
		onDragStart,
		onDragEnd
	}: Props = $props();

	// Check if this task will be interrupted (US3)
	const isInterrupted = $derived(interruption?.isInterrupted ?? false);

	// Editing state
	let editingField = $state<'name' | 'duration' | 'time' | null>(null);
	let editValue = $state('');

	// Format display values
	const displayTime = $derived(formatTime(task.startTime, '12h'));
	const displayDuration = $derived(formatDuration(task.durationSeconds));
	const endTime = $derived(
		formatTime(
			new Date(task.startTime.getTime() + task.durationSeconds * 1000),
			'12h'
		)
	);

	function startEditing(field: 'name' | 'duration' | 'time') {
		if (readonly) return;
		editingField = field;
		switch (field) {
			case 'name':
				editValue = task.name;
				break;
			case 'duration':
				editValue = displayDuration;
				break;
			case 'time':
				editValue = formatTime(task.startTime, '24h');
				break;
		}
	}

	function cancelEditing() {
		editingField = null;
		editValue = '';
	}

	function saveEdit() {
		if (!editingField || !onUpdate) {
			cancelEditing();
			return;
		}

		switch (editingField) {
			case 'name': {
				const trimmed = editValue.trim();
				if (trimmed && trimmed !== task.name) {
					onUpdate(task.id, { name: trimmed });
				}
				break;
			}
			case 'duration': {
				const seconds = parseDuration(editValue);
				if (seconds !== null && seconds > 0 && seconds !== task.durationSeconds) {
					onUpdate(task.id, { durationSeconds: seconds });
				}
				break;
			}
			case 'time': {
				const newTime = parseTime(editValue);
				if (newTime && newTime.getTime() !== task.startTime.getTime()) {
					onUpdate(task.id, { startTime: newTime });
				}
				break;
			}
		}

		cancelEditing();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveEdit();
		} else if (e.key === 'Escape') {
			cancelEditing();
		}
	}

	function toggleType() {
		if (readonly || !onUpdate) return;
		const newType: TaskType = task.type === 'fixed' ? 'flexible' : 'fixed';
		onUpdate(task.id, { type: newType });
	}

	function handleDragStart(e: DragEvent) {
		if (task.type === 'fixed') {
			e.preventDefault();
			return;
		}
		onDragStart?.(e);
	}
</script>

<div
	class="task-row"
	class:has-warning={task.hasWarning}
	class:is-fixed={task.type === 'fixed'}
	class:is-flexible={task.type === 'flexible'}
	class:is-editing={editingField !== null}
	data-testid="task-row"
	draggable={draggable && task.type === 'flexible'}
	ondragstart={handleDragStart}
	ondragend={onDragEnd}
>
	{#if draggable && task.type === 'flexible'}
		<div class="drag-handle" aria-label="Drag to reorder">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="w-4 h-4"
			>
				<path
					fill-rule="evenodd"
					d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	{/if}

	<div class="task-time">
		{#if editingField === 'time'}
			<input
				type="text"
				class="edit-input time-input"
				bind:value={editValue}
				onblur={saveEdit}
				onkeydown={handleKeyDown}
				autofocus
			/>
		{:else}
			<button
				type="button"
				class="editable-field"
				onclick={() => startEditing('time')}
				disabled={readonly}
			>
				<span class="time-start">{displayTime}</span>
				<span class="time-separator">-</span>
				<span class="time-end">{endTime}</span>
			</button>
		{/if}
	</div>

	<div class="task-name">
		{#if editingField === 'name'}
			<input
				type="text"
				class="edit-input name-input"
				data-testid="task-name-input"
				bind:value={editValue}
				onblur={saveEdit}
				onkeydown={handleKeyDown}
				autofocus
			/>
		{:else}
			<button
				type="button"
				class="editable-field name-field"
				onclick={() => startEditing('name')}
				disabled={readonly}
			>
				{task.name}
			</button>
		{/if}
	</div>

	<div class="task-duration">
		{#if editingField === 'duration'}
			<input
				type="text"
				class="edit-input duration-input"
				bind:value={editValue}
				onblur={saveEdit}
				onkeydown={handleKeyDown}
				autofocus
			/>
		{:else}
			<button
				type="button"
				class="editable-field"
				onclick={() => startEditing('duration')}
				disabled={readonly}
			>
				{displayDuration}
			</button>
		{/if}
	</div>

	<!-- Interruption badge for tasks that will be paused (T059-T060) -->
	{#if isInterrupted && interruption}
		<div class="task-interruption" data-testid="task-interruption">
			<InterruptionBadge
				beforePauseSec={interruption.durationBeforePauseSec}
				remainingSec={interruption.remainingDurationSec}
				resumeTime={interruption.resumeTime}
			/>
		</div>
	{/if}

	<!-- Type badge with fixed indicator (T052) -->
	<div class="task-type">
		{#if task.type === 'fixed'}
			<button
				type="button"
				class="type-badge-with-icon fixed"
				data-testid="type-badge-{task.type}"
				onclick={toggleType}
				disabled={readonly}
				title={readonly ? '' : 'Click to toggle type'}
			>
				<FixedTaskIndicator size="sm" />
				<span>fixed</span>
			</button>
		{:else}
			<button
				type="button"
				class="type-badge {task.type}"
				data-testid="type-badge-{task.type}"
				onclick={toggleType}
				disabled={readonly}
				title={readonly ? '' : 'Click to toggle type'}
			>
				{task.type}
			</button>
		{/if}
	</div>

	{#if task.hasWarning}
		<div class="task-warning" title="Time conflict detected">
			<svg
				class="warning-icon"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.task-row {
		@apply flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg;
		@apply transition-all duration-150;
	}

	.task-row:hover {
		@apply border-gray-300 shadow-sm;
	}

	.task-row.has-warning {
		@apply border-amber-300 bg-amber-50;
	}

	.task-row.is-editing {
		@apply border-blue-300 ring-2 ring-blue-100;
	}

	.task-row[draggable='true'] {
		@apply cursor-grab;
	}

	.task-row[draggable='true']:active {
		@apply cursor-grabbing;
	}

	.drag-handle {
		@apply text-gray-400 hover:text-gray-600 cursor-grab;
	}

	.task-time {
		@apply flex items-center gap-1 text-sm text-gray-600 font-mono min-w-[140px];
	}

	.time-separator {
		@apply text-gray-400;
	}

	.task-name {
		@apply flex-1 font-medium text-gray-900;
	}

	.task-duration {
		@apply text-sm text-gray-600 min-w-[60px] text-right;
	}

	.task-type {
		@apply min-w-[80px];
	}

	.type-badge {
		@apply inline-block px-2 py-1 text-xs font-medium rounded-full cursor-pointer;
		@apply transition-colors duration-150;
	}

	.type-badge:not(:disabled):hover {
		@apply opacity-80;
	}

	.type-badge:disabled {
		@apply cursor-default;
	}

	.type-badge.fixed {
		@apply bg-blue-100 text-blue-800;
	}

	.type-badge.flexible {
		@apply bg-green-100 text-green-800;
	}

	/* Fixed badge with icon (T052) */
	.type-badge-with-icon {
		@apply inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full cursor-pointer;
		@apply transition-colors duration-150;
	}

	.type-badge-with-icon:not(:disabled):hover {
		@apply opacity-80;
	}

	.type-badge-with-icon:disabled {
		@apply cursor-default;
	}

	.type-badge-with-icon.fixed {
		@apply bg-blue-100 text-blue-800;
	}

	.task-warning {
		@apply flex-shrink-0;
	}

	.warning-icon {
		@apply w-5 h-5 text-amber-500;
	}

	.editable-field {
		@apply bg-transparent border-none text-inherit cursor-pointer;
		font: inherit;
		@apply hover:bg-gray-100 rounded px-1 -mx-1 transition-colors;
	}

	.editable-field:disabled {
		@apply cursor-default hover:bg-transparent;
	}

	.name-field {
		@apply truncate block w-full text-left;
	}

	.edit-input {
		@apply border border-blue-300 rounded px-2 py-1 text-sm;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500;
	}

	.name-input {
		@apply w-full;
	}

	.time-input {
		@apply w-20 font-mono;
	}

	.duration-input {
		@apply w-16 text-right;
	}

	/* Interruption badge container (T059-T060) */
	.task-interruption {
		@apply flex-shrink-0;
	}
</style>
