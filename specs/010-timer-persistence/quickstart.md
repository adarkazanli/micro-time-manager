# Quickstart: Timer Persistence Across Browser/System Interruptions

**Feature**: 010-timer-persistence
**Date**: 2025-12-21

## Overview

This feature ensures that task timers and interruption timers continue tracking elapsed time even when the browser is closed or the computer goes to sleep.

## Key Concepts

### Wall-Clock Recovery

When the browser restarts, the app calculates how much time passed:

```
recoveredElapsed = savedElapsedMs + (now - lastSyncTimestamp)
```

This works because:
- `lastSyncTimestamp` is a wall-clock time (`Date.now()`)
- Wall-clock time continues advancing during sleep/closure
- The difference represents "away time"

### Periodic Sync

Every 10 seconds while the timer is running:
1. Get current elapsed from timer service
2. Save to localStorage with current timestamp
3. This limits data loss to max 10 seconds on unexpected closure

## Implementation Checklist

### 1. Update Types (`src/lib/types/index.ts`)

- [ ] Add `timerStartedAtMs` to `DaySession` interface
- [ ] Add `TimerRecoveryResult` type
- [ ] Add `TIMER_SYNC_INTERVAL_MS` constant (10000)
- [ ] Add `MAX_RECOVERY_ELAPSED_MS` constant (24 hours)
- [ ] Increment `CURRENT_SCHEMA_VERSION` to 6

### 2. Update Storage Service (`src/lib/services/storage.ts`)

- [ ] Add `migrateV5toV6()` function
- [ ] Update `migrateIfNeeded()` to call new migration
- [ ] Ensure `saveSession()` persists new field

### 3. Update Timer Store (`src/lib/stores/timerStore.svelte.ts`)

- [ ] Add `timerStartedAtMs` state variable
- [ ] Add `syncIntervalId` for periodic sync
- [ ] Update `start()` to record start timestamp
- [ ] Update `start()` to begin periodic sync
- [ ] Update `stop()` to end periodic sync
- [ ] Add `recover()` method for app load recovery
- [ ] Add browser event listeners (visibility, pagehide, beforeunload)

### 4. Update Session Store (`src/lib/stores/sessionStore.svelte.ts`)

- [ ] Add `timerStartedAtMs` to session creation
- [ ] Update `completeTask()` to reset timer start timestamp
- [ ] Ensure `restore()` preserves timer start timestamp

### 5. Update Main Page (`src/routes/+page.svelte`)

- [ ] Call recovery logic on mount (`onMount`)
- [ ] Handle recovery result (no UI notification per FR-013)

### 6. Tests

- [ ] Unit test: Recovery with valid timestamps
- [ ] Unit test: Recovery with future timestamp (invalid)
- [ ] Unit test: Recovery with negative elapsed (edge case)
- [ ] Unit test: Periodic sync triggers every 10s
- [ ] E2E test: Full browser restart scenario

## Code Examples

### Timer Recovery Logic

```typescript
function recover(): TimerRecoveryResult {
  const session = storage.getSession();

  if (!session || session.status !== 'running') {
    return { success: false, recoveredElapsedMs: 0, awayTimeMs: 0, isValid: true };
  }

  const now = Date.now();
  const lastSync = session.lastPersistedAt;
  const savedElapsed = session.currentTaskElapsedMs;

  // Validate: lastSync should not be in the future
  if (lastSync > now) {
    console.warn('Timer recovery: timestamp in future, resetting');
    return { success: false, recoveredElapsedMs: 0, awayTimeMs: 0, isValid: false, error: 'Future timestamp' };
  }

  const awayTimeMs = now - lastSync;
  const recoveredElapsedMs = savedElapsed + awayTimeMs;

  // Cap at 24 hours
  const cappedElapsed = Math.min(recoveredElapsedMs, MAX_RECOVERY_ELAPSED_MS);

  return {
    success: true,
    recoveredElapsedMs: cappedElapsed,
    awayTimeMs,
    isValid: true
  };
}
```

### Periodic Sync Setup

```typescript
let syncIntervalId: number | null = null;

function startPersistenceSync(): void {
  if (syncIntervalId !== null) return;

  syncIntervalId = window.setInterval(() => {
    if (running && session) {
      session.currentTaskElapsedMs = timerStore.elapsedMs;
      session.lastPersistedAt = Date.now();
      storage.saveSession(session);
    }
  }, TIMER_SYNC_INTERVAL_MS);
}

function stopPersistenceSync(): void {
  if (syncIntervalId !== null) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
```

### Browser Event Handlers

```typescript
function setupBrowserEventListeners(): void {
  // Persist when tab becomes hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) {
      persistTimerState();
    }
  });

  // Persist before page unloads
  window.addEventListener('pagehide', () => {
    if (running) persistTimerState();
  });

  window.addEventListener('beforeunload', () => {
    if (running) persistTimerState();
  });
}

function persistTimerState(): void {
  if (!session) return;

  session.currentTaskElapsedMs = timerStore.elapsedMs;
  session.lastPersistedAt = Date.now();
  storage.saveSession(session);
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('Timer Recovery', () => {
  it('recovers elapsed time after browser closure', () => {
    // Setup: session with 20 min elapsed, persisted 10 min ago
    const now = Date.now();
    const session = {
      status: 'running',
      currentTaskElapsedMs: 20 * 60 * 1000, // 20 min
      lastPersistedAt: now - (10 * 60 * 1000), // 10 min ago
      timerStartedAtMs: now - (30 * 60 * 1000)
    };

    const result = recover(session);

    expect(result.success).toBe(true);
    expect(result.recoveredElapsedMs).toBeCloseTo(30 * 60 * 1000, -3); // ~30 min
    expect(result.awayTimeMs).toBeCloseTo(10 * 60 * 1000, -3); // ~10 min
  });
});
```

### E2E Tests

```typescript
test('timer persists across page reload', async ({ page }) => {
  // Start a task with the timer running
  await page.goto('/');
  await startDayWithTasks(page);

  // Wait for timer to accumulate time
  await page.waitForTimeout(5000);

  // Capture elapsed time
  const elapsedBefore = await getTimerElapsed(page);

  // Reload page
  await page.reload();

  // Wait for recovery
  await page.waitForTimeout(1000);

  // Timer should have continued
  const elapsedAfter = await getTimerElapsed(page);
  expect(elapsedAfter).toBeGreaterThan(elapsedBefore);
});
```

## Common Gotchas

1. **Don't use `performance.now()` for persistence** - it resets on page load. Use `Date.now()` for wall-clock time.

2. **Always validate recovered timestamps** - Clocks can drift or be manually changed.

3. **Test on mobile browsers** - `beforeunload` is unreliable; use `pagehide` and `visibilitychange`.

4. **Clear sync interval on timer stop** - Memory leak if interval continues after timer stops.

5. **Handle localStorage quota errors** - Gracefully degrade if storage fails.
