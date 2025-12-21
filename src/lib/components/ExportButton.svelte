<script lang="ts">
	/**
	 * ExportButton Component
	 *
	 * Feature: 007-data-export
	 * Tasks: T022-T026 - Export button with inline format selector
	 * Task: T050 - Download error handling with user feedback
	 *
	 * Shows an Export button that reveals Excel/CSV format options when clicked.
	 * Disabled when session is idle (no data to export).
	 * Shows brief success/error feedback after export attempt.
	 */

	import type { ExportResult } from '$lib/types';

	type FeedbackState = 'idle' | 'success' | 'error';

	interface Props {
		disabled: boolean;
		onExportExcel: () => ExportResult;
		onExportCSV: () => ExportResult;
	}

	let { disabled, onExportExcel, onExportCSV }: Props = $props();

	// T024: State for inline format selector expansion
	let isExpanded = $state(false);

	// T050: Feedback state for user notification
	let feedbackState = $state<FeedbackState>('idle');
	let feedbackMessage = $state('');
	let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;

	// Reference to the component root for click-outside detection
	let containerRef: HTMLDivElement | null = $state(null);

	// T023: Toggle format selector on main button click
	function handleExportClick() {
		if (disabled) return;
		isExpanded = !isExpanded;
	}

	// T050: Show feedback and auto-clear after delay
	function showFeedback(result: ExportResult) {
		// Clear any existing timeout
		if (feedbackTimeout) {
			clearTimeout(feedbackTimeout);
		}

		if (result.success) {
			feedbackState = 'success';
			feedbackMessage = result.filesDownloaded === 1 ? 'Downloaded!' : `${result.filesDownloaded} files downloaded!`;
		} else {
			feedbackState = 'error';
			feedbackMessage = result.error || 'Export failed';
		}

		// Auto-clear feedback after 3 seconds
		feedbackTimeout = setTimeout(() => {
			feedbackState = 'idle';
			feedbackMessage = '';
		}, 3000);
	}

	// T038: Handle Excel format selection
	function handleExcelClick() {
		const result = onExportExcel();
		showFeedback(result);
		isExpanded = false;
	}

	// T044: Handle CSV format selection
	function handleCSVClick() {
		const result = onExportCSV();
		showFeedback(result);
		isExpanded = false;
	}

	// T025: Click-outside handler to collapse selector
	function handleClickOutside(event: MouseEvent) {
		if (!isExpanded) return;
		if (containerRef && !containerRef.contains(event.target as Node)) {
			isExpanded = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="export-container" bind:this={containerRef} data-testid="export-container">
	<button
		type="button"
		class="export-btn"
		class:expanded={isExpanded}
		data-testid="export-btn"
		{disabled}
		aria-disabled={disabled}
		aria-expanded={isExpanded}
		onclick={handleExportClick}
	>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="export-icon">
			<path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
			<path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
		</svg>
		Export
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			class="chevron-icon"
			class:rotated={isExpanded}
		>
			<path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
		</svg>
	</button>

	{#if isExpanded}
		<div class="format-selector" data-testid="format-selector">
			<button
				type="button"
				class="format-btn format-excel"
				data-testid="export-excel-btn"
				onclick={handleExcelClick}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="format-icon">
					<path fill-rule="evenodd" d="M3 3.5A1.5 1.5 0 014.5 2H9a1 1 0 011 1v5a1 1 0 01-1 1H4.5A1.5 1.5 0 013 7.5v-4zm5.5 0H4.5V7.5H8.5V3.5zM12 2a1 1 0 011 1v5a1 1 0 01-1 1H9.5a.5.5 0 010-1H12V3h-1.5a.5.5 0 010-1H12zm-7.5 9A1.5 1.5 0 003 12.5v4A1.5 1.5 0 004.5 18H9a1 1 0 001-1v-5a1 1 0 00-1-1H4.5zm4 1H4.5v4H8.5v-4zM13 12a1 1 0 00-1 1v4a1 1 0 001 1h2.5a1.5 1.5 0 001.5-1.5v-4a1.5 1.5 0 00-1.5-1.5H13zm2.5 1H13v4h2.5v-4z" clip-rule="evenodd" />
				</svg>
				Excel (.xlsx)
			</button>
			<button
				type="button"
				class="format-btn format-csv"
				data-testid="export-csv-btn"
				onclick={handleCSVClick}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="format-icon">
					<path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zM10 3.5v4a1 1 0 001 1h4L10 3.5z" clip-rule="evenodd" />
				</svg>
				CSV (.csv)
			</button>
		</div>
	{/if}

	{#if feedbackState !== 'idle'}
		<div
			class="feedback-toast"
			class:success={feedbackState === 'success'}
			class:error={feedbackState === 'error'}
			data-testid="export-feedback"
			role="status"
			aria-live="polite"
		>
			{#if feedbackState === 'success'}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="feedback-icon">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="feedback-icon">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
				</svg>
			{/if}
			<span class="feedback-text">{feedbackMessage}</span>
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.export-container {
		@apply relative;
	}

	.export-btn {
		@apply flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium;
		@apply transition-all duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
		@apply bg-emerald-100 text-emerald-700 hover:bg-emerald-200;
		@apply focus:ring-emerald-500;
	}

	.export-btn:disabled {
		@apply bg-gray-100 text-gray-400 cursor-not-allowed;
		@apply hover:bg-gray-100;
	}

	.export-btn.expanded {
		@apply bg-emerald-200;
	}

	.export-icon {
		@apply w-4 h-4;
	}

	.chevron-icon {
		@apply w-4 h-4 ml-0.5 transition-transform duration-150;
	}

	.chevron-icon.rotated {
		@apply rotate-180;
	}

	.format-selector {
		@apply absolute top-full left-0 mt-1 z-10;
		@apply flex flex-col gap-1 p-1;
		@apply bg-white rounded-lg shadow-lg border border-gray-200;
		@apply min-w-[140px];
	}

	.format-btn {
		@apply flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-inset;
	}

	.format-excel {
		@apply text-green-700 hover:bg-green-50;
		@apply focus:ring-green-500;
	}

	.format-csv {
		@apply text-blue-700 hover:bg-blue-50;
		@apply focus:ring-blue-500;
	}

	.format-icon {
		@apply w-4 h-4;
	}

	/* T050: Feedback toast styles */
	.feedback-toast {
		@apply absolute top-full left-0 mt-1 z-20;
		@apply flex items-center gap-2 px-3 py-2 rounded-lg;
		@apply text-sm font-medium whitespace-nowrap;
		@apply shadow-lg;
		animation: feedback-fade-in 0.2s ease-out;
	}

	@keyframes feedback-fade-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.feedback-toast.success {
		@apply bg-green-100 text-green-800 border border-green-200;
	}

	.feedback-toast.error {
		@apply bg-red-100 text-red-800 border border-red-200;
	}

	.feedback-icon {
		@apply w-4 h-4 flex-shrink-0;
	}

	.feedback-text {
		@apply truncate max-w-[200px];
	}
</style>
