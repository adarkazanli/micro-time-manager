<script lang="ts">
	/**
	 * DaySummaryCard Component
	 *
	 * Feature: 006-analytics-dashboard
	 * Tasks: T013-T018, T032-T035
	 *
	 * Displays day-level analytics summary metrics:
	 * - Total planned time
	 * - Total actual time
	 * - Tasks completed count
	 * - Schedule adherence percentage
	 * - Interruption summary (added in Phase 6)
	 */

	import type { AnalyticsSummary } from '$lib/types';

	interface Props {
		summary: AnalyticsSummary;
	}

	let { summary }: Props = $props();

	// Format seconds to human-readable duration
	function formatDuration(seconds: number): string {
		const minutes = Math.round(seconds / 60);
		if (minutes >= 60) {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		return `${minutes}m`;
	}

	// Derived values for display
	const plannedDisplay = $derived(formatDuration(summary.totalPlannedSec));
	const actualDisplay = $derived(formatDuration(summary.totalActualSec));
	const tasksDisplay = $derived(`${summary.tasksCompleted} of ${summary.totalTasks}`);

	// Schedule adherence with appropriate styling
	const adherenceValue = $derived(summary.scheduleAdherence);
	const adherenceDisplay = $derived(
		adherenceValue > 0 ? `${adherenceValue.toFixed(1)}%` : '—'
	);
	const adherenceStatus = $derived(
		adherenceValue >= 100 ? 'good' : adherenceValue >= 80 ? 'fair' : 'poor'
	);

	// Interruption summary
	const interruptionCount = $derived(summary.totalInterruptionCount);
	const interruptionTimeDisplay = $derived(formatDuration(summary.totalInterruptionSec));
	const hasInterruptions = $derived(interruptionCount > 0);
</script>

<div class="day-summary-card" data-testid="day-summary-card">
	<h3 class="card-title">Day Summary</h3>

	<div class="metrics-grid">
		<!-- Total Planned Time -->
		<div class="metric-item" data-testid="metric-planned">
			<span class="metric-label">Planned Time</span>
			<span class="metric-value">{plannedDisplay}</span>
		</div>

		<!-- Total Actual Time -->
		<div class="metric-item" data-testid="metric-actual">
			<span class="metric-label">Actual Time</span>
			<span class="metric-value">{actualDisplay}</span>
		</div>

		<!-- Tasks Completed -->
		<div class="metric-item" data-testid="metric-tasks">
			<span class="metric-label">Tasks Completed</span>
			<span class="metric-value">{tasksDisplay}</span>
		</div>

		<!-- Schedule Adherence -->
		<div class="metric-item" data-testid="metric-adherence">
			<span class="metric-label">Schedule Adherence</span>
			<span
				class="metric-value adherence-value"
				class:good={adherenceStatus === 'good'}
				class:fair={adherenceStatus === 'fair'}
				class:poor={adherenceStatus === 'poor'}
			>
				{adherenceDisplay}
			</span>
		</div>
	</div>

	<!-- Interruption Summary Section -->
	<div class="interruption-summary" data-testid="interruption-summary">
		<h4 class="section-title">Interruptions</h4>
		{#if hasInterruptions}
			<div class="interruption-metrics">
				<div class="interruption-metric" data-testid="interruption-count">
					<span class="interruption-value">{interruptionCount}</span>
					<span class="interruption-label">interruption{interruptionCount !== 1 ? 's' : ''}</span>
				</div>
				<div class="interruption-divider"></div>
				<div class="interruption-metric" data-testid="interruption-time">
					<span class="interruption-value">{interruptionTimeDisplay}</span>
					<span class="interruption-label">total time</span>
				</div>
			</div>
		{:else}
			<div class="no-interruptions" data-testid="no-interruptions">
				<span class="success-icon">✓</span>
				<span class="success-text">No interruptions - great focus!</span>
			</div>
		{/if}
	</div>
</div>

<style>
	@reference "tailwindcss";

	.day-summary-card {
		@apply bg-white rounded-lg border border-gray-200 p-4;
	}

	.card-title {
		@apply text-lg font-semibold text-gray-900 mb-4;
	}

	.metrics-grid {
		@apply grid grid-cols-2 gap-4;
	}

	.metric-item {
		@apply flex flex-col gap-1;
	}

	.metric-label {
		@apply text-xs text-gray-500 uppercase tracking-wide;
	}

	.metric-value {
		@apply text-xl font-semibold text-gray-900;
	}

	.adherence-value.good {
		@apply text-green-600;
	}

	.adherence-value.fair {
		@apply text-yellow-600;
	}

	.adherence-value.poor {
		@apply text-red-600;
	}

	/* Interruption Summary Section */
	.interruption-summary {
		@apply mt-4 pt-4 border-t border-gray-200;
	}

	.section-title {
		@apply text-sm font-medium text-gray-700 mb-2;
	}

	.interruption-metrics {
		@apply flex items-center justify-center gap-4;
	}

	.interruption-metric {
		@apply flex flex-col items-center;
	}

	.interruption-value {
		@apply text-lg font-semibold text-gray-900;
	}

	.interruption-label {
		@apply text-xs text-gray-500;
	}

	.interruption-divider {
		@apply w-px h-8 bg-gray-200;
	}

	.no-interruptions {
		@apply flex items-center justify-center gap-2 py-2;
	}

	.success-icon {
		@apply text-green-600 font-bold;
	}

	.success-text {
		@apply text-sm text-green-700;
	}
</style>
