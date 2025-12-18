<script lang="ts">
	/**
	 * DaySummary Component
	 *
	 * Feature: 002-day-tracking
	 * Task: T027 - Create DaySummary.svelte component
	 *
	 * Displays end-of-day statistics when session is complete.
	 */

	import type { DaySummary } from '$lib/types';

	interface Props {
		summary: DaySummary;
		onDismiss?: () => void;
	}

	let { summary, onDismiss }: Props = $props();

	// Derived calculations
	const totalPlannedMin = $derived(Math.round(summary.totalPlannedSec / 60));
	const totalActualMin = $derived(Math.round(summary.totalActualSec / 60));
	const sessionDurationMin = $derived(Math.round(summary.sessionDurationSec / 60));

	const lagDirection = $derived(
		summary.finalLagSec < 0 ? 'ahead' : summary.finalLagSec > 0 ? 'behind' : 'on-time'
	);

	const lagMinutes = $derived(Math.abs(Math.round(summary.finalLagSec / 60)));

	const totalTasks = $derived(summary.tasksOnTime + summary.tasksLate + summary.tasksMissed);

	const completionRate = $derived(
		totalTasks > 0
			? Math.round(((summary.tasksOnTime + summary.tasksLate) / totalTasks) * 100)
			: 0
	);

	// On-time rate for future use (e.g., analytics)
	const _onTimeRate = $derived(
		totalTasks > 0 ? Math.round((summary.tasksOnTime / totalTasks) * 100) : 0
	);
</script>

<div class="day-summary" data-testid="day-summary">
	<div class="summary-header">
		<div class="success-icon">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
		<h2 class="summary-title">Day Complete!</h2>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<span class="stat-label">Session Duration</span>
			<span class="stat-value" data-testid="session-duration">
				{formatDuration(sessionDurationMin)}
			</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Planned vs Actual</span>
			<span class="stat-value" data-testid="planned-actual">
				{formatDuration(totalPlannedMin)} / {formatDuration(totalActualMin)}
			</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Final Status</span>
			<span
				class="stat-value lag-status"
				class:ahead={lagDirection === 'ahead'}
				class:behind={lagDirection === 'behind'}
				class:on-time={lagDirection === 'on-time'}
				data-testid="final-lag"
			>
				{#if lagDirection === 'on-time'}
					On schedule
				{:else}
					{lagMinutes} min {lagDirection}
				{/if}
			</span>
		</div>

		<div class="stat-card">
			<span class="stat-label">Completion Rate</span>
			<span class="stat-value" data-testid="completion-rate">{completionRate}%</span>
		</div>
	</div>

	<div class="task-breakdown">
		<h3 class="breakdown-title">Task Breakdown</h3>
		<div class="breakdown-items">
			<div class="breakdown-item on-time">
				<span class="item-count" data-testid="tasks-on-time">{summary.tasksOnTime}</span>
				<span class="item-label">On time</span>
			</div>
			<div class="breakdown-item late">
				<span class="item-count" data-testid="tasks-late">{summary.tasksLate}</span>
				<span class="item-label">Late</span>
			</div>
			<div class="breakdown-item missed">
				<span class="item-count" data-testid="tasks-missed">{summary.tasksMissed}</span>
				<span class="item-label">Missed</span>
			</div>
		</div>
	</div>

	{#if onDismiss}
		<div class="summary-actions">
			<button type="button" class="btn btn-primary" onclick={onDismiss} data-testid="dismiss-btn">
				Start New Day
			</button>
		</div>
	{/if}
</div>

<script module lang="ts">
	/**
	 * Format minutes as human-readable duration
	 */
	function formatDuration(minutes: number): string {
		if (minutes >= 60) {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
		}
		return `${minutes}m`;
	}
</script>

<style>
	@reference "tailwindcss";

	.day-summary {
		@apply flex flex-col items-center gap-6 py-6;
	}

	.summary-header {
		@apply flex flex-col items-center gap-2;
	}

	.success-icon {
		@apply w-16 h-16 rounded-full bg-green-100 flex items-center justify-center;
	}

	.success-icon svg {
		@apply w-10 h-10 text-green-600;
	}

	.summary-title {
		@apply text-2xl font-semibold text-gray-900;
	}

	.stats-grid {
		@apply grid grid-cols-2 gap-4 w-full max-w-md;
	}

	.stat-card {
		@apply flex flex-col items-center gap-1 p-4 bg-gray-50 rounded-lg;
	}

	.stat-label {
		@apply text-xs text-gray-500 uppercase tracking-wide;
	}

	.stat-value {
		@apply text-lg font-semibold text-gray-900;
	}

	.lag-status.ahead {
		@apply text-green-600;
	}

	.lag-status.behind {
		@apply text-red-600;
	}

	.lag-status.on-time {
		@apply text-gray-600;
	}

	.task-breakdown {
		@apply w-full max-w-md;
	}

	.breakdown-title {
		@apply text-sm font-medium text-gray-700 mb-3 text-center;
	}

	.breakdown-items {
		@apply flex justify-center gap-6;
	}

	.breakdown-item {
		@apply flex flex-col items-center gap-1;
	}

	.item-count {
		@apply text-2xl font-bold;
	}

	.item-label {
		@apply text-xs text-gray-500;
	}

	.breakdown-item.on-time .item-count {
		@apply text-green-600;
	}

	.breakdown-item.late .item-count {
		@apply text-yellow-600;
	}

	.breakdown-item.missed .item-count {
		@apply text-red-600;
	}

	.summary-actions {
		@apply mt-4;
	}

	.btn {
		@apply inline-flex items-center justify-center;
		@apply px-6 py-3 rounded-lg font-medium;
		@apply transition-all duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.btn-primary {
		@apply bg-blue-600 text-white;
		@apply hover:bg-blue-700;
		@apply focus:ring-blue-500;
	}
</style>
