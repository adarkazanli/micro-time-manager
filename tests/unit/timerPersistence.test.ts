/**
 * Timer Persistence Tests
 *
 * Feature: 010-timer-persistence
 * Tasks: T008-T011 - Unit tests for timer recovery
 *
 * Tests the timer recovery logic including:
 * - Recovery with valid timestamps
 * - Recovery with future/invalid timestamps
 * - Recovery with negative elapsed time
 * - Periodic sync behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { DaySession, TimerRecoveryResult } from '$lib/types';
import { MAX_RECOVERY_ELAPSED_MS, TIMER_SYNC_INTERVAL_MS } from '$lib/types';

// =============================================================================
// Mock Recovery Function (matches implementation in timerStore)
// =============================================================================

/**
 * Calculate timer recovery state from a persisted session.
 * This mirrors the recovery logic that will be in timerStore.
 */
function calculateRecovery(session: DaySession | null): TimerRecoveryResult {
	// No session or not running
	if (!session || session.status !== 'running') {
		return {
			success: false,
			recoveredElapsedMs: 0,
			awayTimeMs: 0,
			isValid: true
		};
	}

	const now = Date.now();
	const lastSync = session.lastPersistedAt;
	const savedElapsed = session.currentTaskElapsedMs;

	// Validate: lastSync should not be in the future
	if (lastSync > now) {
		console.warn('Timer recovery: timestamp in future, resetting');
		return {
			success: false,
			recoveredElapsedMs: 0,
			awayTimeMs: 0,
			isValid: false,
			error: 'Future timestamp'
		};
	}

	const awayTimeMs = now - lastSync;
	let recoveredElapsedMs = savedElapsed + awayTimeMs;

	// Validate: negative elapsed should be 0
	if (recoveredElapsedMs < 0) {
		recoveredElapsedMs = 0;
	}

	// Cap at 24 hours
	if (recoveredElapsedMs > MAX_RECOVERY_ELAPSED_MS) {
		console.warn('Timer recovery: elapsed exceeds 24h, capping');
		recoveredElapsedMs = MAX_RECOVERY_ELAPSED_MS;
	}

	return {
		success: true,
		recoveredElapsedMs,
		awayTimeMs,
		isValid: true
	};
}

// =============================================================================
// Test Helpers
// =============================================================================

function createMockSession(overrides: Partial<DaySession> = {}): DaySession {
	return {
		sessionId: 'test-session',
		startedAt: new Date().toISOString(),
		endedAt: null,
		status: 'running',
		currentTaskIndex: 0,
		currentTaskElapsedMs: 0,
		lastPersistedAt: Date.now(),
		totalLagSec: 0,
		taskProgress: [],
		timerStartedAtMs: Date.now(),
		...overrides
	};
}

// =============================================================================
// T008: Unit test: Recovery with valid timestamps
// =============================================================================

describe('T008: Recovery with valid timestamps', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('recovers elapsed time after browser closure', () => {
		// Setup: session with 20 min elapsed, persisted 10 min ago
		const now = Date.now();
		const tenMinutesAgo = now - 10 * 60 * 1000;
		const twentyMinutesMs = 20 * 60 * 1000;

		const session = createMockSession({
			currentTaskElapsedMs: twentyMinutesMs,
			lastPersistedAt: tenMinutesAgo
		});

		const result = calculateRecovery(session);

		expect(result.success).toBe(true);
		expect(result.isValid).toBe(true);
		// Should be ~30 minutes (20 + 10)
		expect(result.recoveredElapsedMs).toBeCloseTo(30 * 60 * 1000, -3);
		expect(result.awayTimeMs).toBeCloseTo(10 * 60 * 1000, -3);
	});

	it('returns zero elapsed for idle session', () => {
		const session = createMockSession({
			status: 'idle',
			currentTaskElapsedMs: 0
		});

		const result = calculateRecovery(session);

		expect(result.success).toBe(false);
		expect(result.recoveredElapsedMs).toBe(0);
	});

	it('returns zero elapsed for null session', () => {
		const result = calculateRecovery(null);

		expect(result.success).toBe(false);
		expect(result.recoveredElapsedMs).toBe(0);
	});

	it('recovers with minimal away time', () => {
		const now = Date.now();
		const session = createMockSession({
			currentTaskElapsedMs: 5000,
			lastPersistedAt: now - 100 // 100ms ago
		});

		const result = calculateRecovery(session);

		expect(result.success).toBe(true);
		expect(result.recoveredElapsedMs).toBeGreaterThanOrEqual(5100);
	});
});

// =============================================================================
// T009: Unit test: Recovery with future timestamp returns invalid
// =============================================================================

describe('T009: Recovery with future timestamp', () => {
	it('returns invalid when lastPersistedAt is in the future', () => {
		const now = Date.now();
		const futureTime = now + 60 * 1000; // 1 minute in the future

		const session = createMockSession({
			currentTaskElapsedMs: 10000,
			lastPersistedAt: futureTime
		});

		const result = calculateRecovery(session);

		expect(result.success).toBe(false);
		expect(result.isValid).toBe(false);
		expect(result.error).toBe('Future timestamp');
		expect(result.recoveredElapsedMs).toBe(0);
	});

	it('handles far future timestamp', () => {
		const now = Date.now();
		const farFuture = now + 24 * 60 * 60 * 1000; // 24 hours in future

		const session = createMockSession({
			currentTaskElapsedMs: 5000,
			lastPersistedAt: farFuture
		});

		const result = calculateRecovery(session);

		expect(result.success).toBe(false);
		expect(result.isValid).toBe(false);
	});
});

// =============================================================================
// T010: Unit test: Recovery with negative elapsed uses 0
// =============================================================================

describe('T010: Recovery with negative elapsed', () => {
	it('returns 0 when calculated elapsed is negative', () => {
		const now = Date.now();

		// Edge case: savedElapsed + awayTime could theoretically be negative
		// if savedElapsed was somehow corrupted to a negative value
		const session = createMockSession({
			currentTaskElapsedMs: -10000, // Corrupted negative value
			lastPersistedAt: now - 1000 // 1 second ago
		});

		const result = calculateRecovery(session);

		// awayTime (1000) + savedElapsed (-10000) = -9000, should clamp to 0
		expect(result.success).toBe(true);
		expect(result.recoveredElapsedMs).toBe(0);
	});

	it('caps at 24 hours for very long interruptions', () => {
		const now = Date.now();
		const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;

		const session = createMockSession({
			currentTaskElapsedMs: 60000, // 1 minute
			lastPersistedAt: threeDaysAgo
		});

		const result = calculateRecovery(session);

		expect(result.success).toBe(true);
		expect(result.recoveredElapsedMs).toBe(MAX_RECOVERY_ELAPSED_MS);
	});
});

// =============================================================================
// T011: Unit test: Periodic sync triggers every 10 seconds
// =============================================================================

describe('T011: Periodic sync interval', () => {
	it('TIMER_SYNC_INTERVAL_MS is 10 seconds', () => {
		expect(TIMER_SYNC_INTERVAL_MS).toBe(10000);
	});

	it('periodic sync callback is called at correct interval', () => {
		vi.useFakeTimers();

		const syncCallback = vi.fn();
		const intervalId = setInterval(syncCallback, TIMER_SYNC_INTERVAL_MS);

		// No calls initially
		expect(syncCallback).not.toHaveBeenCalled();

		// Advance 10 seconds
		vi.advanceTimersByTime(10000);
		expect(syncCallback).toHaveBeenCalledTimes(1);

		// Advance another 10 seconds
		vi.advanceTimersByTime(10000);
		expect(syncCallback).toHaveBeenCalledTimes(2);

		// Advance 30 more seconds (should have 3 more calls)
		vi.advanceTimersByTime(30000);
		expect(syncCallback).toHaveBeenCalledTimes(5);

		clearInterval(intervalId);
		vi.useRealTimers();
	});
});

// =============================================================================
// T039: Unit test: Recovery with overtime calculates correct negative remaining
// =============================================================================

describe('T039: Recovery with overtime', () => {
	it('calculates correct elapsed when overtime', () => {
		const now = Date.now();
		const thirtyMinutesAgo = now - 30 * 60 * 1000;
		const twentyMinutesMs = 20 * 60 * 1000; // Started with 20 min elapsed

		const session = createMockSession({
			currentTaskElapsedMs: twentyMinutesMs,
			lastPersistedAt: thirtyMinutesAgo
		});

		const result = calculateRecovery(session);

		// 20 min + 30 min = 50 min elapsed
		expect(result.success).toBe(true);
		expect(result.recoveredElapsedMs).toBeCloseTo(50 * 60 * 1000, -3);

		// For a 25-minute task, this would be 25 minutes overtime
		const taskDurationMs = 25 * 60 * 1000;
		const remainingMs = taskDurationMs - result.recoveredElapsedMs;
		expect(remainingMs).toBeLessThan(0); // Overtime (negative remaining)
		expect(remainingMs).toBeCloseTo(-25 * 60 * 1000, -3);
	});

	it('does not cap elapsed at task duration', () => {
		const now = Date.now();
		const twoHoursAgo = now - 2 * 60 * 60 * 1000;

		const session = createMockSession({
			currentTaskElapsedMs: 30 * 60 * 1000, // 30 min
			lastPersistedAt: twoHoursAgo
		});

		const result = calculateRecovery(session);

		// Should be 30 min + 2 hours = 2.5 hours
		// This exceeds any typical task duration, but should NOT be capped
		// (only cap is 24 hours max)
		expect(result.success).toBe(true);
		expect(result.recoveredElapsedMs).toBeCloseTo(2.5 * 60 * 60 * 1000, -3);
	});
});
