<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { importStore } from '$lib/stores/importStore';
	import { timerStore } from '$lib/stores/timerStore.svelte';
	import { sessionStore } from '$lib/stores/sessionStore.svelte';
	import { interruptionStore } from '$lib/stores/interruptionStore.svelte';
	import { noteStore } from '$lib/stores/noteStore.svelte';
	import { settingsStore } from '$lib/stores/settingsStore.svelte';
	import { storage } from '$lib/services/storage';
	import { initTheme } from '$lib/services/theme';
	import { createTabSync, type TabSyncService } from '$lib/services/tabSync';
	import type { ConfirmedTask, ExportResult } from '$lib/types';
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
	import NoteInput from '$lib/components/NoteInput.svelte';
	import AddTaskDialog from '$lib/components/AddTaskDialog.svelte';
	import NotesView from '$lib/components/NotesView.svelte';
	import AnalyticsDashboard from '$lib/components/AnalyticsDashboard.svelte';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import { exportToExcel, exportToCSV, exportToTemplate } from '$lib/services/export';
	import { calculateAnalyticsSummary } from '$lib/services/analytics';
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

	// Analytics state (T045 - 006-analytics-dashboard)
	let isAnalyticsOpen = $state(false);

	// Add task dialog state (T034 - 009-ad-hoc-tasks)
	let showAddTaskDialog = $state(false);

	// Flag to track when initialization is complete (for notes persistence)
	let isInitialized = $state(false);

	/**
	 * Persist current session state to localStorage
	 * T052/T053: Visibility change and periodic persistence
	 * T036/T037 (010-timer-persistence): Also persist active interruption state
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

			// T036: Also persist interruption state if interrupted
			// The interruption uses wall-clock recovery via startedAt, so we just
			// need to persist the active interruption record periodically
			if (interruptionStore.isInterrupted) {
				storage.saveInterruptionState({
					interruptions: interruptionStore.allInterruptionsForPersistence,
					pausedTaskElapsedMs
				});
			}
		}
	}

	/**
	 * Handle visibility change - persist when page becomes hidden
	 * T037 (010-timer-persistence): Also persist interruption state on visibility change
	 */
	function handleVisibilityChange() {
		if (document.hidden) {
			persistSessionState();
			// T037: Explicitly persist interruption state when page becomes hidden
			if (interruptionStore.isInterrupted) {
				storage.saveInterruptionState({
					interruptions: interruptionStore.allInterruptionsForPersistence,
					pausedTaskElapsedMs
				});
			}
		}
	}

	// Load tasks on mount
	onMount(() => {
		storage.init();

		// T007, T020: Load settings and initialize theme
		settingsStore.load();
		initTheme(settingsStore.theme);

		confirmedTasks = storage.loadTasks();
		showTracking = confirmedTasks.length > 0;

		// T055: Initialize tab sync
		tabSync = createTabSync();
		isLeader = tabSync.claimLeadership();

		tabSync.onLeadershipChange((leader) => {
			isLeader = leader;
		});

		// T053: Restore interruption state first (need to know if interrupted before starting timer)
		const savedInterruptionState = storage.loadInterruptionState();
		const wasInterrupted = interruptionStore.restore(savedInterruptionState.interruptions);

		// T051 (005-note-capture): Restore notes from storage
		const savedNotes = storage.loadNotes();
		noteStore.restore(savedNotes);

		// If there was an active interruption, restore the paused task elapsed time
		if (wasInterrupted && savedInterruptionState.pausedTaskElapsedMs > 0) {
			pausedTaskElapsedMs = savedInterruptionState.pausedTaskElapsedMs;
		}

		// Restore session if exists
		// T029-T032 (010-timer-persistence): Use wall-clock recovery for accurate elapsed time
		const savedSession = storage.getSession();
		if (savedSession && savedSession.status === 'running') {
			sessionStore.restore(savedSession, confirmedTasks);

			// Resume task timer ONLY if not currently interrupted
			if (sessionStore.currentProgress && !wasInterrupted) {
				// T030: Use timerStore.recover() for wall-clock elapsed calculation
				const recovery = timerStore.recover();
				const startFromMs = recovery.success
					? recovery.recoveredElapsedMs
					: savedSession.currentTaskElapsedMs;

				// T031: Silent recovery - no notification per FR-013
				// T032: Start timer from recovered elapsed position
				timerStore.start(sessionStore.currentProgress.plannedDurationSec, startFromMs);
			}
		}

		// T052: Set up visibility change listener
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// T053: Set up periodic persistence (every 5 seconds)
		persistInterval = setInterval(persistSessionState, PERSIST_INTERVAL_MS);

		// Release leadership when browser tab is closed (beforeunload doesn't trigger onDestroy)
		window.addEventListener('beforeunload', handleBeforeUnload);

		// Mark initialization complete - enables reactive notes persistence
		isInitialized = true;
	});

	function handleBeforeUnload() {
		if (tabSync) {
			tabSync.releaseLeadership();
		}
	}

	// Cleanup on destroy
	onDestroy(() => {
		// Persist state before unmounting
		persistSessionState();

		// Clean up visibility listener
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}

		// Clean up beforeunload listener
		if (typeof window !== 'undefined') {
			window.removeEventListener('beforeunload', handleBeforeUnload);
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

	// T051 (005-note-capture): Reactively persist notes whenever they change
	// This ensures notes are saved even if manual save calls are missed
	$effect(() => {
		// Access noteStore.notes to create a dependency
		const currentNotes = noteStore.notes;
		// Only save after initialization is complete to avoid overwriting on mount
		if (isInitialized) {
			storage.saveNotes(currentNotes);
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

	function handleTaskDelete(id: string) {
		importStore.deleteTask(id);
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
		noteStore.reset(); // T018 (005-note-capture): Clear notes on session reset
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
		noteStore.reset(); // T018 (005-note-capture): Clear notes on back to import
		importStore.reset();
		storage.clearTasks();
		confirmedTasks = [];
		showTracking = false;
		lastInterruptionId = null;
	}

	/**
	 * Handle "Start New Day" from settings panel.
	 * Resets all session data and returns to the import screen.
	 */
	function handleStartNewDay() {
		daySummary = null;
		sessionStore.reset();
		timerStore.reset();
		interruptionStore.reset();
		noteStore.reset();
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

			// If updating the current task's duration, also update the timer
			// This ensures remaining time and schedule projections recalculate
			const currentTask = sessionStore.currentTask;
			if (currentTask && currentTask.taskId === taskId && updates.plannedDurationSec !== undefined) {
				timerStore.setDuration(updates.plannedDurationSec);
			}
		}
	}

	// Task correction: Update progress (actual duration) handler
	function handleImpactUpdateProgress(taskId: string, updates: { actualDurationSec: number }) {
		sessionStore.updateTaskProgress(taskId, updates);
	}

	// Task correction: Uncomplete task handler
	function handleUncompleteTask(taskId: string) {
		// Stop any running timer first (since we're switching tasks)
		timerStore.stop();

		const success = sessionStore.uncompleteTask(taskId);
		if (success) {
			// Update local reference
			confirmedTasks = sessionStore.tasks;
			// If this task becomes active, restart the timer from the preserved elapsed time
			if (sessionStore.currentProgress && sessionStore.currentProgress.taskId === taskId) {
				// Start timer from where it left off (actualDurationSec is preserved)
				const previousElapsedMs = sessionStore.currentProgress.actualDurationSec * 1000;
				timerStore.start(sessionStore.currentProgress.plannedDurationSec, previousElapsedMs);
			}
		}
	}

	// Task correction: Update elapsed time for current task
	function handleUpdateElapsed(elapsedMs: number) {
		timerStore.setElapsed(elapsedMs);
	}

	// Jump to a specific task (start it immediately, PAUSING current task)
	function handleStartTask(taskId: string) {
		// Auto-end any active interruption before jumping
		if (interruptionStore.isInterrupted) {
			interruptionStore.autoEndInterruption();
		}

		// Get current elapsed time and PAUSE current task (not complete), then jump to target
		const elapsedMs = timerStore.stop();
		const elapsedSec = Math.floor(elapsedMs / 1000);
		const success = sessionStore.jumpToTask(taskId, elapsedSec);

		if (success && sessionStore.currentProgress) {
			// Start timer for the new task, resuming from any saved elapsed time
			const savedElapsedMs = sessionStore.session?.currentTaskElapsedMs ?? 0;
			timerStore.start(sessionStore.currentProgress.plannedDurationSec, savedElapsedMs);
		}
	}

	/**
	 * Helper to persist interruption state to localStorage
	 */
	function saveInterruptionState() {
		storage.saveInterruptionState({
			interruptions: interruptionStore.allInterruptionsForPersistence,
			pausedTaskElapsedMs: interruptionStore.isInterrupted ? pausedTaskElapsedMs : 0
		});
	}

	// T025: Handle starting an interruption
	function handleInterrupt() {
		const taskId = sessionStore.currentTask?.taskId;
		if (!taskId || interruptionStore.isInterrupted) return;

		// Pause task timer and store elapsed time for resume
		pausedTaskElapsedMs = timerStore.stop();

		// Start interruption
		interruptionStore.startInterruption(taskId);

		// Persist state with pausedTaskElapsedMs
		saveInterruptionState();
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

		// Reset pausedTaskElapsedMs and persist
		pausedTaskElapsedMs = 0;
		saveInterruptionState();
	}

	// T026, T036: Global keydown listener for I/R keys
	// T014 (005-note-capture): Added Ctrl/Cmd+N for note capture
	// T033, T036 (009-ad-hoc-tasks): Added Ctrl/Cmd+T for quick task entry
	function handleKeydown(event: KeyboardEvent) {
		// Check for modifier key (Ctrl on Windows/Linux, Cmd on Mac)
		const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const modifier = isMac ? event.metaKey : event.ctrlKey;

		// T014: Check for Ctrl/Cmd+N to open note input
		if (modifier && event.key.toLowerCase() === 'n') {
			event.preventDefault();
			noteStore.openInput();
			return;
		}

		// T033, T036: Check for Ctrl/Cmd+T to open add task dialog (only during active session)
		if (modifier && event.key.toLowerCase() === 't') {
			event.preventDefault();
			if (sessionStore.status === 'running') {
				showAddTaskDialog = true;
			}
			return;
		}

		// Skip if in input/textarea for other shortcuts
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

	// T016 (005-note-capture): Handle saving a note
	function handleNoteSave(content: string) {
		// Get current task ID if session is running
		const taskId = sessionStore.status === 'running' && sessionStore.currentTask
			? sessionStore.currentTask.taskId
			: null;

		noteStore.addNote(content, taskId);
		// Persist to storage
		storage.saveNotes(noteStore.notes);
	}

	// T016 (005-note-capture): Handle canceling note input
	function handleNoteCancel() {
		noteStore.closeInput();
	}

	// T026 (005-note-capture): Toggle notes view
	function toggleNotesView() {
		noteStore.toggleView();
	}

	// T046 (006-analytics-dashboard): Toggle analytics panel
	function toggleAnalytics() {
		isAnalyticsOpen = !isAnalyticsOpen;
	}

	// T027, T038, T050 (007-data-export): Handle Excel export with error handling
	function handleExportExcel(): ExportResult {
		if (!sessionStore.session) {
			return { success: false, error: 'No active session to export' };
		}

		const progress = sessionStore.session.taskProgress;
		const interruptions = interruptionStore.interruptions;
		const notes = noteStore.notes;
		const summary = calculateAnalyticsSummary(progress, interruptions);
		const sessionStart = sessionStore.session.startedAt;
		const sessionEnd = sessionStore.session.endedAt;

		return exportToExcel(
			confirmedTasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);
	}

	// T027, T044, T050 (007-data-export): Handle CSV export with error handling
	function handleExportCSV(): ExportResult {
		if (!sessionStore.session) {
			return { success: false, error: 'No active session to export' };
		}

		const progress = sessionStore.session.taskProgress;
		const interruptions = interruptionStore.interruptions;
		const notes = noteStore.notes;
		const summary = calculateAnalyticsSummary(progress, interruptions);
		const sessionStart = sessionStore.session.startedAt;
		const sessionEnd = sessionStore.session.endedAt;

		return exportToCSV(
			confirmedTasks,
			progress,
			interruptions,
			notes,
			summary,
			sessionStart,
			sessionEnd
		);
	}

	// Handle template export (re-importable CSV format)
	function handleExportTemplate(): ExportResult {
		if (!sessionStore.session) {
			return { success: false, error: 'No active session to export' };
		}

		const sessionStart = sessionStore.session.startedAt;
		return exportToTemplate(confirmedTasks, sessionStart);
	}

	// T049 (005-note-capture): Handle editing a note
	function handleNoteEdit(noteId: string) {
		// For now, we'll use a simple prompt - this will be replaced with a proper dialog in Phase 7
		const note = noteStore.notes.find((n) => n.noteId === noteId);
		if (!note) return;

		const newContent = prompt('Edit note:', note.content);
		if (newContent !== null && newContent.trim()) {
			noteStore.updateNote(noteId, newContent);
			storage.saveNotes(noteStore.notes);
		}
	}

	// T050 (005-note-capture): Handle deleting a note
	function handleNoteDelete(noteId: string) {
		if (confirm('Are you sure you want to delete this note?')) {
			noteStore.deleteNote(noteId);
			storage.saveNotes(noteStore.notes);
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
			// Persist updated state
			saveInterruptionState();
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

	// T034, T040: Track timer color changes for sound/vibration alerts
	let lastTimerColor = $state<string>('green');

	$effect(() => {
		const currentColor = timerStore.color;
		// Only trigger alerts on transition to yellow or red
		if (sessionStore.status === 'running' && !interruptionStore.isInterrupted) {
			if (lastTimerColor === 'green' && (currentColor === 'yellow' || currentColor === 'red')) {
				// T034: Play alert sound on warning
				import('$lib/services/theme').then(({ playAlertSound, triggerVibration }) => {
					playAlertSound(settingsStore.soundEnabled);
					triggerVibration(settingsStore.vibrationEnabled);
				});
			} else if (lastTimerColor === 'yellow' && currentColor === 'red') {
				// T034: Play alert sound on overtime
				import('$lib/services/theme').then(({ playAlertSound, triggerVibration }) => {
					playAlertSound(settingsStore.soundEnabled);
					triggerVibration(settingsStore.vibrationEnabled);
				});
			}
		}
		lastTimerColor = currentColor;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Micro Time Manager - Schedule Import</title>
</svelte:head>

<main class="app-container">
	<header class="app-header">
		<div class="header-content">
			<h1 class="app-title">Micro Time Manager</h1>
			<p class="app-subtitle">Import your daily schedule</p>
		</div>
		<!-- T010: Settings gear icon -->
		<button
			type="button"
			class="settings-btn"
			onclick={() => settingsStore.openPanel()}
			aria-label="Open settings"
			data-testid="settings-btn"
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="settings-icon">
				<path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
			</svg>
		</button>
	</header>

	<div class="app-content">
		<!-- T015 (005-note-capture): Inline NoteInput at top -->
		{#if noteStore.isInputOpen}
			<NoteInput onSave={handleNoteSave} onCancel={handleNoteCancel} />
		{/if}

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
									<div class="secondary-controls">
										<!-- T027: InterruptButton for starting/resuming interruptions -->
										<InterruptButton
											isInterrupted={interruptionStore.isInterrupted}
											canInterrupt={sessionStore.status === 'running' && sessionStore.currentTask !== null}
											onInterrupt={handleInterrupt}
											onResume={handleResume}
										/>
										<!-- T017 (005-note-capture): Add Note button -->
										<button
											type="button"
											class="btn btn-note"
											onclick={() => noteStore.openInput()}
											data-testid="add-note-btn"
											title="Add Note (Ctrl+N / Cmd+N)"
										>
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="note-icon">
												<path d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.379 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" />
											</svg>
											Add Note
										</button>
										<!-- T026 (005-note-capture): View Notes button -->
										{#if noteStore.notes.length > 0}
											<button
												type="button"
												class="btn btn-notes-view"
												onclick={toggleNotesView}
												data-testid="view-notes-btn"
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="note-icon">
													<path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
												</svg>
												Notes ({noteStore.notes.length})
											</button>
										{/if}
									</div>
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
									timerStartedAtMs={sessionStore.session?.timerStartedAtMs}
									sessionActive={sessionStore.status === 'running'}
									onReorder={handleImpactReorder}
									onUpdateTask={handleImpactUpdateTask}
									onAddTask={() => { showAddTaskDialog = true; }}
									onUpdateProgress={handleImpactUpdateProgress}
									onUncompleteTask={handleUncompleteTask}
									onUpdateElapsed={handleUpdateElapsed}
									onStartTask={handleStartTask}
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
				onTaskDelete={handleTaskDelete}
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

<!-- T026 (005-note-capture): NotesView overlay -->
{#if noteStore.isViewOpen}
	<div class="notes-view-overlay" data-testid="notes-view-overlay">
		<NotesView
			tasks={confirmedTasks}
			onEdit={handleNoteEdit}
			onDelete={handleNoteDelete}
			onClose={toggleNotesView}
		/>
	</div>
{/if}

<!-- T048 (006-analytics-dashboard): AnalyticsDashboard overlay -->
{#if isAnalyticsOpen}
	<div class="analytics-overlay" data-testid="analytics-overlay">
		<div class="analytics-panel">
			<AnalyticsDashboard onClose={toggleAnalytics} />
		</div>
	</div>
{/if}

<!-- T008-T014 (008-settings): Settings panel -->
<SettingsPanel
	open={settingsStore.isPanelOpen}
	onClose={() => settingsStore.closePanel()}
	onAnalytics={toggleAnalytics}
	onExportExcel={handleExportExcel}
	onExportCSV={handleExportCSV}
	onExportTemplate={handleExportTemplate}
	onStartNewDay={handleStartNewDay}
	hasSession={sessionStore.session !== null}
/>

<!-- T035 (009-ad-hoc-tasks): Add Task Dialog for keyboard shortcut access -->
<AddTaskDialog
	open={showAddTaskDialog}
	onClose={() => showAddTaskDialog = false}
	onTaskCreated={() => {
		confirmedTasks = sessionStore.tasks;
		showAddTaskDialog = false;
	}}
/>

<style>
	@reference "tailwindcss";

	.app-container {
		@apply max-w-5xl mx-auto p-6;
	}

	.app-header {
		@apply flex items-start justify-between mb-8;
	}

	.header-content {
		@apply text-center flex-1;
	}

	.app-title {
		@apply text-3xl font-bold text-gray-900;
	}

	:global(.dark) .app-title {
		@apply text-white;
	}

	.app-subtitle {
		@apply text-gray-600 mt-1;
	}

	:global(.dark) .app-subtitle {
		@apply text-gray-400;
	}

	/* Settings button */
	.settings-btn {
		@apply p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500;
	}

	:global(.dark) .settings-btn {
		@apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
	}

	.settings-icon {
		@apply w-6 h-6;
	}

	.app-content {
		@apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
	}

	:global(.dark) .app-content {
		@apply bg-gray-800 border-gray-700;
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

	.secondary-controls {
		@apply flex items-center gap-3;
	}

	.btn-note {
		@apply flex items-center gap-1.5;
		@apply bg-amber-100 text-amber-700 hover:bg-amber-200;
		@apply focus:ring-amber-500;
	}

	.btn-notes-view {
		@apply flex items-center gap-1.5;
		@apply bg-gray-100 text-gray-700 hover:bg-gray-200;
		@apply focus:ring-gray-500;
	}

	.note-icon {
		@apply w-4 h-4;
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

	.notes-view-overlay {
		@apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
	}

	/* Analytics overlay (006-analytics-dashboard) */
	.analytics-overlay {
		@apply fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4;
	}

	.analytics-panel {
		@apply bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden;
	}
</style>
