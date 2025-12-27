<script lang="ts">
	/**
	 * ImpactTaskRow Component
	 *
	 * Feature: 003-impact-panel
	 * Tasks: T014-T019, T029-T035, T044-T047
	 *
	 * Displays a single task in the impact panel with:
	 * - Visual status styling (completed/current/pending)
	 * - Risk indicators for fixed tasks (green/yellow/red)
	 * - Scheduled time display
	 * - Drag handle for flexible pending tasks
	 */

	import type { ProjectedTask } from '$lib/types';
	import { formatTime } from '$lib/utils/time';
	import { formatDuration } from '$lib/utils/duration';
	import FixedTaskIndicator from './FixedTaskIndicator.svelte';

	interface Props {
		projectedTask: ProjectedTask;
		onDragStart?: (e: DragEvent, index: number) => void;
		onDragEnd?: (e: DragEvent) => void;
		onEdit?: (task: ProjectedTask['task']) => void;
		onStartTask?: (task: ProjectedTask['task']) => void;
		/** Callback to toggle task type (012-fixed-task-reorder) */
		onToggleType?: (task: ProjectedTask['task']) => void;
		/** Whether this task should be visually highlighted (012-fixed-task-reorder) */
		highlighted?: boolean;
		index: number;
	}

	let { projectedTask, onDragStart, onDragEnd, onEdit, onStartTask, onToggleType, highlighted = false, index }: Props = $props();

	// Can toggle type only for pending tasks (not completed or current)
	const canToggleType = $derived(
		projectedTask.displayStatus === 'pending' && onToggleType !== undefined
	);

	// Can start this task if it's pending (not completed, not current)
	const canStart = $derived(projectedTask.displayStatus === 'pending');

	// Derived display values
	const scheduledTime = $derived(formatTime(projectedTask.task.plannedStart, '12h'));
	const projectedTime = $derived(formatTime(projectedTask.projectedStart, '12h'));
	const duration = $derived(formatDuration(projectedTask.task.plannedDurationSec));
	const isFixed = $derived(projectedTask.task.type === 'fixed');
	const showRiskIndicator = $derived(isFixed && projectedTask.displayStatus === 'pending');

	// For FLEXIBLE pending tasks only, show projected time if different from scheduled
	// Fixed tasks ALWAYS show their scheduled time - the risk indicator shows if we'll be late
	// Check if we're behind schedule (projected is later than scheduled)
	const isBehindSchedule = $derived(
		projectedTask.displayStatus === 'pending' &&
		!isFixed && // Only flexible tasks show projected time
		projectedTask.projectedStart.getTime() > projectedTask.task.plannedStart.getTime()
	);

	// Display time: fixed tasks always show scheduled; flexible tasks show projected if behind
	const displayTime = $derived(
		projectedTask.displayStatus === 'pending' && isBehindSchedule
			? projectedTime
			: scheduledTime
	);

	// Buffer display for tooltip
	const bufferDisplay = $derived(() => {
		if (!isFixed) return '';
		const bufferMin = Math.floor(Math.abs(projectedTask.bufferSec) / 60);
		if (projectedTask.bufferSec >= 0) {
			return `${bufferMin}m buffer`;
		}
		return `${bufferMin}m late`;
	});

	function handleDragStart(e: DragEvent) {
		if (!projectedTask.isDraggable) {
			e.preventDefault();
			return;
		}
		onDragStart?.(e, index);
	}

	function handleDoubleClick() {
		onEdit?.(projectedTask.task);
	}

	function handleStartClick(e: MouseEvent) {
		e.stopPropagation(); // Prevent triggering row click/drag
		onStartTask?.(projectedTask.task);
	}

	function handleToggleType(e: MouseEvent) {
		e.stopPropagation(); // Prevent triggering row click/drag
		onToggleType?.(projectedTask.task);
	}
</script>

<div
	class="impact-task-row"
	class:completed={projectedTask.displayStatus === 'completed'}
	class:current={projectedTask.displayStatus === 'current'}
	class:pending={projectedTask.displayStatus === 'pending'}
	class:is-fixed={isFixed}
	class:is-draggable={projectedTask.isDraggable}
	class:highlighted={highlighted}
	data-testid="impact-task-row"
	data-task-id={projectedTask.task.taskId}
	data-status={projectedTask.displayStatus}
	draggable={projectedTask.isDraggable}
	ondragstart={handleDragStart}
	ondragend={onDragEnd}
	ondblclick={handleDoubleClick}
	role="listitem"
>
	<!-- Drag handle for draggable tasks -->
	{#if projectedTask.isDraggable}
		<div class="drag-handle" aria-label="Drag to reorder" data-testid="drag-handle">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
				<path
					fill-rule="evenodd"
					d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	{:else}
		<div class="drag-handle-placeholder"></div>
	{/if}

	<!-- Risk indicator for fixed tasks -->
	{#if showRiskIndicator && projectedTask.riskLevel}
		<div
			class="risk-indicator {projectedTask.riskLevel}"
			data-testid="risk-indicator"
			data-risk={projectedTask.riskLevel}
			title={bufferDisplay()}
		>
			<span class="risk-dot"></span>
		</div>
	{:else}
		<div class="risk-indicator-placeholder"></div>
	{/if}

	<!-- Time display (FR-015: show scheduled start times) -->
	<div class="task-time" data-testid="task-time">
		<span class="scheduled-time" class:delayed={isBehindSchedule}>{displayTime}</span>
		{#if isBehindSchedule}
			<span class="original-time" title="Originally scheduled for {scheduledTime}">
				was {scheduledTime}
			</span>
		{/if}
	</div>

	<!-- Duration display -->
	<div class="task-duration" data-testid="task-duration">
		<span class="duration-value">{duration}</span>
	</div>

	<!-- Task name -->
	<div class="task-name" data-testid="task-name">
		{projectedTask.task.name}
	</div>

	<!-- Type badge with fixed indicator (T051) -->
	<div class="task-type">
		{#if isFixed}
			<button
				type="button"
				class="type-badge-with-icon type-fixed"
				data-testid="type-badge"
				onclick={handleToggleType}
				disabled={!canToggleType}
				title={canToggleType ? 'Click to toggle type' : ''}
			>
				<FixedTaskIndicator size="sm" tooltip="Fixed time appointment" />
				<span>fixed</span>
			</button>
		{:else}
			<button
				type="button"
				class="type-badge {projectedTask.task.type}"
				data-testid="type-badge"
				onclick={handleToggleType}
				disabled={!canToggleType}
				title={canToggleType ? 'Click to toggle type' : ''}
			>
				{projectedTask.task.type}
			</button>
		{/if}
	</div>

	<!-- Start button for pending tasks -->
	{#if canStart && onStartTask}
		<button
			type="button"
			class="start-btn"
			onclick={handleStartClick}
			data-testid="start-task-btn"
			title="Start this task now"
		>
			Start
		</button>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.impact-task-row {
		@apply flex items-start gap-3 px-3 py-3 rounded-lg;
		@apply transition-all duration-150;
		@apply border border-transparent;
		@apply flex-wrap;
		@apply border-b border-gray-200;
	}

	/* Status styling */
	.impact-task-row.completed {
		@apply bg-gray-100 text-gray-400;
	}

	.impact-task-row.completed .task-name {
		@apply line-through;
	}

	.impact-task-row.current {
		@apply bg-blue-50 border-blue-200;
		@apply ring-2 ring-blue-100;
	}

	.impact-task-row.current .task-name {
		@apply text-blue-900 font-medium;
	}

	.impact-task-row.pending {
		@apply bg-white hover:bg-gray-50;
	}

	/* Draggable styling */
	.impact-task-row.is-draggable {
		@apply cursor-grab;
	}

	.impact-task-row.is-draggable:active {
		@apply cursor-grabbing;
	}

	/* Drag handle */
	.drag-handle {
		@apply text-gray-400 hover:text-gray-600 flex-shrink-0;
		@apply w-4;
	}

	.drag-handle-placeholder {
		@apply w-4 flex-shrink-0;
	}

	/* Risk indicator */
	.risk-indicator {
		@apply flex-shrink-0 w-4 flex items-center justify-center;
	}

	.risk-indicator-placeholder {
		@apply w-4 flex-shrink-0;
	}

	.risk-dot {
		@apply w-3 h-3 rounded-full;
	}

	.risk-indicator.green .risk-dot {
		@apply bg-green-500;
	}

	.risk-indicator.yellow .risk-dot {
		@apply bg-yellow-500;
	}

	.risk-indicator.red .risk-dot {
		@apply bg-red-500 animate-pulse;
	}

	/* Time display */
	.task-time {
		@apply text-sm font-mono text-gray-600 min-w-[100px] flex flex-col;
	}

	.scheduled-time {
		@apply text-gray-600;
	}

	.scheduled-time.delayed {
		@apply text-orange-600 font-medium;
	}

	.original-time {
		@apply text-xs text-gray-400 line-through;
	}

	.impact-task-row.completed .task-time {
		@apply text-gray-400;
	}

	/* Duration display */
	.task-duration {
		@apply text-sm font-mono text-gray-500 min-w-[60px];
	}

	.duration-value {
		@apply text-gray-500;
	}

	.impact-task-row.completed .task-duration {
		@apply text-gray-400;
	}

	/* Task name */
	.task-name {
		@apply flex-1 text-gray-900;
		@apply break-words;
		min-width: 150px;
	}

	/* Type badge */
	.task-type {
		@apply flex-shrink-0;
	}

	.type-badge {
		@apply inline-block px-2 py-0.5 text-xs font-medium rounded-full;
		@apply cursor-pointer transition-colors duration-150;
		@apply border-none bg-transparent;
	}

	.type-badge:not(:disabled):hover {
		@apply opacity-80;
	}

	.type-badge:disabled {
		@apply cursor-default;
	}

	.type-badge.type-fixed {
		@apply bg-blue-100 text-blue-800;
	}

	.type-badge.flexible {
		@apply bg-green-100 text-green-800;
	}

	/* Fixed badge with icon (T051) */
	.type-badge-with-icon {
		@apply inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full;
		@apply cursor-pointer transition-colors duration-150;
		@apply border-none;
	}

	.type-badge-with-icon:not(:disabled):hover {
		@apply opacity-80;
	}

	.type-badge-with-icon:disabled {
		@apply cursor-default;
	}

	.type-badge-with-icon.type-fixed {
		@apply bg-blue-100 text-blue-800;
	}

	.impact-task-row.completed .type-badge,
	.impact-task-row.completed .type-badge-with-icon {
		@apply opacity-50;
	}

	/* Start button - shows on hover */
	.start-btn {
		@apply px-2 py-1 text-xs font-medium rounded;
		@apply bg-green-100 text-green-700;
		@apply hover:bg-green-200;
		@apply opacity-0 transition-opacity duration-150;
		@apply flex-shrink-0;
	}

	.impact-task-row:hover .start-btn {
		@apply opacity-100;
	}

	/* Always show on touch devices / when focused */
	.start-btn:focus {
		@apply opacity-100 ring-2 ring-green-500;
	}

	/* Highlight animation for repositioned tasks (012-fixed-task-reorder) */
	.impact-task-row.highlighted {
		animation: highlight-pulse 1.5s ease-out;
	}

	@keyframes highlight-pulse {
		0% {
			background-color: rgb(253, 230, 138); /* amber-200 */
		}
		100% {
			background-color: white;
		}
	}

	/* Dark mode highlight */
	:global(.dark) .impact-task-row.highlighted {
		animation: highlight-pulse-dark 1.5s ease-out;
	}

	@keyframes highlight-pulse-dark {
		0% {
			background-color: rgb(146, 64, 14); /* amber-800 */
		}
		100% {
			background-color: rgb(31, 41, 55); /* gray-800 */
		}
	}
</style>
