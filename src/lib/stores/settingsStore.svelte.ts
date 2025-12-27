/**
 * Settings Store
 *
 * Feature: 008-settings
 * Task: T004 - Create settingsStore with Svelte 5 runes
 *
 * Manages user preference settings with persistence to localStorage.
 * Uses Svelte 5 runes for reactive state management.
 */

import type { Settings, Theme, SettingsStorage } from '$lib/types';
import { DEFAULT_SETTINGS, STORAGE_KEY_SETTINGS } from '$lib/types';
import { applyTheme } from '$lib/services/theme';

// =============================================================================
// State
// =============================================================================

let settings = $state<Settings>({ ...DEFAULT_SETTINGS });
let isPanelOpen = $state(false);
let lastError = $state<string | null>(null);

// =============================================================================
// Helpers
// =============================================================================

/**
 * Validate and clamp warning threshold to valid range (0-1800 seconds)
 */
function validateWarningThreshold(seconds: number): number {
	return Math.max(0, Math.min(1800, Math.floor(seconds)));
}

/**
 * Validate and clamp fixed task alert to valid range (0-30 minutes)
 */
function validateFixedTaskAlert(minutes: number): number {
	return Math.max(0, Math.min(30, Math.floor(minutes)));
}

/**
 * Validate theme value
 */
function validateTheme(theme: string): Theme {
	if (theme === 'light' || theme === 'dark' || theme === 'system') {
		return theme;
	}
	return 'system';
}

// =============================================================================
// Store Implementation
// =============================================================================

function createSettingsStore() {
	return {
		// -------------------------------------------------------------------------
		// Readable State (getters)
		// -------------------------------------------------------------------------

		get settings(): Settings {
			return settings;
		},

		get theme(): Theme {
			return settings.theme;
		},

		get warningThresholdSec(): number {
			return settings.warningThresholdSec;
		},

		get fixedTaskAlertMin(): number {
			return settings.fixedTaskAlertMin;
		},

		get soundEnabled(): boolean {
			return settings.soundEnabled;
		},

		get vibrationEnabled(): boolean {
			return settings.vibrationEnabled;
		},

		get isPanelOpen(): boolean {
			return isPanelOpen;
		},

		get lastError(): string | null {
			return lastError;
		},

		// -------------------------------------------------------------------------
		// Panel Actions
		// -------------------------------------------------------------------------

		/**
		 * Open the settings panel
		 */
		openPanel(): void {
			isPanelOpen = true;
		},

		/**
		 * Close the settings panel
		 */
		closePanel(): void {
			isPanelOpen = false;
		},

		/**
		 * Toggle the settings panel
		 */
		togglePanel(): void {
			isPanelOpen = !isPanelOpen;
		},

		// -------------------------------------------------------------------------
		// Settings Actions
		// -------------------------------------------------------------------------

		/**
		 * Set the theme preference
		 * @param theme - 'light', 'dark', or 'system'
		 */
		setTheme(theme: Theme): void {
			settings.theme = validateTheme(theme);
			// T018: Apply theme immediately
			applyTheme(settings.theme);
			this._persist();
		},

		/**
		 * Set the warning threshold in seconds
		 * @param seconds - 0-1800 (0-30 minutes)
		 */
		setWarningThreshold(seconds: number): void {
			settings.warningThresholdSec = validateWarningThreshold(seconds);
			this._persist();
		},

		/**
		 * Set the warning threshold from minutes input
		 * @param minutes - 0-30 minutes
		 */
		setWarningThresholdMinutes(minutes: number): void {
			const seconds = Math.floor(minutes) * 60;
			this.setWarningThreshold(seconds);
		},

		/**
		 * Set the fixed task alert time in minutes
		 * @param minutes - 0-30 minutes
		 */
		setFixedTaskAlert(minutes: number): void {
			settings.fixedTaskAlertMin = validateFixedTaskAlert(minutes);
			this._persist();
		},

		/**
		 * Set whether sound alerts are enabled
		 * @param enabled - true to enable, false to disable
		 */
		setSoundEnabled(enabled: boolean): void {
			settings.soundEnabled = enabled;
			this._persist();
		},

		/**
		 * Set whether vibration alerts are enabled
		 * @param enabled - true to enable, false to disable
		 */
		setVibrationEnabled(enabled: boolean): void {
			settings.vibrationEnabled = enabled;
			this._persist();
		},

		// -------------------------------------------------------------------------
		// Persistence
		// -------------------------------------------------------------------------

		/**
		 * Load settings from localStorage
		 * @returns true if settings were loaded, false if using defaults
		 */
		load(): boolean {
			try {
				const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
				if (!stored) {
					return false;
				}

				const parsed = JSON.parse(stored) as SettingsStorage;

				// Validate and apply stored settings
				settings = {
					theme: validateTheme(parsed.data?.theme ?? 'system'),
					warningThresholdSec: validateWarningThreshold(parsed.data?.warningThresholdSec ?? 300),
					fixedTaskAlertMin: validateFixedTaskAlert(parsed.data?.fixedTaskAlertMin ?? 10),
					soundEnabled: parsed.data?.soundEnabled ?? true,
					vibrationEnabled: parsed.data?.vibrationEnabled ?? true,
					defaultScheduleStartTime: parsed.data?.defaultScheduleStartTime ?? ''
				};

				lastError = null;
				return true;
			} catch (error) {
				console.error('Failed to load settings:', error);
				lastError = 'Failed to load settings';
				// Use defaults on error
				settings = { ...DEFAULT_SETTINGS };
				return false;
			}
		},

		/**
		 * Persist current settings to localStorage
		 * @returns true if successful, false on error
		 */
		_persist(): boolean {
			try {
				const storage: SettingsStorage = {
					version: 1,
					data: { ...settings }
				};
				localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(storage));
				lastError = null;
				return true;
			} catch (error) {
				console.error('Failed to save settings:', error);
				lastError = 'Failed to save settings. Storage may be full.';
				return false;
			}
		},

		/**
		 * Clear the last error
		 */
		clearError(): void {
			lastError = null;
		},

		/**
		 * Reset settings to defaults
		 */
		reset(): void {
			settings = { ...DEFAULT_SETTINGS };
			this._persist();
		}
	};
}

/**
 * The settings store singleton
 */
export const settingsStore = createSettingsStore();
