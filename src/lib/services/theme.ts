/**
 * Theme Service
 *
 * Feature: 008-settings
 * Tasks: T015, T019, T032, T037
 *
 * Manages theme application to the DOM and system preference detection.
 */

import type { Theme } from '$lib/types';

// Store reference to media query listener for cleanup
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;
let mediaQuery: MediaQueryList | null = null;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): 'light' | 'dark' {
	if (!isBrowser()) return 'light';

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the theme to the document
 * @param theme - The theme to apply ('light', 'dark', or 'system')
 */
export function applyTheme(theme: Theme): void {
	if (!isBrowser()) return;

	const html = document.documentElement;

	if (theme === 'system') {
		// For system theme, check the actual preference
		const systemPrefersDark = getSystemTheme() === 'dark';
		if (systemPrefersDark) {
			html.classList.add('dark');
		} else {
			html.classList.remove('dark');
		}
	} else if (theme === 'dark') {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}
}

/**
 * Initialize theme with system preference listener
 * @param theme - The initial theme setting
 * @param onSystemChange - Optional callback when system theme changes (only called if theme is 'system')
 */
export function initTheme(theme: Theme, onSystemChange?: (isDark: boolean) => void): void {
	if (!isBrowser()) return;

	// Apply initial theme
	applyTheme(theme);

	// Set up system preference listener
	mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	// Remove any existing listener
	if (systemThemeListener && mediaQuery) {
		mediaQuery.removeEventListener('change', systemThemeListener);
	}

	// Create new listener
	systemThemeListener = (e: MediaQueryListEvent) => {
		// Only react if theme is set to 'system'
		// The caller should check this and call applyTheme as needed
		if (onSystemChange) {
			onSystemChange(e.matches);
		}
	};

	mediaQuery.addEventListener('change', systemThemeListener);
}

/**
 * Clean up theme listeners
 */
export function cleanupTheme(): void {
	if (mediaQuery && systemThemeListener) {
		mediaQuery.removeEventListener('change', systemThemeListener);
		systemThemeListener = null;
		mediaQuery = null;
	}
}

// =============================================================================
// Capability Detection (T032, T037)
// =============================================================================

/**
 * Check if the browser supports audio playback
 * @returns true if Audio API is available
 */
export function canPlayAudio(): boolean {
	if (!isBrowser()) return false;
	return typeof Audio !== 'undefined';
}

/**
 * Check if the device supports vibration
 * @returns true if vibration API is available
 */
export function canVibrate(): boolean {
	if (!isBrowser()) return false;
	return 'vibrate' in navigator;
}

// =============================================================================
// Alert Functions (T033, T039)
// =============================================================================

// Audio element for alert sound (reused)
const alertAudio: HTMLAudioElement | null = null;

/**
 * Play an alert sound if sound is enabled
 * @param enabled - Whether sound is enabled in settings
 */
export function playAlertSound(enabled: boolean): void {
	if (!enabled || !canPlayAudio()) return;

	try {
		// Create audio element if needed (use a simple beep)
		// In a real app, this would load from a sound file
		if (!alertAudio) {
			// Create a simple beep using Web Audio API as fallback
			const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
			if (AudioContext) {
				const ctx = new AudioContext();
				const oscillator = ctx.createOscillator();
				const gainNode = ctx.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(ctx.destination);

				oscillator.frequency.value = 800; // Hz
				oscillator.type = 'sine';

				gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

				oscillator.start(ctx.currentTime);
				oscillator.stop(ctx.currentTime + 0.3);
			}
		} else {
			alertAudio.currentTime = 0;
			alertAudio.play().catch(() => {
				// Ignore autoplay errors
			});
		}
	} catch {
		// Ignore audio errors
	}
}

/**
 * Trigger device vibration if vibration is enabled
 * @param enabled - Whether vibration is enabled in settings
 * @param pattern - Vibration pattern in milliseconds (default: 200ms)
 */
export function triggerVibration(enabled: boolean, pattern: number | number[] = 200): void {
	if (!enabled || !canVibrate()) return;

	try {
		navigator.vibrate(pattern);
	} catch {
		// Ignore vibration errors
	}
}
