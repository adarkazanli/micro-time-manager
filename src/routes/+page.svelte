<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { importStore } from '$lib/stores/importStore';
	import { timerStore } from '$lib/stores/timerStore.svelte';
	import { sessionStore } from '$lib/stores/sessionStore.svelte';
	import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
	import { storage } from '$lib/services/storage';
	import { createTabSync, type TabSyncService } from '$lib/services/tabSync';
	import type { ConfirmedTask } from '$lib/types';
	import { PERSIST_INTERVAL_MS } from '$lib/types';
	import FileUploader from '$lib/components/FileUploader.svelte';
	import SchedulePreview from '$lib/components/SchedulePreview.svelte';
	import TemplateDownload from '$lib/components/TemplateDownload.svelte';
	import TimerDisplay from '$lib/components/TimerDisplay.svelte';
	import CurrentTask from '$lib/components/CurrentTask.svelte';
	import TaskControls from '$lib/components/TaskControls.svelte';
	import DaySummary from '$lib/components/DaySummary.svelte';
	import FixedTaskWarning from '$lib/components/FixedTaskWarning.svelte';
	import ImpactPanel from '$lib/components/ImpactPanel.svelte';
	import InterruptButton from '$lib/components/InterruptButton.svelte';
	import InterruptionTimer from '$lib/components/InterruptionTimer.svelte';
	import InterruptionSummary from '$lib/components/InterruptionSummary.svelte';
	import EditInterruptionDialog from '$lib/components/EditInterruptionDialog.svelte';
	import InterruptionLog from '$lib/components/InterruptionLog.svelte';
	import type { DaySummary as DaySummaryType } from '$lib/types';

	// State for confirmed tasks
	let confirmedTasks = $state<ConfirmedTask[]>([]);
	let showTracking = $state(false);
	let daySummary = $state<DaySummaryType | null>(null);

	// Tab sync state
	let tabSync: TabSyncService | null = $state(null);
	let isLeader = $state(true);
	let persistInterval: ReturnType<typeof setInterval> | null = null;

	// Interruption state (T029, T037)
	let pausedTaskElapsedMs = $state(0);
	let lastInterruptionId = $state<string | null>(null);
	let showEditDialog = $state(false);
	let showInterruptionLog = $state(false);

	/**
	 * Persist current session state to localStorage
	 * T052/T053: Visibility change and periodic persistence
	 */
	function persistSessionState() {
		if (sessionStore.session && sessionStore.status === 'running') {
			// Update elapsed time from timer
			const elapsedMs = timerStore.elapsedMs;
			storage.saveSession({
				...sessionStore.session,
				currentTaskElapsedMs: elapsedMs,
				lastPersistedAt: Date.now()
			});
		}
	}

	/**
	 * Handle visibility change - persist when page becomes hidden
	 */
	function handleVisibilityChange() {
		if (document.hidden) {
			persistSessionState();
		}
	}

	// Load tasks on mount
	onMount(() => {
		storage.init();
		confirmedTasks = storage.loadTasks();
		showTracking = confirmedTasks.length > 0;

		// T055: Initialize tab sync
		tabSync = createTabSync();
		isLeader = tabSync.claimLeadership();

		tabSync.onLeadershipChange((leader) => {
			isLeader = leader;
		});

		// Restore session if exists
		const savedSession = storage.getSession();
		if (savedSession && savedSession.status === 'running') {
			sessionStore.restore(savedSession, confirmedTasks);
			// Resume timer with stored elapsed time
			if (sessionStore.currentProgress) {
				timerStore.start(
					sessionStore.currentProgress.plannedDurationSec,
					savedSession.currentTaskElapsedMs
				);
			}
		}

		// T053: Restore interruption state on session recovery
		const savedInterruptions = storage.loadInterruptions();
		if (savedInterruptions.length > 0) {
			interruptionStore.restore(savedInterruptions);
		}

		// T052: Set up visibility change listener
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// T053: Set up periodic persistence (every 5 seconds)
		persistInterval = setInterval(persistSessionState, PERSIST_INTERVAL_MS);
	});

	// Cleanup on destroy
	onDestroy(() => {
		// Persist state before unmounting
		persistSessionState();

		// Clean up visibility listener
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}

		// Clean up periodic persistence
		if (persistInterval) {
			clearInterval(persistInterval);
		}

		// Clean up tab sync
		if (tabSync) {
			tabSync.releaseLeadership();
			tabSync.destroy();
		}
	});

	async function handleFileSelect(file: File) {
		await importStore.uploadFile(file);
	}

	function handleConfirm() {
		const tasks = importStore.confirmSchedule();
		confirmedTasks = tasks;
		showTracking = true;
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

	// Reserved for future "import another schedule" feature
	function _handleImportAnother() {
		importStore.reset();
		showTracking = false;
	}

	// Day tracking handlers
	function handleStartDay() {
		sessionStore.startDay(confirmedTasks);
		if (sessionStore.currentProgress) {
			timerStore.start(sessionStore.currentProgress.plannedDurationSec);
		}
	}

	function handleCompleteTask() {
		// T051: Auto-end any active interruption before completing task
		if (interruptionStore.isInterrupted) {
			interruptionStore.autoEndInterruption();
		}

		const elapsedMs = timerStore.stop();
		const elapsedSec = Math.floor(elapsedMs / 1000);
		sessionStore.completeTask(elapsedSec);

		// Start next task timer if session is still running
		if (sessionStore.status === 'running' && sessionStore.currentProgress) {
			timerStore.start(sessionStore.currentProgress.plannedDurationSec);
		}
	}

	function handleEndDay() {
		// T052: Auto-end any active interruption before ending day
		if (interruptionStore.isInterrupted) {
			interruptionStore.autoEndInterruption();
		}

		const summary = sessionStore.endDay();
		daySummary = summary;
	}

	function handleDismissSummary() {
		daySummary = null;
		sessionStore.reset();
		timerStore.reset();
		interruptionStore.reset(); // T054: Clear interruptions on session reset
		importStore.reset();
		storage.clearTasks();
		confirmedTasks = [];
		showTracking = false;
		lastInterruptionId = null;
	}

	function handleBackToImport() {
		sessionStore.reset();
		timerStore.reset();
		interruptionStore.reset();
		importStore.reset();
		storage.clearTasks();
		confirmedTasks = [];
		showTracking = false;
		lastInterruptionId = null;
	}

	// Impact panel reorder handler (T051)
	function handleImpactReorder(fromIndex: number, toIndex: number) {
		const success = sessionStore.reorderTasks(fromIndex, toIndex);
		if (success) {
			// Update local reference from in-memory store (no storage round-trip)
			confirmedTasks = sessionStore.tasks;
		}
	}

	// Impact panel task update handler
	function handleImpactUpdateTask(
		taskId: string,
		updates: Partial<Pick<ConfirmedTask, 'name' | 'plannedStart' | 'plannedDurationSec' | 'type'>>
	) {
		const success = sessionStore.updateTask(taskId, updates);
		if (success) {
			// Update local reference from in-memory store (no storage round-trip)
			confirmedTasks = sessionStore.tasks;
		}
	}

	// T025: Handle starting an interruption
	function handleInterrupt() {
		const taskId = sessionStore.currentTask?.taskId;
		if (!taskId || interruptionStore.isInterrupted) return;

		// Pause task timer and store elapsed time for resume
		pausedTaskElapsedMs = timerStore.stop();

		// Start interruption
		interruptionStore.startInterruption(taskId);
	}

	// T035: Handle resuming from an interruption
	function handleResume() {
		if (!interruptionStore.isInterrupted) return;

		// End interruption and get the completed record
		const completed = interruptionStore.endInterruption();
		lastInterruptionId = completed.interruptionId;

		// Resume task timer from where it left off
		if (sessionStore.currentProgress) {
			timerStore.start(sessionStore.currentProgress.plannedDurationSec, pausedTaskElapsedMs);
		}
	}

	// T026, T036: Global keydown listener for I/R keys
	function handleKeydown(event: KeyboardEvent) {
		// Skip if in input/textarea
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement
		) {
			return;
		}

		const key = event.key.toLowerCase();

		// I key - start interruption
		if (key === 'i' && sessionStore.status === 'running' && !interruptionStore.isInterrupted) {
			handleInterrupt();
		}

		// R key - resume from interruption
		if (key === 'r' && interruptionStore.isInterrupted) {
			handleResume();
		}
	}

	// T037: Handle editing last interruption
	function handleEditLastInterruption() {
		if (lastInterruptionId) {
			showEditDialog = true;
		}
	}

	// T038: Handle saving interruption edits
	function handleSaveInterruption(updates: { category: import('$lib/types').InterruptionCategory | null; note: string | null }) {
		if (lastInterruptionId) {
			interruptionStore.updateInterruption(lastInterruptionId, updates);
		}
		showEditDialog = false;
	}

	// T050: Toggle interruption log view
	function toggleInterruptionLog() {
		showInterruptionLog = !showInterruptionLog;
	}

	// T043: Derived current task summary
	const currentTaskSummary = $derived(
		sessionStore.currentTask
			? interruptionStore.getTaskSummary(sessionStore.currentTask.taskId)
			: null
	);

	// Get the last interruption for editing
	const lastInterruption = $derived(
		lastInterruptionId
			? interruptionStore.interruptions.find((i) => i.interruptionId === lastInterruptionId) ?? null
			: null
	);

	// Derived state for UI
	const isLastTask = $derived(
		sessionStore.currentTaskIndex === sessionStore.totalTasks - 1
	);
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Micro Time Manager - Schedule Import</title>
</svelte:head>

<main class="app-container">
	<header class="app-header">
		<h1 class="app-title">Micro Time Manager</h1>
		<p class="app-subtitle">Import your daily schedule</p>
	</header>

	<div class="app-content">
		{#if showTracking}
			<!-- Day Tracking View - prioritized when we have persisted tasks -->
			<div class="tracking-view" data-testid="tracking-view">
				{#if daySummary}
					<DaySummary summary={daySummary} onDismiss={handleDismissSummary} />
				{:else}
					{#if sessionStore.status === 'running'}
						<!-- Side-by-side layout: timer left, impact panel right (T024) -->
						<div class="tracking-layout">
							<!-- Left: Timer and current task -->
							<div class="timer-column">
								<div class="timer-section">
									<TimerDisplay
										displayTime={timerStore.displayTime}
										color={timerStore.color}
										isRunning={timerStore.isRunning}
									/>
								</div>

								<div class="task-section">
									<CurrentTask
										task={sessionStore.currentTask}
										currentIndex={sessionStore.currentTaskIndex}
										totalTasks={sessionStore.totalTasks}
									/>
								</div>

								<div class="lag-section" data-testid="lag-display">
									<span class="lag-label">Schedule:</span>
									<span class="lag-value" class:ahead={sessionStore.lagSec < 0} class:behind={sessionStore.lagSec > 0}>
										{sessionStore.lagDisplay}
									</span>
								</div>

								{#if sessionStore.getFixedTaskWarning(timerStore.elapsedMs)}
									{@const fixedTaskWarning = sessionStore.getFixedTaskWarning(timerStore.elapsedMs)}
									{#if fixedTaskWarning}
										<div class="warning-section">
											<FixedTaskWarning warning={fixedTaskWarning} />
										</div>
									{/if}
								{/if}

								<div class="controls-section">
									<TaskControls
										status={sessionStore.status}
										hasSchedule={confirmedTasks.length > 0}
										{isLastTask}
										{isLeader}
										onStartDay={handleStartDay}
										onCompleteTask={handleCompleteTask}
										onEndDay={handleEndDay}
									/>
									<!-- T027: InterruptButton for starting/resuming interruptions -->
									<InterruptButton
										isInterrupted={interruptionStore.isInterrupted}
										canInterrupt={sessionStore.status === 'running' && sessionStore.currentTask !== null}
										onInterrupt={handleInterrupt}
										onResume={handleResume}
									/>
								</div>

								<!-- T028: InterruptionTimer shows when interrupted -->
								{#if interruptionStore.isInterrupted}
									<div class="interruption-section">
										<InterruptionTimer elapsedMs={interruptionStore.elapsedMs} />
									</div>
								{/if}

								<!-- T044: InterruptionSummary shows count/duration for current task -->
								{#if currentTaskSummary && currentTaskSummary.count > 0}
									<div class="interruption-summary-section">
										<InterruptionSummary
											count={currentTaskSummary.count}
											totalDurationSec={currentTaskSummary.totalDurationSec}
											onEditLast={lastInterruptionId ? handleEditLastInterruption : undefined}
										/>
									</div>
								{/if}

								<!-- T049: View full interruption log button -->
								{#if interruptionStore.interruptions.length > 0}
									<div class="view-log-section">
										<button
											type="button"
											class="btn-link view-log-btn"
											data-testid="view-interruption-log-btn"
											onclick={toggleInterruptionLog}
										>
											View interruption log ({interruptionStore.interruptions.length})
										</button>
									</div>
								{/if}
							</div>

							<!-- Right: Impact panel (T025) -->
							<div class="impact-column">
								<ImpactPanel
									tasks={confirmedTasks}
									progress={sessionStore.session?.taskProgress ?? []}
									currentIndex={sessionStore.currentTaskIndex}
									elapsedMs={timerStore.elapsedMs}
									onReorder={handleImpactReorder}
									onUpdateTask={handleImpactUpdateTask}
								/>
							</div>
						</div>
					{:else}
						<!-- Idle state: show controls centered -->
						<div class="controls-section">
							<TaskControls
								status={sessionStore.status}
								hasSchedule={confirmedTasks.length > 0}
								{isLastTask}
								{isLeader}
								onStartDay={handleStartDay}
								onCompleteTask={handleCompleteTask}
								onEndDay={handleEndDay}
							/>
						</div>
					{/if}

					{#if sessionStore.status === 'idle'}
						<div class="back-link">
							<button type="button" class="btn-link" onclick={handleBackToImport}>
								Import a different schedule
							</button>
						</div>
					{/if}
				{/if}
			</div>
		{:else if $importStore.status === 'idle'}
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
					{#each $importStore.errors as error, i (i)}
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
		{/if}
	</div>
</main>

<!-- T038: EditInterruptionDialog for editing category/note -->
<EditInterruptionDialog
	interruption={lastInterruption}
	open={showEditDialog}
	onSave={handleSaveInterruption}
	onClose={() => (showEditDialog = false)}
/>

<!-- T049: InterruptionLog overlay -->
{#if showInterruptionLog}
	<div class="interruption-log-overlay">
		<InterruptionLog
			interruptions={interruptionStore.interruptions}
			tasks={confirmedTasks}
			onClose={toggleInterruptionLog}
		/>
	</div>
{/if}

<style>
	@import "tailwindcss";

	.app-container {
		@apply max-w-5xl mx-auto p-6;
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

	/* Template Section */
	.template-section {
		@apply mt-4 pt-4 border-t border-gray-200;
	}

	/* Tracking View */
	.tracking-view {
		@apply flex flex-col items-center gap-8 py-6;
	}

	/* Side-by-side layout for running state */
	.tracking-layout {
		@apply grid grid-cols-1 md:grid-cols-2 gap-6 w-full;
	}

	.timer-column {
		@apply flex flex-col items-center gap-6;
	}

	.impact-column {
		@apply w-full;
	}

	.timer-section {
		@apply w-full flex justify-center;
	}

	.task-section {
		@apply w-full;
	}

	.lag-section {
		@apply flex items-center gap-2 text-sm;
	}

	.lag-label {
		@apply text-gray-500;
	}

	.lag-value {
		@apply font-medium text-gray-700;
	}

	.lag-value.ahead {
		@apply text-green-600;
	}

	.lag-value.behind {
		@apply text-red-600;
	}

	.warning-section {
		@apply w-full max-w-md;
	}

	.controls-section {
		@apply w-full flex flex-col items-center gap-4;
	}

	.back-link {
		@apply mt-4;
	}

	.btn-link {
		@apply text-sm text-gray-500 hover:text-gray-700 underline;
		@apply transition-colors duration-150;
	}

	/* Interruption sections */

	.interruption-section {
		@apply w-full flex justify-center;
	}

	.interruption-summary-section {
		@apply w-full flex justify-center;
	}

	.view-log-section {
		@apply w-full flex justify-center;
	}

	.view-log-btn {
		@apply text-xs;
	}

	.interruption-log-overlay {
		@apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
	}
</style>
