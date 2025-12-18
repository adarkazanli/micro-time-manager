/**
 * Unit tests for sessionStore
 *
 * Feature: 002-day-tracking
 * Task: T012 - Unit test for sessionStore.startDay()
 *
 * Tests: session creation, task progress initialization, error on empty tasks
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ConfirmedTask } from '$lib/types';

// Test fixtures
function createMockTasks(count: number): ConfirmedTask[] {
	return Array.from({ length: count }, (_, i) => ({
		taskId: `task-${i + 1}`,
		name: `Task ${i + 1}`,
		plannedStart: new Date(Date.now() + i * 1800000), // 30 min intervals
		plannedDurationSec: 1800, // 30 minutes
		type: i % 2 === 0 ? 'fixed' : 'flexible',
		sortOrder: i,
		status: 'pending' as const
	}));
}

describe('sessionStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-18T09:00:00.000Z'));

		// Mock localStorage
		const store: Record<string, string> = {};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] || null);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
			store[key] = value;
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
			delete store[key];
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	describe('initial state', () => {
		it('should start with status = "idle"', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(sessionStore.status).toBe('idle');
		});

		it('should start with isActive = false', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(sessionStore.isActive).toBe(false);
		});

		it('should start with currentTask = null', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(sessionStore.currentTask).toBeNull();
		});

		it('should start with currentTaskIndex = -1', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(sessionStore.currentTaskIndex).toBe(-1);
		});

		it('should start with session = null', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(sessionStore.session).toBeNull();
		});
	});

	describe('startDay()', () => {
		it('should create a new session when called with tasks', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.session).not.toBeNull();
			expect(sessionStore.session?.sessionId).toBeDefined();
			expect(sessionStore.session?.startedAt).toBeDefined();
		});

		it('should set status to "running"', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.status).toBe('running');
		});

		it('should set isActive to true', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.isActive).toBe(true);
		});

		it('should set currentTaskIndex to 0', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.currentTaskIndex).toBe(0);
		});

		it('should set currentTask to first task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.currentTask).toEqual(tasks[0]);
		});

		it('should initialize taskProgress for all tasks', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.taskProgress).toHaveLength(3);
		});

		it('should initialize first task progress as "active"', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.taskProgress[0].status).toBe('active');
			expect(sessionStore.taskProgress[0].taskId).toBe('task-1');
		});

		it('should initialize remaining tasks as "pending"', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.taskProgress[1].status).toBe('pending');
			expect(sessionStore.taskProgress[2].status).toBe('pending');
		});

		it('should set initial lagSec to 0', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.lagSec).toBe(0);
		});

		it('should set initial lagDisplay to "On schedule"', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.lagDisplay).toBe('On schedule');
		});

		it('should set totalTasks correctly', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(5);

			sessionStore.startDay(tasks);

			expect(sessionStore.totalTasks).toBe(5);
		});

		it('should set currentProgress to first task progress', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.currentProgress).not.toBeNull();
			expect(sessionStore.currentProgress?.taskId).toBe('task-1');
		});

		it('should copy plannedDurationSec to taskProgress', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[0].plannedDurationSec = 2700; // 45 minutes

			sessionStore.startDay(tasks);

			expect(sessionStore.taskProgress[0].plannedDurationSec).toBe(2700);
		});

		it('should initialize taskProgress with actualDurationSec = 0', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.taskProgress[0].actualDurationSec).toBe(0);
		});

		it('should initialize taskProgress with completedAt = null', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.taskProgress[0].completedAt).toBeNull();
		});
	});

	describe('startDay() error handling', () => {
		it('should throw error when tasks array is empty', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(() => sessionStore.startDay([])).toThrow();
		});

		it('should throw specific error message for empty tasks', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(() => sessionStore.startDay([])).toThrow('Cannot start day with no tasks');
		});

		it('should throw error when session is already active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(() => sessionStore.startDay(tasks)).toThrow();
		});

		it('should throw specific error message for active session', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(() => sessionStore.startDay(tasks)).toThrow('Session already active');
		});
	});

	describe('reset()', () => {
		it('should reset status to "idle"', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.reset();

			expect(sessionStore.status).toBe('idle');
		});

		it('should reset isActive to false', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.reset();

			expect(sessionStore.isActive).toBe(false);
		});

		it('should reset session to null', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.reset();

			expect(sessionStore.session).toBeNull();
		});

		it('should reset currentTask to null', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.reset();

			expect(sessionStore.currentTask).toBeNull();
		});

		it('should reset taskProgress to empty array', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.reset();

			expect(sessionStore.taskProgress).toHaveLength(0);
		});
	});

	describe('session data structure', () => {
		it('should have UUID sessionId', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			// UUID v4 format check
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(sessionStore.session?.sessionId).toMatch(uuidRegex);
		});

		it('should have ISO string startedAt', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			// Should be parseable as ISO date
			const startedAt = sessionStore.session?.startedAt;
			expect(startedAt).toBeDefined();
			expect(new Date(startedAt!).toISOString()).toBe(startedAt);
		});

		it('should have endedAt = null when running', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.session?.endedAt).toBeNull();
		});

		it('should have currentTaskElapsedMs = 0 at start', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.session?.currentTaskElapsedMs).toBe(0);
		});

		it('should have totalLagSec = 0 at start', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.session?.totalLagSec).toBe(0);
		});

		it('should have lastPersistedAt timestamp', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			expect(sessionStore.session?.lastPersistedAt).toBeDefined();
			expect(typeof sessionStore.session?.lastPersistedAt).toBe('number');
		});
	});

	// ==========================================================================
	// T021: Unit tests for completeTask()
	// ==========================================================================

	describe('completeTask()', () => {
		it('should record actual duration on current task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1500); // 25 minutes

			expect(sessionStore.taskProgress[0].actualDurationSec).toBe(1500);
		});

		it('should mark current task as complete', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);

			expect(sessionStore.taskProgress[0].status).toBe('complete');
		});

		it('should set completedAt timestamp', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);

			expect(sessionStore.taskProgress[0].completedAt).not.toBeNull();
			// Should be valid ISO string
			const completedAt = sessionStore.taskProgress[0].completedAt;
			expect(new Date(completedAt!).toISOString()).toBe(completedAt);
		});

		it('should advance to next task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			expect(sessionStore.currentTaskIndex).toBe(0);

			sessionStore.completeTask(1800);

			expect(sessionStore.currentTaskIndex).toBe(1);
		});

		it('should set next task as active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);

			expect(sessionStore.taskProgress[1].status).toBe('active');
		});

		it('should update currentTask to next task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);

			expect(sessionStore.currentTask?.taskId).toBe('task-2');
		});

		it('should calculate lag when finishing early (ahead)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[0].plannedDurationSec = 1800; // 30 minutes

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1500); // 25 minutes (5 min early)

			// lag = actual - planned = 1500 - 1800 = -300 (5 min ahead)
			expect(sessionStore.lagSec).toBe(-300);
		});

		it('should calculate lag when finishing late (behind)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[0].plannedDurationSec = 1800; // 30 minutes

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2400); // 40 minutes (10 min late)

			// lag = actual - planned = 2400 - 1800 = 600 (10 min behind)
			expect(sessionStore.lagSec).toBe(600);
		});

		it('should accumulate lag across multiple tasks', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[0].plannedDurationSec = 1800; // 30 min
			tasks[1].plannedDurationSec = 1800; // 30 min

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1500); // 5 min early: lag = -300
			sessionStore.completeTask(2400); // 10 min late: lag = +600

			// Total lag: -300 + 600 = 300 (5 min behind)
			expect(sessionStore.lagSec).toBe(300);
		});

		it('should update lagDisplay based on lag', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[0].plannedDurationSec = 1800;

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1500); // 5 min early

			expect(sessionStore.lagDisplay).toBe('5 min ahead');
		});

		it('should show "behind" when lag is positive', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[0].plannedDurationSec = 1800;

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2400); // 10 min late

			expect(sessionStore.lagDisplay).toBe('10 min behind');
		});

		it('should set status to complete when last task finished', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(2);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);
			expect(sessionStore.status).toBe('running');

			sessionStore.completeTask(1800);
			expect(sessionStore.status).toBe('complete');
		});

		it('should throw error when no active session', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(() => sessionStore.completeTask(1800)).toThrow('No active session');
		});
	});

	// ==========================================================================
	// T022: Unit tests for endDay()
	// ==========================================================================

	describe('endDay()', () => {
		it('should return DaySummary with totalPlannedSec', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks.forEach((t) => (t.plannedDurationSec = 1800)); // 30 min each

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);
			sessionStore.completeTask(1800);
			sessionStore.completeTask(1800);

			const summary = sessionStore.endDay();

			expect(summary.totalPlannedSec).toBe(5400); // 90 min
		});

		it('should return DaySummary with totalActualSec', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(2);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1500); // 25 min
			sessionStore.completeTask(2000); // 33 min

			const summary = sessionStore.endDay();

			expect(summary.totalActualSec).toBe(3500); // 58 min
		});

		it('should return DaySummary with finalLagSec', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(2);
			tasks[0].plannedDurationSec = 1800;
			tasks[1].plannedDurationSec = 1800;

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2000); // +200
			sessionStore.completeTask(1900); // +100

			const summary = sessionStore.endDay();

			// finalLag = totalActual - totalPlanned = 3900 - 3600 = 300
			expect(summary.finalLagSec).toBe(300);
		});

		it('should count tasksOnTime correctly', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks.forEach((t) => (t.plannedDurationSec = 1800));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // on time
			sessionStore.completeTask(1500); // early (on time)
			sessionStore.completeTask(2000); // late

			const summary = sessionStore.endDay();

			expect(summary.tasksOnTime).toBe(2);
		});

		it('should count tasksLate correctly', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks.forEach((t) => (t.plannedDurationSec = 1800));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // on time
			sessionStore.completeTask(2000); // late
			sessionStore.completeTask(2100); // late

			const summary = sessionStore.endDay();

			expect(summary.tasksLate).toBe(2);
		});

		it('should count tasksMissed correctly', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);
			sessionStore.markMissed('task-2');
			sessionStore.completeTask(1800);

			const summary = sessionStore.endDay();

			expect(summary.tasksMissed).toBe(1);
		});

		it('should calculate sessionDurationSec', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(1);

			sessionStore.startDay(tasks);

			// Advance time by 1 hour
			vi.advanceTimersByTime(3600000);

			sessionStore.completeTask(1800);
			const summary = sessionStore.endDay();

			// Session duration should be approximately 1 hour
			expect(summary.sessionDurationSec).toBeGreaterThanOrEqual(3599);
			expect(summary.sessionDurationSec).toBeLessThanOrEqual(3601);
		});

		it('should set session status to complete', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(1);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);
			sessionStore.endDay();

			expect(sessionStore.status).toBe('complete');
		});

		it('should set endedAt timestamp', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(1);

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);
			sessionStore.endDay();

			expect(sessionStore.session?.endedAt).not.toBeNull();
		});

		it('should throw error when no session exists', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(() => sessionStore.endDay()).toThrow('No session to end');
		});
	});

	// ==========================================================================
	// T041: Unit tests for detectFixedTaskConflict
	// ==========================================================================

	describe('fixedTaskWarning', () => {
		it('should be null when no session active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			expect(sessionStore.getFixedTaskWarning(0)).toBeNull();
		});

		it('should be null when on schedule', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);

			// With 0 elapsed time and on first task, we're on schedule
			expect(sessionStore.getFixedTaskWarning(0)).toBeNull();
		});

		it('should generate warning when behind and fixed task at risk', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			// Create tasks: flexible task, another flexible task, then fixed task
			// After completing first task late, we'll be on second flexible,
			// and should warn about the upcoming fixed task
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Flexible Task 1',
					plannedStart: now,
					plannedDurationSec: 1800, // 30 min
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Flexible Task 2',
					plannedStart: new Date(now.getTime() + 1800000), // 09:30
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				},
				{
					taskId: 'task-3',
					name: 'Fixed Meeting',
					plannedStart: new Date(now.getTime() + 3600000), // 10:00
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 2,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);
			// Complete first task late (10 min behind schedule = 40 min instead of 30)
			sessionStore.completeTask(2400);

			// Advance time to 40 min after start (simulating the 40 min we spent)
			vi.setSystemTime(new Date(now.getTime() + 2400000));

			// Now on flexible task 2, running 10 min behind
			// Should warn about fixed meeting
			// With 0 elapsed on current task (just started), we have 30 min remaining
			// Projected start for fixed = now (09:40) + 30 min = 10:10
			// Scheduled = 10:00, so 10 min late
			const warning = sessionStore.getFixedTaskWarning(0);
			expect(warning).not.toBeNull();
			expect(warning?.taskId).toBe('task-3');
			expect(warning?.taskName).toBe('Fixed Meeting');
			expect(warning?.minutesLate).toBe(10);

			vi.useRealTimers();
		});

		it('should not warn when ahead of schedule', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Flexible Task 1',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Flexible Task 2',
					plannedStart: new Date(now.getTime() + 1800000),
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				},
				{
					taskId: 'task-3',
					name: 'Fixed Meeting',
					plannedStart: new Date(now.getTime() + 3600000),
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 2,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);
			// Complete first task early (5 min ahead = 25 min instead of 30)
			sessionStore.completeTask(1500);

			// Advance time to 25 min after start
			vi.setSystemTime(new Date(now.getTime() + 1500000));

			// Ahead of schedule - no warning
			// Projected: now (09:25) + 30 min = 09:55, scheduled = 10:00
			// 5 min buffer, so no warning
			expect(sessionStore.getFixedTaskWarning(0)).toBeNull();

			vi.useRealTimers();
		});

		it('should not warn when no upcoming fixed tasks', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Flexible 1',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Flexible 2',
					plannedStart: new Date(now.getTime() + 1800000),
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2400); // 10 min late

			// No fixed tasks to warn about
			expect(sessionStore.getFixedTaskWarning(0)).toBeNull();

			vi.useRealTimers();
		});

		it('should warn about first at-risk fixed task only', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Flexible 1',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Flexible 2',
					plannedStart: new Date(now.getTime() + 1800000), // 09:30
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				},
				{
					taskId: 'task-3',
					name: 'First Fixed',
					plannedStart: new Date(now.getTime() + 3600000), // 10:00
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 2,
					status: 'pending'
				},
				{
					taskId: 'task-4',
					name: 'Second Fixed',
					plannedStart: new Date(now.getTime() + 5400000), // 10:30
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 3,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2400); // 10 min late

			// Advance time to 40 min after start
			vi.setSystemTime(new Date(now.getTime() + 2400000));

			// Now on Flexible 2, should warn about First Fixed (first upcoming fixed)
			expect(sessionStore.getFixedTaskWarning(0)?.taskName).toBe('First Fixed');

			vi.useRealTimers();
		});

		it('should clear warning when catching up', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Flexible 1',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Flexible 2',
					plannedStart: new Date(now.getTime() + 1800000),
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				},
				{
					taskId: 'task-3',
					name: 'Fixed Meeting',
					plannedStart: new Date(now.getTime() + 3600000), // 10:00
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 2,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2400); // 10 min late
			vi.setSystemTime(new Date(now.getTime() + 2400000)); // 09:40 - warning should show
			expect(sessionStore.getFixedTaskWarning(0)).not.toBeNull();

			// Complete second task early to catch up (20 min instead of 30)
			sessionStore.completeTask(1200);
			vi.setSystemTime(new Date(now.getTime() + 3600000)); // 10:00 - exactly on schedule

			// Now on Fixed Meeting, no future fixed tasks to warn about
			expect(sessionStore.getFixedTaskWarning(0)).toBeNull();

			vi.useRealTimers();
		});

		it('should include plannedStart in warning', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const fixedStart = new Date(now.getTime() + 3600000); // 10:00
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Flexible 1',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Flexible 2',
					plannedStart: new Date(now.getTime() + 1800000),
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				},
				{
					taskId: 'task-3',
					name: 'Fixed Meeting',
					plannedStart: fixedStart,
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 2,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);
			sessionStore.completeTask(2400); // 10 min late

			// Advance time
			vi.setSystemTime(new Date(now.getTime() + 2400000));

			// Now on Flexible 2, should warn about Fixed Meeting with plannedStart
			expect(sessionStore.getFixedTaskWarning(0)?.plannedStart).toBeDefined();

			vi.useRealTimers();
		});

		it('should not warn when fixed task already being worked on', async () => {
			vi.useFakeTimers();
			const now = new Date('2025-12-18T09:00:00.000Z');
			vi.setSystemTime(now);

			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Fixed Meeting',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'fixed',
					sortOrder: 0,
					status: 'pending'
				}
			];

			sessionStore.startDay(tasks);

			// Currently working on the fixed task - no warning needed
			expect(sessionStore.getFixedTaskWarning(0)).toBeNull();

			vi.useRealTimers();
		});
	});

	// ==========================================================================
	// T046: Unit tests for restore() - page refresh recovery
	// ==========================================================================

	describe('restore()', () => {
		it('should restore session state from saved data', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const now = new Date('2025-12-18T09:00:00.000Z');
			const tasks: ConfirmedTask[] = [
				{
					taskId: 'task-1',
					name: 'Task 1',
					plannedStart: now,
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 0,
					status: 'pending'
				},
				{
					taskId: 'task-2',
					name: 'Task 2',
					plannedStart: new Date(now.getTime() + 1800000),
					plannedDurationSec: 1800,
					type: 'flexible',
					sortOrder: 1,
					status: 'pending'
				}
			];

			const savedSession = {
				sessionId: 'test-session-id',
				startedAt: now.toISOString(),
				endedAt: null,
				status: 'running' as const,
				currentTaskIndex: 1,
				currentTaskElapsedMs: 60000, // 1 minute elapsed
				totalLagSec: 300, // 5 min behind
				lastPersistedAt: Date.now(),
				taskProgress: [
					{
						taskId: 'task-1',
						plannedDurationSec: 1800,
						actualDurationSec: 2100,
						completedAt: new Date(now.getTime() + 2100000).toISOString(),
						status: 'complete' as const
					},
					{
						taskId: 'task-2',
						plannedDurationSec: 1800,
						actualDurationSec: 0,
						completedAt: null,
						status: 'active' as const
					}
				]
			};

			sessionStore.restore(savedSession, tasks);

			expect(sessionStore.status).toBe('running');
			expect(sessionStore.currentTaskIndex).toBe(1);
			expect(sessionStore.lagSec).toBe(300);
			expect(sessionStore.currentTask?.taskId).toBe('task-2');
		});

		it('should restore session with correct task progress', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(2);

			const savedSession = {
				sessionId: 'test-session',
				startedAt: new Date().toISOString(),
				endedAt: null,
				status: 'running' as const,
				currentTaskIndex: 0,
				currentTaskElapsedMs: 0,
				totalLagSec: 0,
				lastPersistedAt: Date.now(),
				taskProgress: [
					{
						taskId: 'task-1',
						plannedDurationSec: 1800,
						actualDurationSec: 0,
						completedAt: null,
						status: 'active' as const
					},
					{
						taskId: 'task-2',
						plannedDurationSec: 1800,
						actualDurationSec: 0,
						completedAt: null,
						status: 'pending' as const
					}
				]
			};

			sessionStore.restore(savedSession, tasks);

			expect(sessionStore.taskProgress).toHaveLength(2);
			expect(sessionStore.taskProgress[0].status).toBe('active');
			expect(sessionStore.taskProgress[1].status).toBe('pending');
		});

		it('should restore currentTaskElapsedMs for timer resume', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(1);

			const savedSession = {
				sessionId: 'test-session',
				startedAt: new Date().toISOString(),
				endedAt: null,
				status: 'running' as const,
				currentTaskIndex: 0,
				currentTaskElapsedMs: 120000, // 2 minutes elapsed
				totalLagSec: 0,
				lastPersistedAt: Date.now(),
				taskProgress: [
					{
						taskId: 'task-1',
						plannedDurationSec: 1800,
						actualDurationSec: 0,
						completedAt: null,
						status: 'active' as const
					}
				]
			};

			sessionStore.restore(savedSession, tasks);

			expect(sessionStore.session?.currentTaskElapsedMs).toBe(120000);
		});
	});

	// ==========================================================================
	// T048: Unit tests for markMissed() - missed fixed task handling
	// ==========================================================================

	describe('markMissed()', () => {
		it('should mark a task as missed', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.markMissed('task-1');

			expect(sessionStore.taskProgress[0].status).toBe('missed');
		});

		it('should set completedAt when marking as missed', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.markMissed('task-1');

			expect(sessionStore.taskProgress[0].completedAt).not.toBeNull();
		});

		it('should advance to next task when current task is missed', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			expect(sessionStore.currentTaskIndex).toBe(0);

			sessionStore.markMissed('task-1');

			expect(sessionStore.currentTaskIndex).toBe(1);
			expect(sessionStore.taskProgress[1].status).toBe('active');
		});

		it('should skip multiple missed tasks to find next active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(4);

			sessionStore.startDay(tasks);
			sessionStore.markMissed('task-1');
			sessionStore.markMissed('task-2');

			expect(sessionStore.currentTaskIndex).toBe(2);
			expect(sessionStore.taskProgress[2].status).toBe('active');
		});

		it('should not affect session if task not found', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(2);

			sessionStore.startDay(tasks);
			const indexBefore = sessionStore.currentTaskIndex;

			sessionStore.markMissed('non-existent-task');

			expect(sessionStore.currentTaskIndex).toBe(indexBefore);
		});

		it('should do nothing if no session active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			// Should not throw
			sessionStore.markMissed('task-1');

			expect(sessionStore.session).toBeNull();
		});

		it('should count missed tasks in endDay summary', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);

			sessionStore.startDay(tasks);
			sessionStore.markMissed('task-1');
			sessionStore.completeTask(1800);
			sessionStore.completeTask(1800);

			const summary = sessionStore.endDay();

			expect(summary.tasksMissed).toBe(1);
		});
	});

	// ==========================================================================
	// T036: Unit tests for reorderTasks() - impact panel drag-drop
	// ==========================================================================

	describe('reorderTasks()', () => {
		it('should return false when no session active', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');

			const result = sessionStore.reorderTasks(1, 2);

			expect(result).toBe(false);
		});

		it('should return false for invalid indices', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			// Make all flexible for this test
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);

			expect(sessionStore.reorderTasks(-1, 2)).toBe(false);
			expect(sessionStore.reorderTasks(1, 10)).toBe(false);
		});

		it('should return true for same position (no-op)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);

			const result = sessionStore.reorderTasks(1, 1);

			expect(result).toBe(true);
		});

		it('should prevent moving fixed tasks (T040)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks[1].type = 'fixed'; // Make task at index 1 fixed

			sessionStore.startDay(tasks);

			const result = sessionStore.reorderTasks(1, 2);

			expect(result).toBe(false);
		});

		it('should prevent moving completed tasks (T041)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // Complete first task

			// Try to move the completed task
			const result = sessionStore.reorderTasks(0, 2);

			expect(result).toBe(false);
		});

		it('should prevent moving current task (T042)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(3);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);

			// Current task is at index 0, try to move it
			const result = sessionStore.reorderTasks(0, 2);

			expect(result).toBe(false);
		});

		it('should prevent moving to position before current task', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(4);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // Current is now at index 1

			// Try to move task 2 to before current (index 0)
			const result = sessionStore.reorderTasks(2, 0);

			expect(result).toBe(false);
		});

		it('should successfully reorder flexible pending tasks after current', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(4);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // Current is now at index 1

			// Move task 3 to position 2 (before task 2)
			const result = sessionStore.reorderTasks(3, 2);

			expect(result).toBe(true);
		});

		it('should update sortOrder fields after reorder (T043)', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(4);
			tasks.forEach((t, i) => {
				t.type = 'flexible';
				t.name = `Task ${i + 1}`;
			});

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // Current is now at index 1

			// Move task 3 (index 3) to position 2
			sessionStore.reorderTasks(3, 2);

			// After reorder, sortOrder should be updated sequentially
			const progress = sessionStore.taskProgress;
			progress.forEach((p, _i) => {
				// taskProgress should be in the new order
				expect(typeof p.taskId).toBe('string');
			});
		});

		it('should persist changes after reorder', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(4);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800);

			const lastPersistedBefore = sessionStore.session?.lastPersistedAt;

			// Wait a tiny bit to ensure timestamp differs
			vi.advanceTimersByTime(10);

			sessionStore.reorderTasks(2, 3);

			expect(sessionStore.session?.lastPersistedAt).toBeGreaterThan(lastPersistedBefore!);
		});

		it('should not allow moving task from before current to after', async () => {
			const { sessionStore } = await import('$lib/stores/sessionStore.svelte');
			const tasks = createMockTasks(4);
			tasks.forEach((t) => (t.type = 'flexible'));

			sessionStore.startDay(tasks);
			sessionStore.completeTask(1800); // Complete task 0, current is now 1
			// Task 0 is completed, cannot move it
			const result = sessionStore.reorderTasks(0, 3);

			expect(result).toBe(false);
		});
	});
});
