/**
 * Tab Sync Service
 *
 * Feature: 002-day-tracking
 * Purpose: Multi-tab coordination using BroadcastChannel API
 *          with localStorage fallback for leadership election.
 *
 * Ensures only one browser tab actively controls the timer to prevent
 * conflicts and data corruption.
 */

import {
	STORAGE_KEY_TAB,
	TAB_STALE_THRESHOLD_MS,
	TAB_HEARTBEAT_INTERVAL_MS
} from '$lib/types';
import type { TabInfo } from '$lib/types';

/**
 * Message types for cross-tab communication
 */
interface TabMessage {
	type: 'TAB_ACTIVE' | 'TAB_RELEASED';
	tabId: string;
}

/**
 * Tab sync service interface
 */
export interface TabSyncService {
	claimLeadership(): boolean;
	isLeader(): boolean;
	releaseLeadership(): void;
	onLeadershipChange(callback: (isLeader: boolean) => void): () => void;
	getLeaderInfo(): { tabId: string; activeSince: number } | null;
	destroy(): void;
}

/**
 * Generate a unique tab ID
 */
function generateTabId(): string {
	return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new tab sync service instance.
 *
 * Uses BroadcastChannel for real-time cross-tab messaging and
 * localStorage for leadership persistence and stale detection.
 *
 * @example
 * ```typescript
 * const tabSync = createTabSync();
 *
 * if (tabSync.claimLeadership()) {
 *   // This tab is the leader, enable timer controls
 * }
 *
 * tabSync.onLeadershipChange((isLeader) => {
 *   if (!isLeader) {
 *     // Another tab took over, disable controls
 *   }
 * });
 * ```
 */
export function createTabSync(): TabSyncService {
	const tabId = generateTabId();
	let isLeaderTab = false;
	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	const subscribers: Set<(isLeader: boolean) => void> = new Set();

	// Create BroadcastChannel for cross-tab communication
	// Wrapped in try-catch for browsers that don't support it (rare but possible)
	let channel: BroadcastChannel | null = null;
	try {
		channel = new BroadcastChannel('tm_tab_sync');
	} catch (error) {
		console.warn('BroadcastChannel not supported, tab sync disabled:', error);
	}

	/**
	 * Read current leader info from localStorage
	 */
	function readLeaderInfo(): TabInfo | null {
		try {
			const stored = localStorage.getItem(STORAGE_KEY_TAB);
			if (!stored) return null;
			return JSON.parse(stored) as TabInfo;
		} catch {
			return null;
		}
	}

	/**
	 * Write leader info to localStorage
	 */
	function writeLeaderInfo(info: TabInfo): void {
		try {
			localStorage.setItem(STORAGE_KEY_TAB, JSON.stringify(info));
		} catch (error) {
			console.error('Failed to write tab info:', error);
		}
	}

	/**
	 * Clear leader info from localStorage
	 */
	function clearLeaderInfo(): void {
		try {
			localStorage.removeItem(STORAGE_KEY_TAB);
		} catch (error) {
			console.error('Failed to clear tab info:', error);
		}
	}

	/**
	 * Check if existing leader is stale (no heartbeat for threshold duration)
	 */
	function isLeaderStale(info: TabInfo): boolean {
		return Date.now() - info.lastHeartbeat > TAB_STALE_THRESHOLD_MS;
	}

	/**
	 * Notify all subscribers of leadership change
	 */
	function notifySubscribers(isLeader: boolean): void {
		subscribers.forEach((callback) => callback(isLeader));
	}

	/**
	 * Start heartbeat interval to maintain leadership
	 */
	function startHeartbeat(): void {
		if (heartbeatInterval) return;

		heartbeatInterval = setInterval(() => {
			if (isLeaderTab) {
				const info: TabInfo = {
					tabId,
					activeSince: readLeaderInfo()?.activeSince ?? Date.now(),
					lastHeartbeat: Date.now()
				};
				writeLeaderInfo(info);
			}
		}, TAB_HEARTBEAT_INTERVAL_MS);
	}

	/**
	 * Stop heartbeat interval
	 */
	function stopHeartbeat(): void {
		if (heartbeatInterval) {
			clearInterval(heartbeatInterval);
			heartbeatInterval = null;
		}
	}

	/**
	 * Handle incoming messages from other tabs
	 */
	function handleMessage(event: MessageEvent<TabMessage>): void {
		const { type, tabId: messageTabId } = event.data;

		if (type === 'TAB_ACTIVE' && messageTabId !== tabId) {
			// Another tab claimed leadership
			if (isLeaderTab) {
				isLeaderTab = false;
				stopHeartbeat();
				notifySubscribers(false);
			}
		}
	}

	// Set up message listener (if channel is available)
	if (channel) {
		channel.onmessage = handleMessage;
	}

	return {
		/**
		 * Claim leadership for this tab.
		 *
		 * @returns True if this tab is now the leader
		 */
		claimLeadership(): boolean {
			const currentLeader = readLeaderInfo();

			// Can claim if no leader or current leader is stale
			if (!currentLeader || isLeaderStale(currentLeader) || currentLeader.tabId === tabId) {
				const info: TabInfo = {
					tabId,
					activeSince: currentLeader?.tabId === tabId ? currentLeader.activeSince : Date.now(),
					lastHeartbeat: Date.now()
				};

				writeLeaderInfo(info);
				isLeaderTab = true;

				// Notify other tabs (if channel is available)
				const message: TabMessage = { type: 'TAB_ACTIVE', tabId };
				channel?.postMessage(message);

				// Start heartbeat to maintain leadership
				startHeartbeat();

				notifySubscribers(true);
				return true;
			}

			return false;
		},

		/**
		 * Check if this tab is currently the leader.
		 */
		isLeader(): boolean {
			return isLeaderTab;
		},

		/**
		 * Release leadership (e.g., when closing tab).
		 */
		releaseLeadership(): void {
			if (!isLeaderTab) return;

			isLeaderTab = false;
			stopHeartbeat();
			clearLeaderInfo();

			// Notify other tabs (if channel is available)
			const message: TabMessage = { type: 'TAB_RELEASED', tabId };
			channel?.postMessage(message);

			notifySubscribers(false);
		},

		/**
		 * Subscribe to leadership changes.
		 *
		 * @param callback - Called when leadership status changes
		 * @returns Unsubscribe function
		 */
		onLeadershipChange(callback: (isLeader: boolean) => void): () => void {
			subscribers.add(callback);
			return () => subscribers.delete(callback);
		},

		/**
		 * Get info about the current leader tab.
		 *
		 * @returns Leader tab info, or null if no leader
		 */
		getLeaderInfo(): { tabId: string; activeSince: number } | null {
			const info = readLeaderInfo();
			if (!info || isLeaderStale(info)) return null;
			return { tabId: info.tabId, activeSince: info.activeSince };
		},

		/**
		 * Clean up resources.
		 */
		destroy(): void {
			if (isLeaderTab) {
				clearLeaderInfo();
			}
			stopHeartbeat();
			channel?.close();
			subscribers.clear();
		}
	};
}
