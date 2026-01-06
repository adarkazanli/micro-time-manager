<script lang="ts">
	/**
	 * LogViewer Component
	 *
	 * Feature: 014-ui-logging-system
	 * Tasks: T013-T015 - Log viewing UI component
	 *
	 * Modal dialog for viewing, exporting, and clearing UI interaction logs.
	 * Displays logs in reverse chronological order (newest first).
	 *
	 * @new 014-ui-logging-system
	 */
	import { logStore } from '$lib/stores/logStore.svelte';
	import { onMount } from 'svelte';

	// Props
	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	// Local state
	let dialogRef: HTMLDivElement | null = $state(null);

	// Load logs on mount
	onMount(() => {
		if (!logStore.isLoaded) {
			logStore.loadFromStorage();
		}
		// Focus dialog for keyboard accessibility
		if (dialogRef) {
			dialogRef.focus();
		}
	});

	// Format timestamp for display (human-readable)
	function formatTimestamp(isoString: string): string {
		const date = new Date(isoString);
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		const ms = date.getMilliseconds().toString().padStart(3, '0');
		return `${hours}:${minutes}:${seconds}.${ms}`;
	}

	// Format elapsed time for display
	function formatElapsed(ms: number | null): string {
		if (ms === null) return '-';
		const totalSec = Math.floor(ms / 1000);
		const min = Math.floor(totalSec / 60);
		const sec = totalSec % 60;
		return `${min}:${sec.toString().padStart(2, '0')}`;
	}

	// Handle export
	function handleExport() {
		const csv = logStore.exportToCsv();
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	// Handle clear
	function handleClear() {
		if (confirm('Clear all logs? This cannot be undone.')) {
			logStore.clearAll();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<div
	class="log-viewer-backdrop"
	onclick={handleBackdropClick}
	role="presentation"
	data-testid="log-viewer-backdrop"
>
	<!-- Dialog -->
	<div
		bind:this={dialogRef}
		class="log-viewer-dialog"
		role="dialog"
		aria-modal="true"
		aria-labelledby="log-viewer-title"
		tabindex="-1"
		data-testid="log-viewer-dialog"
	>
		<!-- Header -->
		<div class="log-viewer-header">
			<h2 id="log-viewer-title" class="log-viewer-title">UI Logs</h2>
			<div class="log-viewer-actions">
				<button
					type="button"
					class="action-btn action-btn-export"
					onclick={handleExport}
					disabled={logStore.entries.length === 0}
					data-testid="log-export-btn"
				>
					Export
				</button>
				<button
					type="button"
					class="action-btn action-btn-clear"
					onclick={handleClear}
					disabled={logStore.entries.length === 0}
					data-testid="log-clear-btn"
				>
					Clear
				</button>
				<button
					type="button"
					class="close-btn"
					onclick={onClose}
					aria-label="Close log viewer"
					data-testid="log-close-btn"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="close-icon">
						<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="log-viewer-content" data-testid="log-entries">
			{#if logStore.entries.length === 0}
				<div class="log-empty" data-testid="log-empty">
					<p class="empty-message">No logs yet.</p>
					<p class="empty-hint">Logs will appear here as you interact with the app.</p>
				</div>
			{:else}
				{#each logStore.entries as entry (entry.id)}
					<div class="log-entry" data-testid="log-entry">
						<div class="entry-header">
							<span class="entry-timestamp">{formatTimestamp(entry.timestamp)}</span>
							<span class="entry-action">{entry.action}</span>
							<span class="entry-status" class:idle={entry.sessionStatus === 'idle'} class:running={entry.sessionStatus === 'running'} class:complete={entry.sessionStatus === 'complete'}>
								{entry.sessionStatus}
							</span>
						</div>
						<div class="entry-details">
							{#if entry.taskName}
								<span class="entry-task">{entry.taskName}</span>
							{/if}
							{#if entry.elapsedMs !== null}
								<span class="entry-elapsed">{formatElapsed(entry.elapsedMs)}</span>
							{/if}
							{#if Object.keys(entry.parameters).length > 0}
								<span class="entry-params">{JSON.stringify(entry.parameters)}</span>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer -->
		<div class="log-viewer-footer">
			<span class="entry-count">{logStore.entries.length} entries</span>
		</div>
	</div>
</div>

<style>
	@import 'tailwindcss';

	.log-viewer-backdrop {
		@apply fixed inset-0 bg-black/50 z-50;
		@apply flex items-center justify-center p-4;
	}

	.log-viewer-dialog {
		@apply bg-white rounded-lg shadow-xl;
		@apply w-full max-w-2xl max-h-[80vh];
		@apply flex flex-col;
		@apply outline-none;
	}

	:global(.dark) .log-viewer-dialog {
		@apply bg-gray-800;
	}

	.log-viewer-header {
		@apply flex items-center justify-between;
		@apply px-4 py-3 border-b border-gray-200;
	}

	:global(.dark) .log-viewer-header {
		@apply border-gray-700;
	}

	.log-viewer-title {
		@apply text-lg font-semibold text-gray-900;
	}

	:global(.dark) .log-viewer-title {
		@apply text-white;
	}

	.log-viewer-actions {
		@apply flex items-center gap-2;
	}

	.action-btn {
		@apply px-3 py-1.5 rounded-md text-sm font-medium;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.action-btn:disabled {
		@apply opacity-50 cursor-not-allowed;
	}

	.action-btn-export {
		@apply bg-green-100 text-green-700 hover:bg-green-200;
		@apply focus:ring-green-500;
	}

	:global(.dark) .action-btn-export {
		@apply bg-green-900/40 text-green-300 hover:bg-green-900/60;
	}

	.action-btn-clear {
		@apply bg-red-100 text-red-700 hover:bg-red-200;
		@apply focus:ring-red-500;
	}

	:global(.dark) .action-btn-clear {
		@apply bg-red-900/40 text-red-300 hover:bg-red-900/60;
	}

	.close-btn {
		@apply p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500;
	}

	:global(.dark) .close-btn {
		@apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
	}

	.close-icon {
		@apply w-5 h-5;
	}

	.log-viewer-content {
		@apply flex-1 overflow-y-auto p-4;
		@apply font-mono text-sm;
	}

	.log-empty {
		@apply flex flex-col items-center justify-center h-48 text-center;
	}

	.empty-message {
		@apply text-gray-500 font-medium;
	}

	:global(.dark) .empty-message {
		@apply text-gray-400;
	}

	.empty-hint {
		@apply text-gray-400 text-xs mt-1;
	}

	:global(.dark) .empty-hint {
		@apply text-gray-500;
	}

	.log-entry {
		@apply py-2 border-b border-gray-100;
	}

	:global(.dark) .log-entry {
		@apply border-gray-700;
	}

	.log-entry:last-child {
		@apply border-b-0;
	}

	.entry-header {
		@apply flex items-center gap-2 flex-wrap;
	}

	.entry-timestamp {
		@apply text-gray-500 tabular-nums;
	}

	:global(.dark) .entry-timestamp {
		@apply text-gray-400;
	}

	.entry-action {
		@apply font-medium text-blue-600;
	}

	:global(.dark) .entry-action {
		@apply text-blue-400;
	}

	.entry-status {
		@apply text-xs px-1.5 py-0.5 rounded;
	}

	.entry-status.idle {
		@apply bg-gray-100 text-gray-600;
	}

	:global(.dark) .entry-status.idle {
		@apply bg-gray-700 text-gray-400;
	}

	.entry-status.running {
		@apply bg-green-100 text-green-700;
	}

	:global(.dark) .entry-status.running {
		@apply bg-green-900/40 text-green-300;
	}

	.entry-status.complete {
		@apply bg-blue-100 text-blue-700;
	}

	:global(.dark) .entry-status.complete {
		@apply bg-blue-900/40 text-blue-300;
	}

	.entry-details {
		@apply flex items-center gap-2 mt-1 text-xs flex-wrap;
	}

	.entry-task {
		@apply text-gray-600;
	}

	:global(.dark) .entry-task {
		@apply text-gray-300;
	}

	.entry-elapsed {
		@apply text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded;
	}

	:global(.dark) .entry-elapsed {
		@apply text-purple-300 bg-purple-900/40;
	}

	.entry-params {
		@apply text-gray-400 truncate max-w-xs;
	}

	:global(.dark) .entry-params {
		@apply text-gray-500;
	}

	.log-viewer-footer {
		@apply px-4 py-2 border-t border-gray-200 text-xs text-gray-500;
	}

	:global(.dark) .log-viewer-footer {
		@apply border-gray-700 text-gray-400;
	}

	.entry-count {
		@apply tabular-nums;
	}
</style>
