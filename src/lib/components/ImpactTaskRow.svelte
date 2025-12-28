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

	// Elapsed time display (for tasks that have been started before)
	const elapsedDisplay = $derived(
		projectedTask.elapsedSec > 0 ? formatDuration(projectedTask.elapsedSec) : null
	);

	// Interruption indicator for pending flexible tasks
	const showInterruptionMarker = $derived(
		projectedTask.displayStatus === 'pending' && projectedTask.willBeInterrupted
	);
	const interruptionTooltip = $derived(
		projectedTask.interruptingTask
			? `Will be interrupted by "${projectedTask.interruptingTask.name}" at ${formatTime(projectedTask.interruptingTask.startTime, '12h')}`
			: ''
	);

	// For FLEXIBLE pending tasks only, show projected time if different from scheduled
	// Fixed tasks ALWAYS show their scheduled time - the risk indicator shows if we'll be late
	// Check if we're behind schedule (projected is later than scheduled)
	const isBehindSchedule = $derived(
		projectedTask.displayStatus === 'pending' &&
		!isFixed && // Only flexible tasks show projected time
		projectedTask.projectedStart.getTime() > projectedTask.task.plannedStart.getTime()
	);

	// Display time logic:
	// - COMPLETED tasks: show actual start time (projectedStart now contains actual start)
	// - CURRENT tasks: show actual start time (projectedStart now contains actual start)
	// - PENDING fixed tasks: always show scheduled time
	// - PENDING flexible tasks: show projected if behind schedule, otherwise scheduled
	const displayTime = $derived.by(() => {
		// Completed and current tasks always show their actual start time
		if (projectedTask.displayStatus === 'completed' || projectedTask.displayStatus === 'current') {
			return projectedTime;
		}
		// Pending flexible tasks behind schedule show projected time
		if (isBehindSchedule) {
			return projectedTime;
		}
		// Everything else shows scheduled time
		return scheduledTime;
	});

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
	<!-- Row 1: Controls and metadata -->
	<div class="row-top">
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
		</div>

		<!-- Duration display with elapsed time -->
		<div class="task-duration" data-testid="task-duration">
			<span class="duration-value">{duration}</span>
			{#if elapsedDisplay}
				<span class="elapsed-indicator" title="{elapsedDisplay} already completed">
					({elapsedDisplay} done)
				</span>
			{/if}
		</div>

		<!-- Type badge with fixed indicator (T051, T015: responsive - icon only on mobile) -->
		<div class="task-type">
			{#if isFixed}
				<button
					type="button"
					class="type-badge-with-icon type-fixed"
					data-testid="type-badge"
					onclick={handleToggleType}
					disabled={!canToggleType}
					title={canToggleType ? 'Click to toggle type' : 'Fixed time task'}
				>
					<FixedTaskIndicator size="sm" tooltip="Fixed time appointment" />
					<span class="type-label">fixed</span>
				</button>
			{:else}
				<button
					type="button"
					class="type-badge {projectedTask.task.type}"
					data-testid="type-badge"
					onclick={handleToggleType}
					disabled={!canToggleType}
					title={canToggleType ? 'Click to toggle type' : 'Flexible task'}
				>
					<!-- Mobile indicator dot (visible only when text is hidden) -->
					<span class="type-indicator-dot"></span>
					<span class="type-label">{projectedTask.task.type}</span>
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

	<!-- Row 2: Task name -->
	<div class="row-bottom">
		<div class="task-name" data-testid="task-name">
			{projectedTask.task.name}
			{#if showInterruptionMarker}
				<span
					class="interruption-marker"
					title={interruptionTooltip}
					data-testid="interruption-marker"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
						<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
					</svg>
				</span>
			{/if}
		</div>
	</div>
</div>

<style>
	@reference "tailwindcss";

	/* Mobile-first responsive layout (013-mobile-responsive) */
	.impact-task-row {
		@apply flex flex-col gap-1;
		@apply px-2 py-2 sm:px-3 sm:py-3; /* Reduced padding on mobile */
		@apply rounded-lg;
		@apply transition-all duration-150;
		@apply border border-transparent;
		@apply border-b border-gray-200;
		@apply min-h-11; /* 44px minimum touch target height */
	}

	.row-top {
		@apply flex items-center;
		@apply gap-2 sm:gap-3; /* Reduced gap on mobile */
		@apply flex-wrap; /* Allow wrapping on very narrow screens */
	}

	.row-bottom {
		@apply pl-6 sm:pl-8; /* Reduced indent on mobile */
	}

	/* Status styling */
	.impact-task-row.completed {
		@apply bg-gray-100 text-gray-400 text-sm;
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
		@apply bg-white hover:bg-gray-50 text-sm;
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

	/* Risk indicator - bolder on mobile (T016: 013-mobile-responsive) */
	.risk-indicator {
		@apply flex-shrink-0 w-4 sm:w-4 flex items-center justify-center;
	}

	.risk-indicator-placeholder {
		@apply w-4 flex-shrink-0;
	}

	/* Larger risk dot on mobile for better visibility (T016) */
	.risk-dot {
		@apply w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-full;
		@apply shadow-sm; /* Subtle shadow for more definition */
	}

	.risk-indicator.green .risk-dot {
		@apply bg-green-500;
		@apply ring-1 ring-green-600/20; /* Subtle ring for definition */
	}

	.risk-indicator.yellow .risk-dot {
		@apply bg-yellow-500;
		@apply ring-1 ring-yellow-600/30; /* Bolder ring for warning */
	}

	.risk-indicator.red .risk-dot {
		@apply bg-red-500 animate-pulse;
		@apply ring-2 ring-red-600/40; /* Most prominent ring for danger */
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

	.impact-task-row.completed .task-time {
		@apply text-gray-400;
	}

	/* Duration display */
	.task-duration {
		@apply text-sm font-mono text-gray-500 min-w-[60px];
		@apply flex flex-col gap-0.5;
	}

	.duration-value {
		@apply text-gray-500;
	}

	.elapsed-indicator {
		@apply text-xs text-green-600 font-medium;
	}

	.impact-task-row.completed .task-duration {
		@apply text-gray-400;
	}

	.impact-task-row.completed .elapsed-indicator {
		@apply text-gray-400;
	}

	/* Task name - mobile responsive (013-mobile-responsive) */
	.task-name {
		@apply text-gray-900;
		@apply flex items-center gap-2;
		@apply truncate; /* Truncate long names on mobile */
		@apply text-sm sm:text-base; /* Smaller text on mobile */
	}

	/* Interruption marker */
	.interruption-marker {
		@apply text-amber-500 cursor-help flex-shrink-0;
		@apply inline-flex items-center;
	}

	.interruption-marker svg {
		@apply w-4 h-4;
	}

	/* Type badge - responsive (T015: 013-mobile-responsive) */
	.task-type {
		@apply flex-shrink-0;
	}

	/* Hide type label text on mobile, show icon/color only (T015) */
	.type-label {
		@apply hidden sm:inline; /* Hide text on mobile */
	}

	.type-badge {
		@apply inline-flex items-center justify-center;
		@apply px-1.5 py-0.5 sm:px-2 text-xs font-medium rounded-full;
		@apply cursor-pointer transition-colors duration-150;
		@apply border-none;
		@apply min-w-[24px] sm:min-w-0; /* Minimum width for icon-only mode */
	}

	.type-badge:not(:disabled):hover {
		@apply opacity-80;
	}

	/* Active state feedback (T024) */
	.type-badge:not(:disabled):active {
		@apply scale-95;
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

	/* Mobile indicator dot - visible only when text is hidden (T015) */
	.type-indicator-dot {
		@apply w-2 h-2 rounded-full bg-current;
		@apply sm:hidden; /* Hide on larger screens where text is visible */
	}

	/* Fixed badge with icon (T051, T015: responsive) */
	.type-badge-with-icon {
		@apply inline-flex items-center justify-center;
		@apply gap-0.5 sm:gap-1;
		@apply px-1.5 py-0.5 sm:px-2 text-xs font-medium rounded-full;
		@apply cursor-pointer transition-colors duration-150;
		@apply border-none;
		@apply min-w-[24px] sm:min-w-0; /* Minimum width for icon-only mode */
	}

	.type-badge-with-icon:not(:disabled):hover {
		@apply opacity-80;
	}

	/* Active state feedback (T024) */
	.type-badge-with-icon:not(:disabled):active {
		@apply scale-95;
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

	/* Start button - 44px touch target (T022: 013-mobile-responsive) */
	.start-btn {
		@apply px-3 py-2 sm:px-2 sm:py-1 text-xs font-medium rounded;
		@apply bg-green-100 text-green-700;
		@apply hover:bg-green-200;
		@apply opacity-0 transition-all duration-150;
		@apply flex-shrink-0;
		@apply min-h-11 sm:min-h-0; /* 44px touch target on mobile */
		@apply min-w-[60px] sm:min-w-0; /* Wider touch target on mobile */
		/* Active state feedback (T024) */
		@apply active:scale-95 active:bg-green-300;
	}

	.impact-task-row:hover .start-btn {
		@apply opacity-100;
	}

	/* Always show on touch devices / when focused */
	.start-btn:focus {
		@apply opacity-100 ring-2 ring-green-500;
	}

	/* Show button immediately on touch for better mobile UX (T021) */
	@media (hover: none) {
		.start-btn {
			@apply opacity-100; /* Always visible on touch devices */
		}
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
