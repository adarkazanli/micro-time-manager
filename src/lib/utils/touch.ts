/**
 * Touch Detection Utility
 *
 * Provides utilities for detecting touch devices and managing touch interactions.
 * Used for mobile-responsive features like tap-to-reveal and touch-and-hold drag.
 *
 * @module touch
 */

/**
 * Detects if the current device supports touch input.
 *
 * Uses feature detection rather than user agent sniffing for reliability.
 * Returns false during SSR (when window is undefined).
 *
 * @returns true if touch is supported, false otherwise
 *
 * @example
 * ```ts
 * if (isTouchDevice()) {
 *   // Show tap-to-reveal UI
 * } else {
 *   // Show hover-based UI
 * }
 * ```
 */
export function isTouchDevice(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Touch-and-hold delay in milliseconds.
 *
 * 500ms is the standard delay to differentiate between a tap/scroll
 * and an intentional drag operation on touch devices.
 */
export const TOUCH_HOLD_DELAY_MS = 500;

/**
 * Minimum touch target size in pixels.
 *
 * 44px is the WCAG 2.2 and Apple Human Interface Guidelines
 * recommended minimum for touch targets.
 */
export const MIN_TOUCH_TARGET_PX = 44;
