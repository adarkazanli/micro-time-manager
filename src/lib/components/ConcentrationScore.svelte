<script lang="ts">
	/**
	 * ConcentrationScore Component
	 *
	 * Feature: 006-analytics-dashboard
	 * Tasks: T019-T023
	 *
	 * Displays concentration score with rating label and color coding:
	 * - Excellent (≥90%): green
	 * - Good (80-89%): blue
	 * - Fair (70-79%): yellow
	 * - Needs improvement (<70%): red
	 */

	import type { ConcentrationRating } from '$lib/types';

	interface Props {
		score: number;
		rating: ConcentrationRating;
	}

	let { score, rating }: Props = $props();

	// Display score or dash if no data
	const scoreDisplay = $derived(score > 0 ? `${score.toFixed(1)}%` : '—');

	// Get rating-specific CSS class
	const ratingClass = $derived(
		rating === 'Excellent'
			? 'excellent'
			: rating === 'Good'
				? 'good'
				: rating === 'Fair'
					? 'fair'
					: 'needs-improvement'
	);
</script>

<div class="concentration-score" data-testid="concentration-score">
	<h3 class="card-title">Concentration Score</h3>

	<div class="score-display">
		<span
			class="score-value"
			class:excellent={ratingClass === 'excellent'}
			class:good={ratingClass === 'good'}
			class:fair={ratingClass === 'fair'}
			class:needs-improvement={ratingClass === 'needs-improvement'}
			data-testid="score-value"
		>
			{scoreDisplay}
		</span>

		<span
			class="rating-badge"
			class:excellent={ratingClass === 'excellent'}
			class:good={ratingClass === 'good'}
			class:fair={ratingClass === 'fair'}
			class:needs-improvement={ratingClass === 'needs-improvement'}
			data-testid="rating-badge"
		>
			{rating}
		</span>
	</div>

	<p class="formula-explanation" data-testid="formula-explanation">
		Calculated as (Work Time − Interruption Time) / Work Time × 100
	</p>
</div>

<style>
	@reference "tailwindcss";

	.concentration-score {
		@apply bg-white rounded-lg border border-gray-200 p-4;
	}

	.card-title {
		@apply text-lg font-semibold text-gray-900 mb-4;
	}

	.score-display {
		@apply flex flex-col items-center gap-2 mb-3;
	}

	.score-value {
		@apply text-4xl font-bold;
	}

	.score-value.excellent {
		@apply text-green-600;
	}

	.score-value.good {
		@apply text-blue-600;
	}

	.score-value.fair {
		@apply text-yellow-600;
	}

	.score-value.needs-improvement {
		@apply text-red-600;
	}

	.rating-badge {
		@apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium;
	}

	.rating-badge.excellent {
		@apply bg-green-100 text-green-800;
	}

	.rating-badge.good {
		@apply bg-blue-100 text-blue-800;
	}

	.rating-badge.fair {
		@apply bg-yellow-100 text-yellow-800;
	}

	.rating-badge.needs-improvement {
		@apply bg-red-100 text-red-800;
	}

	.formula-explanation {
		@apply text-xs text-gray-500 text-center;
	}
</style>
