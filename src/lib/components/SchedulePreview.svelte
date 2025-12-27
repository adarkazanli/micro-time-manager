<script lang="ts">
	import type { DraftTask, ConfirmedTask, ScheduleConfig, ScheduleResult } from '$lib/types';
	import { calculateSchedule } from '$lib/services/scheduleCalculator';
	import TaskRow from './TaskRow.svelte';
	import ScheduleStartPicker from './ScheduleStartPicker.svelte';
	import ConflictWarning from './ConflictWarning.svelte';
	import ScheduleOverflowWarning from './ScheduleOverflowWarning.svelte';

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

	// Schedule configuration state (T038)
	let scheduleConfig = $state<ScheduleConfig>({ mode: 'now', customStartTime: null });

	/**
	 * Handle schedule config changes from picker (T038)
	 */
	function handleScheduleConfigChange(config: ScheduleConfig) {
		scheduleConfig = config;
	}

	/**
	 * Convert DraftTask to ConfirmedTask for schedule calculation
	 */
	function toConfirmedTask(draft: DraftTask): ConfirmedTask {
		return {
			taskId: draft.id,
			name: draft.name,
			plannedStart: draft.startTime,
			plannedDurationSec: draft.durationSeconds,
			type: draft.type,
			sortOrder: draft.sortOrder,
			status: 'pending'
		};
	}

	// Calculate schedule using $derived (T039)
	const scheduleResult = $derived.by((): ScheduleResult | null => {
		if (tasks.length === 0) return null;
		const confirmedTasks = tasks.map(toConfirmedTask);
		return calculateSchedule(confirmedTasks, scheduleConfig);
	});

	// Create a map of task ID to calculated start time for display (T040)
	const calculatedStartTimes = $derived.by((): Map<string, Date> => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map is recreated on each recalculation, not mutated
		const map = new Map<string, Date>();
		if (scheduleResult) {
			for (const st of scheduleResult.scheduledTasks) {
				map.set(st.task.taskId, st.calculatedStart);
			}
		}
		return map;
	});

	/**
	 * Interruption info for display (T059-T060)
	 */
	interface InterruptionInfo {
		isInterrupted: boolean;
		pauseTime: Date | null;
		durationBeforePauseSec: number;
		remainingDurationSec: number;
		resumeTime?: Date;
	}

	// Create a map of task ID to interruption info for display (T059-T060)
	const interruptionInfoMap = $derived.by((): Map<string, InterruptionInfo> => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map is recreated on each recalculation, not mutated
		const map = new Map<string, InterruptionInfo>();
		if (scheduleResult) {
			for (const st of scheduleResult.scheduledTasks) {
				if (st.isInterrupted) {
					// Resume time = end time - remaining duration (when the remaining work starts)
					const resumeTime = new Date(
						st.calculatedEnd.getTime() - st.remainingDurationSec * 1000
					);
					map.set(st.task.taskId, {
						isInterrupted: st.isInterrupted,
						pauseTime: st.pauseTime,
						durationBeforePauseSec: st.durationBeforePauseSec,
						remainingDurationSec: st.remainingDurationSec,
						resumeTime
					});
				}
			}
		}
		return map;
	});

	// Create a task names map for conflict warnings (T069)
	const taskNamesMap = $derived.by((): Map<string, string> => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map is recreated on each recalculation, not mutated
		const map = new Map<string, string>();
		for (const task of tasks) {
			map.set(task.id, task.name);
		}
		return map;
	});

	// Get schedule end time for overflow warning (T070)
	const scheduleEndTime = $derived.by((): Date | null => {
		if (!scheduleResult || scheduleResult.scheduledTasks.length === 0) return null;
		// Get the latest end time from all scheduled tasks
		let latestEnd = scheduleResult.scheduledTasks[0].calculatedEnd;
		for (const st of scheduleResult.scheduledTasks) {
			if (st.calculatedEnd.getTime() > latestEnd.getTime()) {
				latestEnd = st.calculatedEnd;
			}
		}
		return latestEnd;
	});

	// Drag state
	let draggedIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	// Sort tasks by sortOrder for display, with calculated start times (T040)
	const sortedTasks = $derived.by(() => {
		const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
		// Apply calculated start times if available
		return sorted.map((task) => {
			const calculatedTime = calculatedStartTimes.get(task.id);
			if (calculatedTime) {
				// Override startTime with calculated time for display
				return { ...task, startTime: calculatedTime };
			}
			return task;
		});
	});

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

		// If dropping at end of list, always allow
		if (index === sortedTasks.length) {
			dropTargetIndex = index;
			return;
		}

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

		// If dropping at end of list, allow it
		if (targetIndex === sortedTasks.length) {
			onReorder?.(draggedIndex, targetIndex);
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

	<!-- Schedule Start Picker (T038) -->
	{#if !readonly}
		<div class="schedule-config-section">
			<ScheduleStartPicker
				mode={scheduleConfig.mode}
				customTime={scheduleConfig.customStartTime}
				disabled={false}
				onChange={handleScheduleConfigChange}
			/>
		</div>
	{/if}

	<!-- Schedule warnings using dedicated components (T069-T070) -->
	{#if scheduleResult?.hasOverflow && scheduleEndTime}
		<ScheduleOverflowWarning scheduleEndTime={scheduleEndTime} />
	{/if}

	{#if scheduleResult?.conflicts && scheduleResult.conflicts.length > 0}
		<div class="warnings-list">
			{#each scheduleResult.conflicts as conflict (conflict.taskId1 + conflict.taskId2)}
				<ConflictWarning {conflict} taskNames={taskNamesMap} />
			{/each}
		</div>
	{/if}

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
					interruption={interruptionInfoMap.get(task.id)}
					onUpdate={onTaskUpdate}
					onDragStart={() => handleDragStart(index)}
					onDragEnd={handleDragEnd}
				/>
			</div>
		{/each}
		<!-- Drop zone for moving tasks to end of list -->
		{#if !readonly && draggedIndex !== null && draggedIndex < sortedTasks.length - 1}
			<div
				class="end-drop-zone"
				class:is-drop-target={dropTargetIndex === sortedTasks.length}
				ondragover={(e) => handleDragOver(e, sortedTasks.length)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, sortedTasks.length)}
			>
				<span class="drop-hint">Drop here to move to end</span>
			</div>
		{/if}
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

	/* Schedule config section (T038) */
	.schedule-config-section {
		@apply mb-4;
	}

	/* Schedule warnings container (T069-T070) */
	.warnings-list {
		@apply flex flex-col gap-2;
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

	/* End drop zone */
	.end-drop-zone {
		@apply py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg;
		@apply text-center text-sm text-gray-400;
		@apply transition-all duration-150;
	}

	.end-drop-zone.is-drop-target {
		@apply border-blue-400 bg-blue-50 text-blue-600;
	}

	.drop-hint {
		@apply pointer-events-none;
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
