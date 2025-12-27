<script lang="ts">
	/**
	 * ImpactPanel Component
	 *
	 * Feature: 003-impact-panel
	 * Tasks: T020-T026, T033-T034, T048-T052, T071-T072 (conflict warnings)
	 *
	 * Displays the schedule impact panel showing all tasks with:
	 * - Visual status indicators (completed/current/pending)
	 * - Risk indicators for fixed tasks
	 * - Real-time projection updates
	 * - Drag-and-drop reordering support
	 * - Conflict and overflow warnings (T071-T072)
	 */

	import type { ConfirmedTask, TaskProgress } from '$lib/types';
	import { createProjectedTasks } from '$lib/services/projection';
	import { calculateSchedule } from '$lib/services/scheduleCalculator';
	import { findChronologicalPosition } from '$lib/utils/taskOrder';
	import { scrollToTaskAndHighlight } from '$lib/utils/scroll';
	import ImpactTaskRow from './ImpactTaskRow.svelte';
	import EditTaskDialog from './EditTaskDialog.svelte';
	import ConflictWarning from './ConflictWarning.svelte';
	import ScheduleOverflowWarning from './ScheduleOverflowWarning.svelte';

	interface Props {
		tasks: ConfirmedTask[];
		progress: TaskProgress[];
		currentIndex: number;
		elapsedMs: number;
		/** Whether the session is active (for showing Add Task button) */
		sessionActive?: boolean;
		onReorder?: (fromIndex: number, toIndex: number) => void;
		onUpdateTask?: (taskId: string, updates: Partial<Pick<ConfirmedTask, 'name' | 'plannedStart' | 'plannedDurationSec' | 'type'>>) => void;
		/** Callback when Add Task button is clicked (dialog managed by parent) */
		onAddTask?: () => void;
		/** Callback to update task progress (actual duration) */
		onUpdateProgress?: (taskId: string, updates: { actualDurationSec: number }) => void;
		/** Callback to mark task as incomplete */
		onUncompleteTask?: (taskId: string) => void;
		/** Callback to update timer elapsed time (for current task) */
		onUpdateElapsed?: (elapsedMs: number) => void;
		/** Callback to start a specific task (jump to it) */
		onStartTask?: (taskId: string) => void;
	}

	let { tasks, progress, currentIndex, elapsedMs, sessionActive, onReorder, onUpdateTask, onAddTask, onUpdateProgress, onUncompleteTask, onUpdateElapsed, onStartTask }: Props = $props();

	// Edit dialog state
	let editingTask = $state<ConfirmedTask | null>(null);
	let editingProgress = $state<TaskProgress | null>(null);
	let isEditDialogOpen = $state(false);

	// Track if editing task is the current task
	let editingTaskIsCurrentTask = $state(false);

	// Highlighted task ID for visual feedback after reorder (012-fixed-task-reorder)
	let highlightedTaskId = $state<string | null>(null);

	function handleEditTask(task: ConfirmedTask) {
		// Find corresponding progress record
		editingProgress = progress.find(p => p.taskId === task.taskId) ?? null;
		// Check if this is the current task
		const taskIndex = tasks.findIndex(t => t.taskId === task.taskId);
		editingTaskIsCurrentTask = taskIndex === currentIndex;

		// For flexible pending tasks, use the projected start time instead of planned start
		// This ensures the dialog shows the actual displayed time, not the original import time
		const projectedTask = projectedTasks.find(pt => pt.task.taskId === task.taskId);
		if (projectedTask && task.type === 'flexible' && projectedTask.displayStatus === 'pending') {
			editingTask = {
				...task,
				plannedStart: projectedTask.projectedStart
			};
		} else {
			editingTask = task;
		}

		isEditDialogOpen = true;
	}

	function handleSaveTask(updates: Partial<Pick<ConfirmedTask, 'name' | 'plannedStart' | 'plannedDurationSec' | 'type'>>) {
		if (!editingTask) return;

		const wasFixed = editingTask.type === 'fixed';
		const isNowFixed = updates.type === 'fixed';
		const hasNewStartTime = updates.plannedStart !== undefined;

		// Apply the update through the parent callback
		onUpdateTask?.(editingTask.taskId, updates);

		// Reorder only when becoming fixed (flexible → fixed) - 012-fixed-task-reorder
		if (!wasFixed && isNowFixed && hasNewStartTime && onReorder) {
			const taskId = editingTask.taskId;
			const taskIndex = tasks.findIndex(t => t.taskId === taskId);
			const newPosition = findChronologicalPosition(tasks, taskId, updates.plannedStart!);

			// Only reorder if position actually changes
			if (taskIndex !== -1 && taskIndex !== newPosition) {
				onReorder(taskIndex, newPosition);

				// Trigger scroll and highlight after DOM updates
				setTimeout(() => {
					scrollToTaskAndHighlight(taskId, (id) => highlightedTaskId = id);
				}, 50);
			}
		}
	}

	function handleSaveProgress(updates: { actualDurationSec: number }) {
		if (editingTask && onUpdateProgress) {
			onUpdateProgress(editingTask.taskId, updates);
		}
	}

	function handleUncomplete() {
		if (editingTask && onUncompleteTask) {
			onUncompleteTask(editingTask.taskId);
		}
	}

	function handleUpdateElapsed(elapsedMs: number) {
		onUpdateElapsed?.(elapsedMs);
	}

	function handleStartTask(task: ConfirmedTask) {
		onStartTask?.(task.taskId);
	}

	/**
	 * Handle type toggle from badge click (012-fixed-task-reorder)
	 *
	 * When toggling flexible → fixed, use the projected start time (displayed time)
	 * instead of the original planned start time.
	 */
	function handleToggleType(task: ConfirmedTask) {
		if (!onUpdateTask) return;

		const wasFixed = task.type === 'fixed';
		const newType = wasFixed ? 'flexible' : 'fixed';

		// When becoming fixed, use the projected (displayed) start time
		if (!wasFixed) {
			const projectedTask = projectedTasks.find(pt => pt.task.taskId === task.taskId);
			const projectedStart = projectedTask?.projectedStart ?? task.plannedStart;

			onUpdateTask(task.taskId, {
				type: newType,
				plannedStart: projectedStart
			});

			// Reorder if needed
			if (onReorder) {
				const taskIndex = tasks.findIndex(t => t.taskId === task.taskId);
				const newPosition = findChronologicalPosition(tasks, task.taskId, projectedStart);

				if (taskIndex !== -1 && taskIndex !== newPosition) {
					onReorder(taskIndex, newPosition);

					setTimeout(() => {
						scrollToTaskAndHighlight(task.taskId, (id) => highlightedTaskId = id);
					}, 50);
				}
			}
		} else {
			// Fixed → Flexible: just change type, keep position
			onUpdateTask(task.taskId, { type: newType });
		}
	}

	function handleCloseDialog() {
		isEditDialogOpen = false;
		editingTask = null;
		editingProgress = null;
		editingTaskIsCurrentTask = false;
	}

	// Drag state
	let draggedIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);

	// Derived state for projected tasks (T022: using $derived.by)
	const projectedTasks = $derived.by(() => {
		return createProjectedTasks(tasks, progress, currentIndex, elapsedMs);
	});

	// Sort projected tasks chronologically by DISPLAYED time for display
	// This ensures the impact panel shows tasks in the order matching their displayed times
	const sortedProjectedTasks = $derived.by(() => {
		// Helper to get the displayed time (same logic as ImpactTaskRow)
		const getDisplayTime = (pt: typeof projectedTasks[0]) => {
			const isFixed = pt.task.type === 'fixed';
			const isBehindSchedule = pt.displayStatus === 'pending' &&
				!isFixed &&
				pt.projectedStart.getTime() > pt.task.plannedStart.getTime();

			// Behind schedule shows projected time, otherwise scheduled time
			return isBehindSchedule ? pt.projectedStart : pt.task.plannedStart;
		};

		return [...projectedTasks].sort((a, b) =>
			getDisplayTime(a).getTime() - getDisplayTime(b).getTime()
		);
	});

	// Schedule calculation for conflict detection only (T071)
	// Note: Overflow detection now uses projectedTasks which correctly accounts for progress
	const scheduleResult = $derived.by(() => {
		if (tasks.length === 0) return null;
		// Use 'now' mode for runtime calculations
		return calculateSchedule(tasks, { mode: 'now', customStartTime: null });
	});

	// Task names map for conflict warnings (T071)
	const taskNamesMap = $derived.by((): Map<string, string> => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map is recreated on each recalculation, not mutated
		const map = new Map<string, string>();
		for (const task of tasks) {
			map.set(task.taskId, task.name);
		}
		return map;
	});

	// Get schedule end time from projectedTasks (not scheduleResult)
	// This correctly accounts for completed tasks and current progress
	const scheduleEndTime = $derived.by((): Date | null => {
		if (projectedTasks.length === 0) return null;

		// Find the latest projected end time among current and pending tasks
		let latestEnd: Date | null = null;
		for (const pt of projectedTasks) {
			// Skip completed tasks - they don't affect future schedule
			if (pt.displayStatus === 'completed') continue;

			if (!latestEnd || pt.projectedEnd.getTime() > latestEnd.getTime()) {
				latestEnd = pt.projectedEnd;
			}
		}
		return latestEnd;
	});

	// Check if schedule extends past midnight (T072)
	const hasOverflow = $derived.by((): boolean => {
		if (!scheduleEndTime) return false;

		// Get today's midnight
		const now = new Date();
		const nextMidnight = new Date(now);
		nextMidnight.setHours(24, 0, 0, 0);

		return scheduleEndTime.getTime() >= nextMidnight.getTime();
	});

	// Summary counts
	const completedCount = $derived(
		projectedTasks.filter((t) => t.displayStatus === 'completed').length
	);
	const _pendingCount = $derived(
		projectedTasks.filter((t) => t.displayStatus === 'pending').length
	);

	// Risk summary for fixed tasks
	const riskSummary = $derived.by(() => {
		const fixedPending = projectedTasks.filter(
			(t) => t.task.type === 'fixed' && t.displayStatus === 'pending'
		);
		return {
			green: fixedPending.filter((t) => t.riskLevel === 'green').length,
			yellow: fixedPending.filter((t) => t.riskLevel === 'yellow').length,
			red: fixedPending.filter((t) => t.riskLevel === 'red').length
		};
	});

	// Check if reordering is possible (used for future edge case display)
	const _canReorder = $derived(
		projectedTasks.some((t) => t.isDraggable) && onReorder !== undefined
	);

	// Drag handlers
	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragEnd() {
		draggedIndex = null;
		dropTargetIndex = null;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		// Only allow dropping on valid targets (after current task)
		if (index <= currentIndex) return;

		dropTargetIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDragLeave() {
		dropTargetIndex = null;
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) {
			handleDragEnd();
			return;
		}

		// Call reorder handler
		onReorder?.(draggedIndex, index);
		handleDragEnd();
	}
</script>

<div class="impact-panel" data-testid="impact-panel">
	<!-- Panel header with task count (T026) -->
	<div class="panel-header">
		<h3 class="panel-title">Schedule Impact</h3>
		<div class="header-right">
			<!-- T023, T025: Add Task button (only during active session) -->
			{#if sessionActive && onAddTask}
				<button
					class="add-task-btn"
					onclick={onAddTask}
					data-testid="add-task-button"
				>
					+ Add Task
				</button>
			{/if}
			<div class="task-counts">
				<span class="count-item" data-testid="completed-count">
					<span class="count-value">{completedCount}</span>
					<span class="count-label">done</span>
				</span>
				<span class="count-separator">/</span>
				<span class="count-item" data-testid="total-count">
					<span class="count-value">{tasks.length}</span>
					<span class="count-label">total</span>
				</span>
			</div>
		</div>
	</div>

	<!-- Risk summary for fixed tasks -->
	{#if riskSummary.green + riskSummary.yellow + riskSummary.red > 0}
		<div class="risk-summary" data-testid="risk-summary">
			{#if riskSummary.green > 0}
				<span class="risk-count green" title="On schedule">
					<span class="risk-dot"></span>
					{riskSummary.green}
				</span>
			{/if}
			{#if riskSummary.yellow > 0}
				<span class="risk-count yellow" title="At risk">
					<span class="risk-dot"></span>
					{riskSummary.yellow}
				</span>
			{/if}
			{#if riskSummary.red > 0}
				<span class="risk-count red" title="Will be late">
					<span class="risk-dot"></span>
					{riskSummary.red}
				</span>
			{/if}
		</div>
	{/if}

	<!-- Schedule warnings (T071-T072) -->
	{#if hasOverflow && scheduleEndTime}
		<ScheduleOverflowWarning {scheduleEndTime} />
	{/if}

	{#if scheduleResult?.conflicts && scheduleResult.conflicts.length > 0}
		<div class="warnings-list">
			{#each scheduleResult.conflicts as conflict (conflict.taskId1 + conflict.taskId2)}
				<ConflictWarning {conflict} taskNames={taskNamesMap} />
			{/each}
		</div>
	{/if}

	<!-- Task list (T023: render list of ImpactTaskRow) -->
	<div class="task-list" role="list" data-testid="task-list">
		{#each sortedProjectedTasks as projectedTask, index (projectedTask.task.taskId)}
			<div
				class="task-item"
				role="listitem"
				class:drop-target={dropTargetIndex === index}
				class:dragging={draggedIndex === index}
				ondragover={(e) => handleDragOver(e, index)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, index)}
			>
				<ImpactTaskRow
					{projectedTask}
					{index}
					highlighted={highlightedTaskId === projectedTask.task.taskId}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					onEdit={handleEditTask}
					onToggleType={handleToggleType}
					onStartTask={onStartTask ? handleStartTask : undefined}
				/>
			</div>
		{/each}
		<!-- Drop zone for moving tasks to end of list -->
		{#if draggedIndex !== null && draggedIndex < sortedProjectedTasks.length - 1}
			<div
				class="end-drop-zone"
				role="listitem"
				class:drop-target={dropTargetIndex === sortedProjectedTasks.length}
				ondragover={(e) => handleDragOver(e, sortedProjectedTasks.length)}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, sortedProjectedTasks.length)}
			>
				<span class="drop-hint">Drop here to move to end</span>
			</div>
		{/if}
	</div>

	<!-- Empty state -->
	{#if tasks.length === 0}
		<div class="empty-state" data-testid="empty-state">
			<p>No tasks in schedule</p>
		</div>
	{/if}

	<!-- All complete state -->
	{#if completedCount === tasks.length && tasks.length > 0}
		<div class="complete-state" data-testid="complete-state">
			<p>All tasks completed!</p>
		</div>
	{/if}
</div>

<!-- Edit Task Dialog -->
{#if editingTask}
	<EditTaskDialog
		task={editingTask}
		progress={editingProgress ?? undefined}
		currentElapsedMs={editingTaskIsCurrentTask ? elapsedMs : undefined}
		isCurrentTask={editingTaskIsCurrentTask}
		open={isEditDialogOpen}
		onSave={handleSaveTask}
		onSaveProgress={handleSaveProgress}
		onUpdateElapsed={handleUpdateElapsed}
		onUncomplete={handleUncomplete}
		onClose={handleCloseDialog}
	/>
{/if}

<style>
	@reference "tailwindcss";

	.impact-panel {
		@apply bg-white rounded-lg border border-gray-200 p-4;
		@apply flex flex-col gap-4;
	}

	/* Header */
	.panel-header {
		@apply flex items-center justify-between;
	}

	.panel-title {
		@apply text-lg font-semibold text-gray-900;
	}

	.header-right {
		@apply flex items-center gap-3;
	}

	.add-task-btn {
		@apply px-3 py-1.5 text-sm font-medium;
		@apply bg-blue-600 text-white rounded-md;
		@apply hover:bg-blue-700 transition-colors duration-150;
	}

	.task-counts {
		@apply flex items-center gap-1 text-sm text-gray-500;
	}

	.count-item {
		@apply flex items-center gap-1;
	}

	.count-value {
		@apply font-medium text-gray-700;
	}

	.count-label {
		@apply text-gray-400;
	}

	.count-separator {
		@apply text-gray-300;
	}

	/* Risk summary */
	.risk-summary {
		@apply flex items-center gap-3 text-sm;
	}

	.risk-count {
		@apply flex items-center gap-1 font-medium;
	}

	.risk-count .risk-dot {
		@apply w-2 h-2 rounded-full;
	}

	.risk-count.green {
		@apply text-green-700;
	}

	.risk-count.green .risk-dot {
		@apply bg-green-500;
	}

	.risk-count.yellow {
		@apply text-yellow-700;
	}

	.risk-count.yellow .risk-dot {
		@apply bg-yellow-500;
	}

	.risk-count.red {
		@apply text-red-700;
	}

	.risk-count.red .risk-dot {
		@apply bg-red-500;
	}

	/* Warnings list (T071-T072) */
	.warnings-list {
		@apply flex flex-col gap-2;
	}

	/* Task list */
	.task-list {
		@apply flex flex-col gap-1;
		@apply max-h-[400px] overflow-y-auto;
	}

	.task-item {
		@apply transition-all duration-150;
	}

	.task-item.drop-target {
		@apply border-t-2 border-blue-400;
	}

	.task-item.dragging {
		@apply opacity-50;
	}

	/* End drop zone */
	.end-drop-zone {
		@apply py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg;
		@apply text-center text-sm text-gray-400;
		@apply transition-all duration-150;
	}

	.end-drop-zone.drop-target {
		@apply border-blue-400 bg-blue-50 text-blue-600;
	}

	.drop-hint {
		@apply pointer-events-none;
	}

	/* Empty/complete states */
	.empty-state,
	.complete-state {
		@apply text-center py-8 text-gray-500;
	}

	.complete-state {
		@apply text-green-600 font-medium;
	}
</style>
