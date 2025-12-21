# Research: Timer Persistence Across Browser/System Interruptions

**Feature**: 010-timer-persistence
**Date**: 2025-12-21

## Research Topics

### 1. Timer Persistence Strategy

**Question**: How should we persist timer state to survive browser closure and calculate elapsed time on recovery?

**Decision**: Wall-clock timestamp + elapsed time approach

**Rationale**:
- Store `timerStartedAt` (wall-clock timestamp) and `elapsedMsAtLastSync` at regular intervals
- On recovery, calculate: `currentElapsed = elapsedMsAtLastSync + (now - lastSyncTimestamp)`
- This approach handles both browser closure and computer sleep because wall-clock time (`Date.now()`) advances during sleep
- The existing `lastPersistedAt` field in `DaySession` already provides the sync timestamp

**Alternatives Considered**:
1. **Service Worker with Background Sync**: Would allow true background execution but adds complexity, requires HTTPS, and is overkill for this use case. Browser storage approach is simpler and meets accuracy requirements.
2. **Web Workers**: Cannot survive browser closure; only helps with tab backgrounding. Not sufficient.
3. **IndexedDB instead of localStorage**: More complex API with no benefit for this feature's data size.

### 2. Periodic Sync Implementation

**Question**: How should we implement the 10-second periodic sync during active timing?

**Decision**: Use `setInterval` with cleanup on timer stop/destroy

**Rationale**:
- Timer already uses `requestAnimationFrame` for display updates
- Add a separate `setInterval(10000)` for persistence sync
- The interval callback should:
  1. Get current elapsed from timer service
  2. Save timer state to localStorage
  3. Update `lastPersistedAt` timestamp
- Clean up interval on timer stop or component unmount

**Alternatives Considered**:
1. **Sync on every tick**: Too frequent, unnecessary I/O overhead
2. **Sync only on page unload**: `beforeunload` is unreliable on mobile and doesn't fire on crashes
3. **Debounced sync**: More complex, 10-second fixed interval is predictable and testable

### 3. Page Lifecycle Events

**Question**: Which browser events should trigger state persistence?

**Decision**: Use multiple events for maximum coverage

**Rationale**:
- `visibilitychange` (document.hidden): Fires when tab is hidden/shown, good for tab switching
- `pagehide`: More reliable than `beforeunload` on mobile Safari
- `beforeunload`: Traditional event, still useful as fallback
- `freeze` (Page Lifecycle API): Fires when page is frozen (mobile browsers)

**Implementation**:
```typescript
// Persist on all these events for maximum coverage
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persistTimerState();
});
window.addEventListener('pagehide', persistTimerState);
window.addEventListener('beforeunload', persistTimerState);
```

**Alternatives Considered**:
1. **Only beforeunload**: Unreliable on mobile, doesn't fire on crashes
2. **Storage event for cross-tab sync**: Not needed since we don't support multi-tab active sessions

### 4. Timestamp Validation

**Question**: How should we handle invalid/corrupted timestamps on recovery?

**Decision**: Implement bounds checking with graceful fallback

**Rationale**:
- Check if `lastPersistedAt` is in the future (clock was adjusted backward)
- Check if elapsed time would be unreasonably large (>24 hours for a single task)
- On invalid data: reset timer state and start fresh, log warning for debugging

**Validation Rules**:
1. `lastPersistedAt > Date.now()`: Timestamp in future → reset
2. `calculatedElapsed < 0`: Negative elapsed → use 0
3. `calculatedElapsed > 24 * 60 * 60 * 1000`: Over 24 hours → prompt user (edge case)

**Alternatives Considered**:
1. **Silent reset without warning**: User loses data silently, bad UX
2. **Throw error**: Too aggressive, recovery should be graceful
3. **Use localStorage timestamps as backup**: localStorage doesn't provide write timestamps

### 5. Existing DaySession Fields

**Question**: What existing fields can we leverage vs. what needs to be added?

**Decision**: Extend existing fields minimally

**Analysis of Existing `DaySession`**:
- `currentTaskElapsedMs`: Already stores elapsed time (used for recovery)
- `lastPersistedAt`: Already stores sync timestamp (perfect for recovery calculation)
- `status: 'running'`: Indicates session was active when browser closed

**New Fields Needed**:
- `timerStartedAtMs?: number`: Wall-clock time when current task timer was started (needed for accurate recovery calculation)

**For Interruptions** (existing `Interruption` type):
- `startedAt: string`: ISO timestamp when interruption started (already exists!)
- Already supports recovery via wall-clock calculation

### 6. Recovery Flow

**Question**: What should happen when the app loads with a previous active session?

**Decision**: Silent automatic recovery per FR-013

**Recovery Flow**:
1. On app mount, check `storage.getSession()`
2. If session exists with `status === 'running'`:
   a. Load session and tasks
   b. Calculate elapsed time: `elapsedMsAtLastSync + (Date.now() - lastPersistedAt)`
   c. Validate calculated elapsed (bounds checking)
   d. Restore timerStore with calculated elapsed
   e. Start timer from restored position
3. Check for active interruption in interruption state:
   a. If `endedAt === null` on any interruption, restore interruption state
   b. Calculate interruption elapsed from `startedAt`

**Alternatives Considered**:
1. **Show recovery dialog**: Rejected per FR-013 (silent recovery)
2. **Only recover on explicit user action**: Adds friction, not user-friendly

## Summary

All research questions resolved. Key decisions:

| Topic | Decision |
|-------|----------|
| Persistence Strategy | Wall-clock timestamp + elapsed time |
| Periodic Sync | 10-second `setInterval` |
| Browser Events | `visibilitychange` + `pagehide` + `beforeunload` |
| Validation | Bounds checking with graceful reset |
| Session Fields | Add `timerStartedAtMs` to DaySession |
| Recovery Flow | Silent automatic on app mount |

No NEEDS CLARIFICATION items remain. Ready for Phase 1 design.
