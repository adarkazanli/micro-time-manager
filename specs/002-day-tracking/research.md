# Technical Research: Day Tracking Timer

**Feature**: 002-day-tracking
**Date**: 2025-12-18
**Phase**: 0 (Research)

## 1. Browser Timer APIs

### High-Resolution Time

**`performance.now()`** - Recommended for elapsed time tracking.

```typescript
// Returns milliseconds since page load with sub-millisecond precision
const start = performance.now();
// ... work happens ...
const elapsed = performance.now() - start; // e.g., 1234.567
```

**Why not `Date.now()`?**
- `Date.now()` can be affected by system clock changes (NTP sync, user adjustments)
- `performance.now()` is monotonic - always increases, immune to clock adjustments
- Constitution III mandates timer accuracy; `performance.now()` is the correct choice

### Display Updates

**`requestAnimationFrame`** - Recommended for visual updates.

```typescript
let frameId: number;

function updateDisplay(timestamp: DOMHighResTimeStamp) {
    // timestamp comes from performance.now() automatically
    renderTimer(timestamp);
    frameId = requestAnimationFrame(updateDisplay);
}

// Start
frameId = requestAnimationFrame(updateDisplay);

// Stop
cancelAnimationFrame(frameId);
```

**Why not `setInterval`?**
- `setInterval` can drift and isn't tied to display refresh
- `requestAnimationFrame` is synced to display refresh (typically 60fps)
- Automatically paused when tab is in background (power saving)
- Constitution III requires 60fps maximum for timer displays

### Background Tab Handling

When a tab is in the background:
- `requestAnimationFrame` is paused
- `setInterval` is throttled to ~1 second minimum

**Drift Compensation Strategy**:
```typescript
// Store absolute reference time
const sessionStartTime = performance.now();
const sessionStartDate = Date.now(); // Fallback for persistence

// On resume from background
function recalculateElapsed(): number {
    const now = performance.now();
    // Elapsed = current - start (handles any pause duration automatically)
    return now - sessionStartTime;
}
```

## 2. State Persistence Strategy

### localStorage Limitations

| Limit | Value | Impact |
|-------|-------|--------|
| Storage quota | ~5-10MB per origin | More than sufficient |
| Synchronous API | Blocks main thread | Keep writes small |
| String-only values | Must JSON serialize | Already handled in 001 |

### Timer State Schema

Building on existing schema from 001-schedule-import:

```typescript
// Existing keys (from 001)
const STORAGE_KEY_TASKS = 'tm_tasks';         // ConfirmedTask[]
const STORAGE_KEY_SCHEMA = 'tm_schema_version';

// New keys (for 002)
const STORAGE_KEY_SESSION = 'tm_session';     // DaySession
const STORAGE_KEY_TAB = 'tm_active_tab';      // TabInfo
```

### Persistence Frequency

- **On task completion**: Immediate write (critical state change)
- **During active timing**: Every 5 seconds (balance accuracy vs I/O)
- **On page visibility change**: Immediate write when hiding
- **On beforeunload**: Final state save

```typescript
// Using Page Visibility API
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        persistTimerState();
    }
});

// Using beforeunload
window.addEventListener('beforeunload', () => {
    persistTimerState();
});
```

## 3. Multi-Tab Coordination

### BroadcastChannel API

Modern browsers support cross-tab messaging without server:

```typescript
const channel = new BroadcastChannel('tm_timer_sync');

// Send message to other tabs
channel.postMessage({ type: 'TAB_ACTIVE', tabId: myTabId });

// Receive messages
channel.onmessage = (event) => {
    if (event.data.type === 'TAB_ACTIVE' && event.data.tabId !== myTabId) {
        // Another tab is active, disable controls
        disableLocalControls();
    }
};
```

### Leader Election Pattern

```typescript
interface TabInfo {
    tabId: string;
    activeSince: number;
    lastHeartbeat: number;
}

function claimLeadership(): boolean {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_TAB) || 'null');
    const now = Date.now();

    // Claim if no leader or leader is stale (>5 seconds old)
    if (!existing || (now - existing.lastHeartbeat) > 5000) {
        localStorage.setItem(STORAGE_KEY_TAB, JSON.stringify({
            tabId: myTabId,
            activeSince: now,
            lastHeartbeat: now
        }));
        return true;
    }

    return existing.tabId === myTabId;
}
```

### Heartbeat Mechanism

```typescript
// Active tab sends heartbeat every 2 seconds
setInterval(() => {
    if (isLeader) {
        updateHeartbeat();
    }
}, 2000);
```

## 4. Svelte 5 Integration

### Timer Store Pattern

Using Svelte 5 runes for reactive timer state:

```typescript
// timerStore.svelte.ts
class TimerStore {
    private _elapsed = $state(0);
    private _status = $state<'idle' | 'running' | 'complete'>('idle');

    get elapsed() { return this._elapsed; }
    get status() { return this._status; }

    get remaining(): number {
        return $derived(() => this.currentTaskDuration - this._elapsed);
    }
}

export const timerStore = new TimerStore();
```

### Component Reactivity

```svelte
<script lang="ts">
    import { timerStore } from '$lib/stores/timerStore.svelte';

    // Derived state for color
    const timerColor = $derived(() => {
        const remaining = timerStore.remaining;
        if (remaining < 0) return 'red';
        if (remaining < 300) return 'yellow'; // < 5 minutes
        return 'green';
    });
</script>

<div class="timer" style:color={timerColor}>
    {formatTime(timerStore.remaining)}
</div>
```

## 5. Edge Case Handling

### Page Refresh Recovery

```typescript
function restoreSession(): DaySession | null {
    const stored = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!stored) return null;

    const session: DaySession = JSON.parse(stored);

    // Recalculate elapsed time for active task
    if (session.status === 'running') {
        const now = Date.now();
        const additionalElapsed = now - session.lastPersistedAt;
        session.currentTaskElapsed += additionalElapsed;
    }

    return session;
}
```

### Fixed Task Already Passed

```typescript
function handleMissedFixedTask(task: ConfirmedTask): TaskProgress {
    return {
        taskId: task.taskId,
        plannedDurationSec: task.plannedDurationSec,
        actualDurationSec: 0,
        completedAt: null,
        status: 'missed'
    };
}
```

### Lag Calculation

```typescript
function calculateLag(session: DaySession): number {
    let totalPlanned = 0;
    let totalActual = 0;

    for (const progress of session.taskProgress) {
        if (progress.status === 'complete') {
            totalPlanned += progress.plannedDurationSec;
            totalActual += progress.actualDurationSec;
        }
    }

    // Negative = ahead of schedule, Positive = behind
    return totalActual - totalPlanned;
}
```

## 6. Browser Compatibility

### Required APIs

| API | Chrome | Firefox | Safari | Edge | Fallback |
|-----|--------|---------|--------|------|----------|
| `performance.now()` | ✅ 20+ | ✅ 15+ | ✅ 8+ | ✅ 12+ | None needed |
| `requestAnimationFrame` | ✅ 10+ | ✅ 4+ | ✅ 6+ | ✅ 12+ | None needed |
| `localStorage` | ✅ 4+ | ✅ 3.5+ | ✅ 4+ | ✅ 12+ | None needed |
| `BroadcastChannel` | ✅ 54+ | ✅ 38+ | ✅ 15.4+ | ✅ 79+ | localStorage polling |
| `visibilitychange` | ✅ 13+ | ✅ 18+ | ✅ 7+ | ✅ 12+ | None needed |

### BroadcastChannel Fallback

For older Safari versions, fall back to localStorage events:

```typescript
function setupTabSync() {
    if ('BroadcastChannel' in window) {
        return new BroadcastChannel('tm_timer_sync');
    }

    // Fallback: localStorage storage event
    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY_TAB) {
            handleTabChange(JSON.parse(event.newValue || '{}'));
        }
    });
}
```

## 7. Performance Considerations

### Memory Budget

| Item | Size | Notes |
|------|------|-------|
| Timer service | ~2KB | Single instance |
| Session store | ~5KB | 50 tasks max |
| Display updates | N/A | 60fps budget: 16.67ms/frame |

### Optimization Guidelines

1. **Avoid derived state recalculation**: Cache lag values, update only on completion
2. **Batch DOM updates**: Single timer display update per frame
3. **Debounce persistence**: Don't write to localStorage every frame
4. **Use `$derived.by`**: For complex calculations that need memoization

## 8. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Time source | `performance.now()` | Monotonic, high-resolution, immune to clock changes |
| Display update | `requestAnimationFrame` | Synced to display, auto-pauses in background |
| Multi-tab | BroadcastChannel + localStorage fallback | Modern API with graceful degradation |
| State reactivity | Svelte 5 `$state` and `$derived` | Project standard, optimal re-render |
| Persistence trigger | Visibility change + 5s interval | Balance between accuracy and I/O |
