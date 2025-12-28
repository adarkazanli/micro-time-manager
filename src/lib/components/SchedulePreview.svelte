<script lang="ts">
	import type { DraftTask, ConfirmedTask, ScheduleConfig, ScheduleResult } from '$lib/types';
	import { calculateSchedule } from '$lib/services/scheduleCalculator';
	import { exportPreviewToTemplate } from '$lib/services/export';
	import { reorderTaskChronologically } from '$lib/utils/taskOrder';
	import { scrollToTaskAndHighlight } from '$lib/utils/scroll';
	import TaskRow from './TaskRow.svelte';
	import ScheduleStartPicker from './ScheduleStartPicker.svelte';
	import ConflictWarning from './ConflictWarning.svelte';
	import ScheduleOverflowWarning from './ScheduleOverflowWarning.svelte';

	interface Props {
		tasks: DraftTask[];
		readonly?: boolean;
		onTaskUpdate?: (id: string, changes: Partial<DraftTask>) => void;
		onTaskDelete?: (id: string) => void;
		onReorder?: (fromIndex: number, toIndex: number) => void;
		/** Callback to replace the entire tasks array (used for chronological reordering) */
		onTasksReorder?: (tasks: DraftTask[]) => void;
		onConfirm?: () => void;
		onCancel?: () => void;
	}

	let {
		tasks,
		readonly = true,
		onTaskUpdate,
		onTaskDelete,
		onReorder,
		onTasksReorder,
		onConfirm,
		onCancel
	}: Props = $props();

	// Highlighted task ID for visual feedback after reorder (012-fixed-task-reorder)
	let highlightedTaskId = $state<string | null>(null);

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

	// Create a Set of task IDs that have conflicts (based on calculated schedule)
	const conflictingTaskIds = $derived.by((): Set<string> => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Set is recreated on each recalculation
		const set = new Set<string>();
		if (scheduleResult?.conflicts) {
			for (const conflict of scheduleResult.conflicts) {
				set.add(conflict.taskId1);
				set.add(conflict.taskId2);
			}
		}
		return set;
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

	// Sort tasks chronologically by calculated start time for display
	// This ensures the schedule preview shows tasks in the order they'll actually occur
	const sortedTasks = $derived.by(() => {
		// Apply calculated start times and update warnings based on actual conflicts
		const withCalculatedTimes = tasks.map((task) => {
			const calculatedTime = calculatedStartTimes.get(task.id);
			// Use conflict data from schedule calculator instead of stale hasWarning
			const hasConflict = conflictingTaskIds.has(task.id);
			return {
				...task,
				startTime: calculatedTime ?? task.startTime,
				hasWarning: hasConflict
			};
		});
		// Sort chronologically by start time for display
		return withCalculatedTimes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
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

		const draggedTask = sortedTasks[draggedIndex];

		// If dropping at end of list, move to last sortOrder position
		if (targetIndex === sortedTasks.length) {
			// Find the highest sortOrder and place after it
			const maxSortOrder = Math.max(...tasks.map((t) => t.sortOrder));
			onReorder?.(draggedTask.sortOrder, maxSortOrder + 1);
			handleDragEnd();
			return;
		}

		// Only reorder if target is flexible
		const targetTask = sortedTasks[targetIndex];
		if (targetTask.type === 'fixed') {
			handleDragEnd();
			return;
		}

		// Pass sortOrder values to reorder (these match the store's task array indices)
		onReorder?.(draggedTask.sortOrder, targetTask.sortOrder);
		handleDragEnd();
	}

	/**
	 * Export the preview schedule to a template CSV file
	 */
	function handleExportTemplate() {
		const result = exportPreviewToTemplate(sortedTasks);
		if (!result.success) {
			console.error('Export failed:', result.error);
		}
	}

	/**
	 * Handle task update with auto-reorder when type changes to fixed (012-fixed-task-reorder)
	 *
	 * When a task becomes fixed (flexible → fixed), it is automatically reordered
	 * to its chronological position based on start time, then scrolled to and highlighted.
	 *
	 * IMPORTANT: When changing from flexible to fixed without an explicit start time,
	 * we use the calculated/displayed start time (not the original import time).
	 * This ensures the task is fixed at the time the user sees on screen.
	 */
	function handleTaskUpdate(id: string, changes: Partial<DraftTask>) {
		const task = tasks.find(t => t.id === id);
		if (!task) return;

		const wasFixed = task.type === 'fixed';
		const isNowFixed = changes.type === 'fixed';

		// When becoming fixed without explicit start time, use the calculated (displayed) start time
		// This ensures the task is fixed at the time shown on screen, not the original import time
		if (!wasFixed && isNowFixed && changes.startTime === undefined) {
			const calculatedTime = calculatedStartTimes.get(id);
			if (calculatedTime) {
				changes = { ...changes, startTime: calculatedTime };
			}
		}

		const hasNewStartTime = changes.startTime !== undefined;

		// First apply the update through the parent callback
		onTaskUpdate?.(id, changes);

		// Reorder only when becoming fixed (not when staying fixed or becoming flexible)
		if (!wasFixed && isNowFixed && hasNewStartTime && onTasksReorder) {
			// Apply the changes to the task for reordering calculation
			const updatedTasks = tasks.map(t =>
				t.id === id ? { ...t, ...changes } : t
			);
			const reorderedTasks = reorderTaskChronologically(updatedTasks, id, changes.startTime!);
			onTasksReorder(reorderedTasks);

			// Trigger scroll and highlight after DOM updates
			setTimeout(() => {
				scrollToTaskAndHighlight(id, (newId) => highlightedTaskId = newId);
			}, 50);
		}
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
					highlighted={highlightedTaskId === task.id}
					onUpdate={handleTaskUpdate}
					onDelete={onTaskDelete}
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
				class="btn btn-export"
				onclick={handleExportTemplate}
				disabled={tasks.length === 0}
				title="Save schedule as template CSV"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="btn-icon">
					<path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
					<path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
				</svg>
				Export
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

	/* Mobile-first responsive layout (013-mobile-responsive) */
	.schedule-preview {
		@apply flex flex-col;
		@apply gap-2 sm:gap-3 md:gap-4; /* Reduced gap on mobile */
		@apply w-full; /* Full width on all screens */
	}

	.preview-header {
		@apply mb-1 sm:mb-2; /* Reduced margin on mobile */
	}

	/* Schedule config section (T038) */
	.schedule-config-section {
		@apply mb-4;
	}

	/* Schedule warnings container (T069-T070) */
	.warnings-list {
		@apply flex flex-col gap-2;
	}

	/* Responsive typography (013-mobile-responsive) */
	.preview-title {
		@apply text-lg sm:text-xl font-semibold text-gray-900;
	}

	.preview-subtitle {
		@apply text-xs sm:text-sm text-gray-600;
	}

	.edit-hint {
		@apply text-gray-400;
		@apply hidden sm:inline; /* Hide edit hint on mobile - less clutter */
	}

	/* Task list with mobile max-height (013-mobile-responsive) */
	.task-list {
		@apply flex flex-col;
		@apply gap-1.5 sm:gap-2; /* Tighter spacing on mobile */
		@apply max-h-[60vh] sm:max-h-[70vh] md:max-h-none; /* Constrained height on mobile */
		@apply overflow-y-auto;
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

	/* End drop zone - responsive (013-mobile-responsive) */
	.end-drop-zone {
		@apply py-2 px-3 sm:py-3 sm:px-4 border-2 border-dashed border-gray-300 rounded-lg;
		@apply text-center text-xs sm:text-sm text-gray-400;
		@apply transition-all duration-150;
		@apply min-h-11; /* 44px touch target */
	}

	.end-drop-zone.is-drop-target {
		@apply border-blue-400 bg-blue-50 text-blue-600;
	}

	.drop-hint {
		@apply pointer-events-none;
	}

	/* Actions footer - responsive (013-mobile-responsive) */
	.preview-actions {
		@apply flex justify-end;
		@apply gap-2 sm:gap-3; /* Reduced gap on mobile */
		@apply mt-3 pt-3 sm:mt-4 sm:pt-4; /* Reduced margin/padding on mobile */
		@apply border-t border-gray-200;
		@apply flex-wrap; /* Allow wrap on very narrow screens */
	}

	.btn {
		@apply px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
		@apply text-sm sm:text-base; /* Smaller text on mobile */
		@apply min-h-11; /* 44px touch target */
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

	.btn-export {
		@apply flex items-center gap-1.5;
		@apply bg-purple-100 text-purple-700;
		@apply hover:bg-purple-200;
		@apply focus:ring-purple-500;
		@apply disabled:opacity-50 disabled:cursor-not-allowed;
	}

	.btn-icon {
		@apply w-4 h-4;
	}
</style>
