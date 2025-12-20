<script lang="ts">
	/**
	 * AnalyticsDashboard Component
	 *
	 * Feature: 006-analytics-dashboard
	 * Tasks: T036-T043
	 *
	 * Main container for analytics display.
	 * Computes analytics from session and interruption stores.
	 */

	import { sessionStore } from '$lib/stores/sessionStore.svelte';
	import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
	import { calculateAnalyticsSummary, calculateTaskPerformance } from '$lib/services/analytics';
	import DaySummaryCard from './DaySummaryCard.svelte';
	import ConcentrationScore from './ConcentrationScore.svelte';
	import TaskPerformanceList from './TaskPerformanceList.svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	// Access session data directly for reactivity (like ImpactPanel does)
	const taskProgress = $derived(sessionStore.session?.taskProgress ?? []);
	const tasks = $derived(sessionStore.tasks);
	const sessionStatus = $derived(sessionStore.session?.status ?? 'idle');

	// Reactive analytics calculations from stores
	const analyticsSummary = $derived(
		calculateAnalyticsSummary(taskProgress, interruptionStore.interruptions)
	);

	const taskPerformance = $derived(
		calculateTaskPerformance(
			tasks,
			taskProgress,
			interruptionStore.interruptions
		)
	);

	// Check if there's any session data to display
	const hasSessionData = $derived(
		sessionStatus !== 'idle' && taskProgress.length > 0
	);
</script>

<div class="analytics-dashboard" data-testid="analytics-dashboard">
	<!-- Header with title and close button -->
	<div class="dashboard-header">
		<h2 class="dashboard-title">Analytics</h2>
		<button
			type="button"
			class="close-button"
			onclick={onClose}
			aria-label="Close analytics"
			data-testid="close-button"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="close-icon"
			>
				<path
					d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
				/>
			</svg>
		</button>
	</div>

	<!-- Content area -->
	<div class="dashboard-content">
		{#if hasSessionData}
			<div class="analytics-grid">
				<!-- Day Summary Card -->
				<DaySummaryCard summary={analyticsSummary} />

				<!-- Concentration Score -->
				<ConcentrationScore
					score={analyticsSummary.concentrationScore}
					rating={analyticsSummary.concentrationRating}
				/>

				<!-- Task Performance List -->
				<div class="task-performance-section">
					<TaskPerformanceList {taskPerformance} />
				</div>
			</div>
		{:else}
			<!-- Empty state when no session data -->
			<div class="empty-state" data-testid="empty-state">
				<div class="empty-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
						/>
					</svg>
				</div>
				<h3 class="empty-title">No analytics data yet</h3>
				<p class="empty-description">
					Start your day and complete some tasks to see your productivity metrics.
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	@reference "tailwindcss";

	.analytics-dashboard {
		@apply flex flex-col h-full bg-gray-50;
	}

	.dashboard-header {
		@apply flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200;
	}

	.dashboard-title {
		@apply text-xl font-semibold text-gray-900;
	}

	.close-button {
		@apply p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors;
	}

	.close-icon {
		@apply w-5 h-5;
	}

	.dashboard-content {
		@apply flex-1 overflow-y-auto p-4;
	}

	.analytics-grid {
		@apply flex flex-col gap-4;
	}

	.task-performance-section {
		@apply mt-2;
	}

	/* Empty State */
	.empty-state {
		@apply flex flex-col items-center justify-center py-12 text-center;
	}

	.empty-icon {
		@apply w-16 h-16 text-gray-300 mb-4;
	}

	.empty-icon svg {
		@apply w-full h-full;
	}

	.empty-title {
		@apply text-lg font-medium text-gray-900 mb-2;
	}

	.empty-description {
		@apply text-sm text-gray-500 max-w-xs;
	}
</style>
