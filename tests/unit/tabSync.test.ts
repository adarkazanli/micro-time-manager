/**
 * Unit tests for tabSync service
 * Tests: leadership claim, heartbeat, BroadcastChannel messaging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEY_TAB, TAB_STALE_THRESHOLD_MS, TAB_HEARTBEAT_INTERVAL_MS } from '$lib/types';

describe('createTabSync', () => {
	let mockLocalStorage: { [key: string]: string };
	let mockBroadcastChannel: {
		postMessage: ReturnType<typeof vi.fn>;
		close: ReturnType<typeof vi.fn>;
		onmessage: ((event: { data: unknown }) => void) | null;
	};

	beforeEach(() => {
		vi.useFakeTimers();

		// Mock localStorage
		mockLocalStorage = {};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
			(key: string) => mockLocalStorage[key] || null
		);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
			mockLocalStorage[key] = value;
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
			delete mockLocalStorage[key];
		});

		// Mock BroadcastChannel
		mockBroadcastChannel = {
			postMessage: vi.fn(),
			close: vi.fn(),
			onmessage: null
		};
		// Use a class-like constructor for the mock
		vi.stubGlobal('BroadcastChannel', function () {
			return mockBroadcastChannel;
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	describe('leadership claim', () => {
		it('should claim leadership when no existing leader', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			const claimed = tabSync.claimLeadership();

			expect(claimed).toBe(true);
			expect(tabSync.isLeader()).toBe(true);

			tabSync.destroy();
		});

		it('should claim leadership when existing leader is stale', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			// Set up stale leader
			const staleTime = Date.now() - TAB_STALE_THRESHOLD_MS - 1000;
			mockLocalStorage[STORAGE_KEY_TAB] = JSON.stringify({
				tabId: 'old-tab',
				activeSince: staleTime,
				lastHeartbeat: staleTime
			});

			const tabSync = createTabSync();
			const claimed = tabSync.claimLeadership();

			expect(claimed).toBe(true);
			expect(tabSync.isLeader()).toBe(true);

			tabSync.destroy();
		});

		it('should not claim leadership when active leader exists', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			// Set up active leader
			mockLocalStorage[STORAGE_KEY_TAB] = JSON.stringify({
				tabId: 'active-tab',
				activeSince: Date.now(),
				lastHeartbeat: Date.now()
			});

			const tabSync = createTabSync();
			const claimed = tabSync.claimLeadership();

			expect(claimed).toBe(false);
			expect(tabSync.isLeader()).toBe(false);

			tabSync.destroy();
		});
	});

	describe('heartbeat', () => {
		it('should update heartbeat periodically when leader', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			tabSync.claimLeadership();

			const initialHeartbeat = JSON.parse(mockLocalStorage[STORAGE_KEY_TAB]).lastHeartbeat;

			// Advance time past heartbeat interval
			vi.advanceTimersByTime(TAB_HEARTBEAT_INTERVAL_MS + 100);

			const newHeartbeat = JSON.parse(mockLocalStorage[STORAGE_KEY_TAB]).lastHeartbeat;
			expect(newHeartbeat).toBeGreaterThan(initialHeartbeat);

			tabSync.destroy();
		});

		it('should stop heartbeat when leadership released', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			tabSync.claimLeadership();
			tabSync.releaseLeadership();

			expect(mockLocalStorage[STORAGE_KEY_TAB]).toBeUndefined();
			expect(tabSync.isLeader()).toBe(false);

			tabSync.destroy();
		});
	});

	describe('BroadcastChannel messaging', () => {
		it('should broadcast when claiming leadership', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			tabSync.claimLeadership();

			expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'TAB_ACTIVE'
				})
			);

			tabSync.destroy();
		});

		it('should notify subscribers when leadership changes', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			const callback = vi.fn();
			tabSync.onLeadershipChange(callback);

			tabSync.claimLeadership();
			expect(callback).toHaveBeenCalledWith(true);

			tabSync.releaseLeadership();
			expect(callback).toHaveBeenCalledWith(false);

			tabSync.destroy();
		});

		it('should handle message from another tab claiming leadership', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			tabSync.claimLeadership();

			const callback = vi.fn();
			tabSync.onLeadershipChange(callback);

			// Simulate message from another tab
			mockBroadcastChannel.onmessage?.({
				data: { type: 'TAB_ACTIVE', tabId: 'other-tab' }
			});

			// Our tab should no longer be leader
			expect(tabSync.isLeader()).toBe(false);
			expect(callback).toHaveBeenCalledWith(false);

			tabSync.destroy();
		});
	});

	describe('getLeaderInfo', () => {
		it('should return leader info when leader exists', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			tabSync.claimLeadership();

			const info = tabSync.getLeaderInfo();
			expect(info).not.toBeNull();
			expect(info?.tabId).toBeDefined();
			expect(info?.activeSince).toBeDefined();

			tabSync.destroy();
		});

		it('should return null when no leader', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			const info = tabSync.getLeaderInfo();

			expect(info).toBeNull();

			tabSync.destroy();
		});
	});

	describe('destroy', () => {
		it('should clean up resources on destroy', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			tabSync.claimLeadership();
			tabSync.destroy();

			expect(mockBroadcastChannel.close).toHaveBeenCalled();
		});
	});

	describe('unsubscribe', () => {
		it('should allow unsubscribing from leadership changes', async () => {
			const { createTabSync } = await import('$lib/services/tabSync');

			const tabSync = createTabSync();
			const callback = vi.fn();
			const unsubscribe = tabSync.onLeadershipChange(callback);

			tabSync.claimLeadership();
			expect(callback).toHaveBeenCalledTimes(1);

			unsubscribe();

			tabSync.releaseLeadership();
			expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again

			tabSync.destroy();
		});
	});
});
