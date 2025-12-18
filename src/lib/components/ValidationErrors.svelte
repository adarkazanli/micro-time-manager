<script lang="ts">
	import type { ValidationError } from '$lib/types';

	interface Props {
		errors: ValidationError[];
		onRetry?: () => void;
	}

	let { errors, onRetry }: Props = $props();

	// Group errors by type for better organization
	const groupedErrors = $derived(() => {
		const fileErrors = errors.filter((e) => e.row === 0);
		const rowErrors = errors.filter((e) => e.row > 0);
		return { fileErrors, rowErrors };
	});
</script>

<div class="validation-errors" data-testid="validation-errors">
	<header class="error-header">
		<svg
			class="error-icon"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
				clip-rule="evenodd"
			/>
		</svg>
		<h2 class="error-title">Import Failed</h2>
	</header>

	<p class="error-count">
		Found {errors.length} error{errors.length === 1 ? '' : 's'} in your file
	</p>

	<ul class="error-list" role="list" aria-label="Validation errors">
		{#each errors as error (error.row + '-' + error.column + '-' + error.message)}
			<li class="error-item">
				{#if error.row > 0}
					<span class="error-location">Row {error.row}, {error.column}:</span>
				{:else}
					<span class="error-location">{error.column}:</span>
				{/if}
				<span class="error-message">{error.message}</span>
				{#if error.value}
					<code class="error-value">"{error.value}"</code>
				{/if}
			</li>
		{/each}
	</ul>

	{#if onRetry}
		<div class="error-actions">
			<button type="button" class="btn btn-primary" onclick={onRetry}>
				Try Again
			</button>
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.validation-errors {
		@apply flex flex-col gap-4;
	}

	.error-header {
		@apply flex items-center gap-2;
	}

	.error-icon {
		@apply w-6 h-6 text-red-500 flex-shrink-0;
	}

	.error-title {
		@apply text-xl font-semibold text-gray-900;
	}

	.error-count {
		@apply text-gray-600;
	}

	.error-list {
		@apply bg-red-50 border border-red-200 rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto;
	}

	.error-item {
		@apply text-sm text-red-800 flex flex-wrap items-baseline gap-1;
	}

	.error-location {
		@apply font-medium text-red-900;
	}

	.error-message {
		@apply text-red-700;
	}

	.error-value {
		@apply ml-1 px-1 py-0.5 bg-red-100 rounded text-xs font-mono text-red-600;
	}

	.error-actions {
		@apply flex justify-start;
	}

	.btn {
		@apply px-4 py-2 rounded-lg font-medium transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.btn-primary {
		@apply bg-blue-600 text-white;
		@apply hover:bg-blue-700;
		@apply focus:ring-blue-500;
	}
</style>
