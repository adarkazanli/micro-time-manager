<script lang="ts">
	/**
	 * TaskPerformanceRow Component
	 *
	 * Feature: 006-analytics-dashboard
	 * Tasks: T024-T028
	 *
	 * Displays performance metrics for a single task:
	 * - Task name
	 * - Planned vs actual duration
	 * - Variance with over/under color coding
	 * - Interruption count and time
	 */

	import type { TaskPerformance } from '$lib/types';

	interface Props {
		performance: TaskPerformance;
	}

	let { performance }: Props = $props();

	// Format seconds to human-readable duration
	function formatDuration(seconds: number): string {
		const absSeconds = Math.abs(seconds);
		const minutes = Math.round(absSeconds / 60);
		if (minutes >= 60) {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		return `${minutes}m`;
	}

	// Derived display values
	const plannedDisplay = $derived(formatDuration(performance.plannedDurationSec));
	const actualDisplay = $derived(formatDuration(performance.actualDurationSec));

	// Variance display with sign
	const varianceMinutes = $derived(Math.round(performance.varianceSec / 60));
	const varianceDisplay = $derived(
		performance.status === 'complete'
			? varianceMinutes > 0
				? `+${varianceMinutes}m`
				: varianceMinutes < 0
					? `${varianceMinutes}m`
					: '0m'
			: '—'
	);

	// Variance status for styling
	const varianceStatus = $derived(
		varianceMinutes > 0 ? 'over' : varianceMinutes < 0 ? 'under' : 'on-time'
	);

	// Interruption display
	const interruptionDisplay = $derived(
		performance.interruptionCount > 0
			? `${performance.interruptionCount} (${formatDuration(performance.interruptionSec)})`
			: '—'
	);

	// Status display
	const statusLabel = $derived(
		performance.status === 'complete'
			? 'Complete'
			: performance.status === 'active'
				? 'In Progress'
				: performance.status === 'missed'
					? 'Missed'
					: 'Pending'
	);
</script>

<div class="task-performance-row" data-testid="task-performance-row">
	<div class="task-info">
		<span class="task-name" data-testid="task-name">{performance.taskName}</span>
		<span
			class="task-status"
			class:complete={performance.status === 'complete'}
			class:active={performance.status === 'active'}
			class:missed={performance.status === 'missed'}
			class:pending={performance.status === 'pending'}
			data-testid="task-status"
		>
			{statusLabel}
		</span>
	</div>

	<div class="metrics-row">
		<div class="metric">
			<span class="metric-label">Planned</span>
			<span class="metric-value" data-testid="planned-duration">{plannedDisplay}</span>
		</div>

		<div class="metric">
			<span class="metric-label">Actual</span>
			<span class="metric-value" data-testid="actual-duration">{actualDisplay}</span>
		</div>

		<div class="metric">
			<span class="metric-label">Variance</span>
			<span
				class="metric-value variance-value"
				class:over={varianceStatus === 'over'}
				class:under={varianceStatus === 'under'}
				class:on-time={varianceStatus === 'on-time'}
				data-testid="variance"
			>
				{varianceDisplay}
			</span>
		</div>

		<div class="metric">
			<span class="metric-label">Interruptions</span>
			<span class="metric-value" data-testid="interruptions">{interruptionDisplay}</span>
		</div>
	</div>
</div>

<style>
	@reference "tailwindcss";

	.task-performance-row {
		@apply py-3 border-b border-gray-100 last:border-b-0;
	}

	.task-info {
		@apply flex items-center justify-between mb-2;
	}

	.task-name {
		@apply text-sm font-medium text-gray-900;
	}

	.task-status {
		@apply text-xs px-2 py-0.5 rounded-full;
	}

	.task-status.complete {
		@apply bg-green-100 text-green-700;
	}

	.task-status.active {
		@apply bg-blue-100 text-blue-700;
	}

	.task-status.missed {
		@apply bg-red-100 text-red-700;
	}

	.task-status.pending {
		@apply bg-gray-100 text-gray-600;
	}

	.metrics-row {
		@apply flex gap-4;
	}

	.metric {
		@apply flex flex-col gap-0.5 flex-1;
	}

	.metric-label {
		@apply text-xs text-gray-500;
	}

	.metric-value {
		@apply text-sm font-medium text-gray-900;
	}

	.variance-value.over {
		@apply text-red-600;
	}

	.variance-value.under {
		@apply text-green-600;
	}

	.variance-value.on-time {
		@apply text-gray-600;
	}
</style>
