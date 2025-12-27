<script lang="ts">
	/**
	 * SettingsPanel Component
	 *
	 * Feature: 008-settings
	 * Tasks: T008-T014 (US1), T007a (error feedback)
	 *
	 * Slide-out panel for user settings configuration.
	 * Anchored to right edge with overlay backdrop.
	 */
	import { settingsStore } from '$lib/stores/settingsStore.svelte';
	import type { Theme, ExportResult } from '$lib/types';

	// Props
	interface Props {
		open: boolean;
		onClose: () => void;
		onAnalytics?: () => void;
		onExportExcel?: () => ExportResult;
		onExportCSV?: () => ExportResult;
		onExportTemplate?: () => ExportResult;
		onStartNewDay?: () => void;
		hasSession?: boolean;
	}

	let { open, onClose, onAnalytics, onExportExcel, onExportCSV, onExportTemplate, onStartNewDay, hasSession = false }: Props = $props();

	// New day confirmation state
	let showNewDayConfirm = $state(false);

	// Export state
	let exportError = $state<string | null>(null);

	function handleExportExcel() {
		if (!onExportExcel) return;
		const result = onExportExcel();
		if (!result.success) {
			exportError = result.error || 'Export failed';
		} else {
			exportError = null;
		}
	}

	function handleExportCSV() {
		if (!onExportCSV) return;
		const result = onExportCSV();
		if (!result.success) {
			exportError = result.error || 'Export failed';
		} else {
			exportError = null;
		}
	}

	function handleExportTemplate() {
		if (!onExportTemplate) return;
		const result = onExportTemplate();
		if (!result.success) {
			exportError = result.error || 'Export failed';
		} else {
			exportError = null;
		}
	}

	function handleAnalytics() {
		if (onAnalytics) {
			onAnalytics();
			onClose();
		}
	}

	// New day handlers
	function handleStartNewDayClick() {
		showNewDayConfirm = true;
	}

	function handleExportAndStartNew() {
		// Export to Excel first
		if (onExportExcel) {
			const result = onExportExcel();
			if (!result.success) {
				exportError = result.error || 'Export failed';
				showNewDayConfirm = false;
				return;
			}
		}
		// Then start new day
		showNewDayConfirm = false;
		if (onStartNewDay) {
			onStartNewDay();
			onClose();
		}
	}

	function handleStartNewWithoutExport() {
		showNewDayConfirm = false;
		if (onStartNewDay) {
			onStartNewDay();
			onClose();
		}
	}

	function handleCancelNewDay() {
		showNewDayConfirm = false;
	}

	// Local refs
	let panelRef: HTMLDivElement | null = $state(null);

	// Handle click outside to close
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Handle Escape key to close
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			onClose();
		}
	}

	// Focus panel when opened
	$effect(() => {
		if (open && panelRef) {
			panelRef.focus();
		}
	});

	// Theme change handler
	function handleThemeChange(theme: Theme) {
		settingsStore.setTheme(theme);
	}

	// Warning threshold handler (minutes input)
	function handleWarningChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const minutes = parseInt(input.value, 10);
		if (!isNaN(minutes)) {
			settingsStore.setWarningThresholdMinutes(minutes);
		}
	}

	// Fixed task alert handler
	function handleFixedAlertChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const minutes = parseInt(input.value, 10);
		if (!isNaN(minutes)) {
			settingsStore.setFixedTaskAlert(minutes);
		}
	}

	// Sound toggle handler
	function handleSoundToggle() {
		settingsStore.setSoundEnabled(!settingsStore.soundEnabled);
	}

	// Vibration toggle handler
	function handleVibrationToggle() {
		settingsStore.setVibrationEnabled(!settingsStore.vibrationEnabled);
	}

	// Clear error handler
	function handleClearError() {
		settingsStore.clearError();
	}

	// Derived values for display
	const warningMinutes = $derived(Math.floor(settingsStore.warningThresholdSec / 60));

	// Check vibration support
	const canVibrate = $derived(typeof navigator !== 'undefined' && 'vibrate' in navigator);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop overlay -->
	<div
		class="settings-backdrop"
		onclick={handleBackdropClick}
		role="presentation"
		data-testid="settings-backdrop"
	>
		<!-- Panel -->
		<div
			bind:this={panelRef}
			class="settings-panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-title"
			tabindex="-1"
			data-testid="settings-panel"
		>
			<!-- Header -->
			<div class="settings-header">
				<h2 id="settings-title" class="settings-title">Settings</h2>
				<button
					type="button"
					class="close-btn"
					onclick={onClose}
					aria-label="Close settings"
					data-testid="settings-close-btn"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="close-icon">
						<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
					</svg>
				</button>
			</div>

			<!-- Error toast (T007a) -->
			{#if settingsStore.lastError}
				<div class="error-toast" role="alert" data-testid="settings-error">
					<span class="error-message">{settingsStore.lastError}</span>
					<button type="button" class="error-dismiss" onclick={handleClearError}>
						Dismiss
					</button>
				</div>
			{/if}

			<!-- Content -->
			<div class="settings-content">
				<!-- Theme Section -->
				<section class="settings-section" data-testid="theme-section">
					<h3 class="section-title">Theme</h3>
					<div class="theme-options">
						<label class="theme-option">
							<input
								type="radio"
								name="theme"
								value="light"
								checked={settingsStore.theme === 'light'}
								onchange={() => handleThemeChange('light')}
								data-testid="theme-light"
							/>
							<span class="theme-label">Light</span>
						</label>
						<label class="theme-option">
							<input
								type="radio"
								name="theme"
								value="dark"
								checked={settingsStore.theme === 'dark'}
								onchange={() => handleThemeChange('dark')}
								data-testid="theme-dark"
							/>
							<span class="theme-label">Dark</span>
						</label>
						<label class="theme-option">
							<input
								type="radio"
								name="theme"
								value="system"
								checked={settingsStore.theme === 'system'}
								onchange={() => handleThemeChange('system')}
								data-testid="theme-system"
							/>
							<span class="theme-label">System</span>
						</label>
					</div>
				</section>

				<!-- Alerts Section -->
				<section class="settings-section" data-testid="alerts-section">
					<h3 class="section-title">Alerts</h3>

					<!-- Warning threshold -->
					<div class="setting-row">
						<label for="warning-threshold" class="setting-label">
							Task warning
							<span class="setting-hint">Minutes before task ends</span>
						</label>
						<input
							type="number"
							id="warning-threshold"
							min="0"
							max="30"
							value={warningMinutes}
							onchange={handleWarningChange}
							class="setting-input"
							data-testid="warning-threshold-input"
						/>
					</div>

					<!-- Fixed task alert -->
					<div class="setting-row">
						<label for="fixed-alert" class="setting-label">
							Fixed task alert
							<span class="setting-hint">Minutes before fixed task starts</span>
						</label>
						<input
							type="number"
							id="fixed-alert"
							min="0"
							max="30"
							value={settingsStore.fixedTaskAlertMin}
							onchange={handleFixedAlertChange}
							class="setting-input"
							data-testid="fixed-alert-input"
						/>
					</div>

					<!-- Sound toggle -->
					<div class="setting-row">
						<label for="sound-toggle" class="setting-label">
							Sound alerts
							<span class="setting-hint">Play audio on warnings</span>
						</label>
						<button
							type="button"
							id="sound-toggle"
							role="switch"
							aria-checked={settingsStore.soundEnabled}
							onclick={handleSoundToggle}
							class="toggle-btn"
							class:active={settingsStore.soundEnabled}
							data-testid="sound-toggle"
						>
							<span class="toggle-track">
								<span class="toggle-thumb"></span>
							</span>
						</button>
					</div>

					<!-- Vibration toggle (only show if supported) -->
					{#if canVibrate}
						<div class="setting-row">
							<label for="vibration-toggle" class="setting-label">
								Vibration alerts
								<span class="setting-hint">Vibrate on warnings (mobile)</span>
							</label>
							<button
								type="button"
								id="vibration-toggle"
								role="switch"
								aria-checked={settingsStore.vibrationEnabled}
								onclick={handleVibrationToggle}
								class="toggle-btn"
								class:active={settingsStore.vibrationEnabled}
								data-testid="vibration-toggle"
							>
								<span class="toggle-track">
									<span class="toggle-thumb"></span>
								</span>
							</button>
						</div>
					{/if}
				</section>

				<!-- Data Section -->
				<section class="settings-section" data-testid="data-section">
					<h3 class="section-title">Data</h3>

					<!-- Analytics button -->
					<div class="setting-row">
						<div class="setting-label">
							Analytics
							<span class="setting-hint">View session statistics</span>
						</div>
						<button
							type="button"
							class="action-btn action-btn-analytics"
							onclick={handleAnalytics}
							disabled={!hasSession}
							data-testid="settings-analytics-btn"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="action-icon">
								<path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
							</svg>
							View
						</button>
					</div>

					<!-- Export row -->
					<div class="setting-row">
						<div class="setting-label">
							Export
							<span class="setting-hint">Download session data</span>
						</div>
						<div class="export-buttons">
							<button
								type="button"
								class="action-btn action-btn-export"
								onclick={handleExportExcel}
								disabled={!hasSession}
								data-testid="settings-export-excel-btn"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="action-icon">
									<path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
									<path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
								</svg>
								Excel
							</button>
							<button
								type="button"
								class="action-btn action-btn-export"
								onclick={handleExportCSV}
								disabled={!hasSession}
								data-testid="settings-export-csv-btn"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="action-icon">
									<path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
									<path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
								</svg>
								CSV
							</button>
							<button
								type="button"
								class="action-btn action-btn-template"
								onclick={handleExportTemplate}
								disabled={!hasSession}
								data-testid="settings-export-template-btn"
								title="Export as re-importable template"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="action-icon">
									<path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
									<path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
								</svg>
								Template
							</button>
						</div>
					</div>

					<!-- Export error message -->
					{#if exportError}
						<div class="export-error" role="alert">
							{exportError}
						</div>
					{/if}

					<!-- Start New Day row -->
					<div class="setting-row">
						<div class="setting-label">
							Start New Day
							<span class="setting-hint">Clear current session and start fresh</span>
						</div>
						<button
							type="button"
							class="action-btn action-btn-newday"
							onclick={handleStartNewDayClick}
							disabled={!hasSession}
							data-testid="settings-newday-btn"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="action-icon">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clip-rule="evenodd" />
							</svg>
							New Day
						</button>
					</div>
				</section>
			</div>

			<!-- New Day Confirmation Dialog -->
			{#if showNewDayConfirm}
				<div class="confirm-overlay" data-testid="newday-confirm">
					<div class="confirm-dialog">
						<h3 class="confirm-title">Start New Day?</h3>
						<p class="confirm-message">
							Would you like to download your current session data before starting fresh?
						</p>
						<div class="confirm-actions">
							<button
								type="button"
								class="confirm-btn confirm-btn-secondary"
								onclick={handleCancelNewDay}
							>
								Cancel
							</button>
							<button
								type="button"
								class="confirm-btn confirm-btn-warning"
								onclick={handleStartNewWithoutExport}
							>
								Skip Export
							</button>
							<button
								type="button"
								class="confirm-btn confirm-btn-primary"
								onclick={handleExportAndStartNew}
							>
								Export & Start
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@import 'tailwindcss';

	.settings-backdrop {
		@apply fixed inset-0 bg-black/50 z-50;
		@apply flex justify-end;
	}

	.settings-panel {
		@apply bg-white w-80 max-w-full h-full;
		@apply flex flex-col;
		@apply shadow-xl;
		@apply outline-none;
		animation: slide-in 0.2s ease-out;
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	/* Dark mode support */
	:global(.dark) .settings-panel {
		@apply bg-gray-800;
	}

	.settings-header {
		@apply flex items-center justify-between;
		@apply px-4 py-3 border-b border-gray-200;
	}

	:global(.dark) .settings-header {
		@apply border-gray-700;
	}

	.settings-title {
		@apply text-lg font-semibold text-gray-900;
	}

	:global(.dark) .settings-title {
		@apply text-white;
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

	/* Error toast */
	.error-toast {
		@apply mx-4 mt-3 p-3 rounded-lg;
		@apply bg-red-50 border border-red-200;
		@apply flex items-center justify-between gap-2;
	}

	:global(.dark) .error-toast {
		@apply bg-red-900/30 border-red-800;
	}

	.error-message {
		@apply text-sm text-red-700;
	}

	:global(.dark) .error-message {
		@apply text-red-300;
	}

	.error-dismiss {
		@apply text-xs text-red-600 hover:text-red-800 underline;
		@apply focus:outline-none focus:ring-1 focus:ring-red-500;
	}

	:global(.dark) .error-dismiss {
		@apply text-red-400 hover:text-red-200;
	}

	.settings-content {
		@apply flex-1 overflow-y-auto p-4;
	}

	.settings-section {
		@apply mb-6;
	}

	.settings-section:last-child {
		@apply mb-0;
	}

	.section-title {
		@apply text-sm font-medium text-gray-500 uppercase tracking-wide mb-3;
	}

	:global(.dark) .section-title {
		@apply text-gray-400;
	}

	/* Theme options */
	.theme-options {
		@apply flex gap-2;
	}

	.theme-option {
		@apply flex-1;
	}

	.theme-option input {
		@apply sr-only;
	}

	.theme-label {
		@apply block text-center py-2 px-3 rounded-lg text-sm font-medium;
		@apply border border-gray-200 cursor-pointer;
		@apply text-gray-700 bg-white;
		@apply hover:bg-gray-50 transition-colors duration-150;
	}

	:global(.dark) .theme-label {
		@apply border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600;
	}

	.theme-option input:checked + .theme-label {
		@apply border-blue-500 bg-blue-50 text-blue-700;
	}

	:global(.dark) .theme-option input:checked + .theme-label {
		@apply border-blue-400 bg-blue-900/30 text-blue-300;
	}

	.theme-option input:focus + .theme-label {
		@apply ring-2 ring-blue-500 ring-offset-2;
	}

	:global(.dark) .theme-option input:focus + .theme-label {
		@apply ring-offset-gray-800;
	}

	/* Setting rows */
	.setting-row {
		@apply flex items-center justify-between py-3;
		@apply border-b border-gray-100;
	}

	:global(.dark) .setting-row {
		@apply border-gray-700;
	}

	.setting-row:last-child {
		@apply border-b-0;
	}

	.setting-label {
		@apply flex flex-col;
	}

	.setting-label {
		@apply text-sm font-medium text-gray-700;
	}

	:global(.dark) .setting-label {
		@apply text-gray-200;
	}

	.setting-hint {
		@apply text-xs text-gray-500 font-normal;
	}

	:global(.dark) .setting-hint {
		@apply text-gray-400;
	}

	.setting-input {
		@apply w-16 px-2 py-1 text-center text-sm;
		@apply border border-gray-300 rounded-md;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}

	:global(.dark) .setting-input {
		@apply bg-gray-700 border-gray-600 text-white;
		@apply focus:ring-blue-400 focus:border-blue-400;
	}

	/* Toggle button */
	.toggle-btn {
		@apply relative inline-flex items-center;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
	}

	:global(.dark) .toggle-btn {
		@apply focus:ring-offset-gray-800;
	}

	.toggle-track {
		@apply w-11 h-6 rounded-full;
		@apply bg-gray-200 transition-colors duration-200;
	}

	.toggle-btn.active .toggle-track {
		@apply bg-blue-600;
	}

	:global(.dark) .toggle-track {
		@apply bg-gray-600;
	}

	:global(.dark) .toggle-btn.active .toggle-track {
		@apply bg-blue-500;
	}

	.toggle-thumb {
		@apply absolute left-0.5 top-0.5;
		@apply w-5 h-5 rounded-full bg-white;
		@apply shadow-sm transition-transform duration-200;
	}

	.toggle-btn.active .toggle-thumb {
		@apply translate-x-5;
	}

	/* Action buttons */
	.action-btn {
		@apply flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.action-btn:disabled {
		@apply opacity-50 cursor-not-allowed;
	}

	.action-btn-analytics {
		@apply bg-indigo-100 text-indigo-700 hover:bg-indigo-200;
		@apply focus:ring-indigo-500;
	}

	:global(.dark) .action-btn-analytics {
		@apply bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60;
	}

	.action-btn-export {
		@apply bg-green-100 text-green-700 hover:bg-green-200;
		@apply focus:ring-green-500;
	}

	:global(.dark) .action-btn-export {
		@apply bg-green-900/40 text-green-300 hover:bg-green-900/60;
	}

	.action-btn-template {
		@apply bg-purple-100 text-purple-700 hover:bg-purple-200;
		@apply focus:ring-purple-500;
	}

	:global(.dark) .action-btn-template {
		@apply bg-purple-900/40 text-purple-300 hover:bg-purple-900/60;
	}

	.action-icon {
		@apply w-4 h-4;
	}

	.export-buttons {
		@apply flex flex-wrap gap-2;
	}

	.export-error {
		@apply mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded;
	}

	:global(.dark) .export-error {
		@apply text-red-300 bg-red-900/30;
	}

	/* New Day button */
	.action-btn-newday {
		@apply bg-orange-100 text-orange-700 hover:bg-orange-200;
		@apply focus:ring-orange-500;
	}

	:global(.dark) .action-btn-newday {
		@apply bg-orange-900/40 text-orange-300 hover:bg-orange-900/60;
	}

	/* Confirmation dialog overlay */
	.confirm-overlay {
		@apply absolute inset-0 bg-black/50 z-10;
		@apply flex items-center justify-center p-4;
	}

	.confirm-dialog {
		@apply bg-white rounded-lg shadow-xl p-5 max-w-sm w-full;
	}

	:global(.dark) .confirm-dialog {
		@apply bg-gray-800;
	}

	.confirm-title {
		@apply text-lg font-semibold text-gray-900 mb-2;
	}

	:global(.dark) .confirm-title {
		@apply text-white;
	}

	.confirm-message {
		@apply text-sm text-gray-600 mb-4;
	}

	:global(.dark) .confirm-message {
		@apply text-gray-300;
	}

	.confirm-actions {
		@apply flex flex-col sm:flex-row gap-2;
	}

	.confirm-btn {
		@apply flex-1 px-4 py-2 rounded-md text-sm font-medium;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
	}

	.confirm-btn-secondary {
		@apply bg-gray-100 text-gray-700 hover:bg-gray-200;
		@apply focus:ring-gray-500;
	}

	:global(.dark) .confirm-btn-secondary {
		@apply bg-gray-700 text-gray-300 hover:bg-gray-600;
	}

	.confirm-btn-warning {
		@apply bg-orange-100 text-orange-700 hover:bg-orange-200;
		@apply focus:ring-orange-500;
	}

	:global(.dark) .confirm-btn-warning {
		@apply bg-orange-900/40 text-orange-300 hover:bg-orange-900/60;
	}

	.confirm-btn-primary {
		@apply bg-blue-600 text-white hover:bg-blue-700;
		@apply focus:ring-blue-500;
	}

	:global(.dark) .confirm-btn-primary {
		@apply bg-blue-500 hover:bg-blue-600;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.settings-panel {
			@apply w-full;
		}
	}
</style>
