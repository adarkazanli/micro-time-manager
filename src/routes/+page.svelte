<script lang="ts">
	import { importStore, isParsing, hasErrors, canConfirm } from '$lib/stores/importStore';
	import FileUploader from '$lib/components/FileUploader.svelte';
	import SchedulePreview from '$lib/components/SchedulePreview.svelte';
	import TemplateDownload from '$lib/components/TemplateDownload.svelte';

	async function handleFileSelect(file: File) {
		await importStore.uploadFile(file);
	}

	function handleConfirm() {
		importStore.confirmSchedule();
	}

	function handleCancel() {
		importStore.reset();
	}

	function handleTaskUpdate(id: string, changes: Parameters<typeof importStore.updateTask>[1]) {
		importStore.updateTask(id, changes);
	}

	function handleReorder(fromIndex: number, toIndex: number) {
		importStore.reorderTasks(fromIndex, toIndex);
		importStore.recalculateStartTimes();
	}

	function handleRetry() {
		importStore.reset();
	}

	function handleImportAnother() {
		importStore.reset();
	}
</script>

<svelte:head>
	<title>Micro Time Manager - Schedule Import</title>
</svelte:head>

<main class="app-container">
	<header class="app-header">
		<h1 class="app-title">Micro Time Manager</h1>
		<p class="app-subtitle">Import your daily schedule</p>
	</header>

	<div class="app-content">
		{#if $importStore.status === 'idle'}
			<FileUploader onFileSelect={handleFileSelect} />
			<div class="template-section">
				<TemplateDownload />
			</div>
		{:else if $importStore.status === 'parsing'}
			<div class="loading-state" data-testid="loading-state">
				<div class="loading-spinner"></div>
				<p class="loading-text">Parsing schedule...</p>
			</div>
		{:else if $importStore.status === 'error'}
			<div class="error-state" data-testid="error-state">
				<div class="error-header">
					<svg
						class="error-icon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<h2 class="error-title">Import Failed</h2>
				</div>
				<p class="error-subtitle">
					Found {$importStore.errors.length} error{$importStore.errors.length === 1 ? '' : 's'} in your file
				</p>
				<ul class="error-list">
					{#each $importStore.errors as error}
						<li class="error-item">
							{#if error.row > 0}
								<span class="error-location">Row {error.row}, {error.column}:</span>
							{/if}
							<span class="error-message">{error.message}</span>
							{#if error.value}
								<span class="error-value">"{error.value}"</span>
							{/if}
						</li>
					{/each}
				</ul>
				<button type="button" class="btn btn-primary" onclick={handleRetry}>
					Try Again
				</button>
			</div>
		{:else if $importStore.status === 'preview'}
			<SchedulePreview
				tasks={$importStore.tasks}
				readonly={false}
				onTaskUpdate={handleTaskUpdate}
				onReorder={handleReorder}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		{:else if $importStore.status === 'ready'}
			<div class="success-state" data-testid="success-state">
				<div class="success-icon-wrapper">
					<svg
						class="success-icon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<h2 class="success-title">Schedule Confirmed!</h2>
				<p class="success-subtitle">Your schedule has been saved and is ready to track.</p>
				<div class="success-actions">
					<button type="button" class="btn btn-primary" onclick={handleImportAnother}>
						Import Another Schedule
					</button>
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	@reference "tailwindcss";

	.app-container {
		@apply max-w-3xl mx-auto p-6;
	}

	.app-header {
		@apply text-center mb-8;
	}

	.app-title {
		@apply text-3xl font-bold text-gray-900;
	}

	.app-subtitle {
		@apply text-gray-600 mt-1;
	}

	.app-content {
		@apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
	}

	/* Loading State */
	.loading-state {
		@apply flex flex-col items-center justify-center py-12;
	}

	.loading-spinner {
		@apply w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin;
	}

	.loading-text {
		@apply mt-4 text-gray-600;
	}

	/* Error State */
	.error-state {
		@apply flex flex-col gap-4;
	}

	.error-header {
		@apply flex items-center gap-2;
	}

	.error-icon {
		@apply w-6 h-6 text-red-500;
	}

	.error-title {
		@apply text-xl font-semibold text-gray-900;
	}

	.error-subtitle {
		@apply text-gray-600;
	}

	.error-list {
		@apply bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto;
	}

	.error-item {
		@apply text-sm text-red-800;
	}

	.error-location {
		@apply font-medium;
	}

	.error-message {
		@apply ml-1;
	}

	.error-value {
		@apply ml-1 text-red-600 font-mono text-xs;
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

	/* Success State */
	.success-state {
		@apply flex flex-col items-center justify-center py-12 text-center;
	}

	.success-icon-wrapper {
		@apply w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4;
	}

	.success-icon {
		@apply w-10 h-10 text-green-600;
	}

	.success-title {
		@apply text-2xl font-semibold text-gray-900 mb-2;
	}

	.success-subtitle {
		@apply text-gray-600 mb-6;
	}

	.success-actions {
		@apply flex gap-3;
	}

	/* Template Section */
	.template-section {
		@apply mt-4 pt-4 border-t border-gray-200;
	}
</style>
