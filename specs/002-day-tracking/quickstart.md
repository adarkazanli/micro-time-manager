# Quickstart Guide: Day Tracking Timer

**Feature**: 002-day-tracking
**Date**: 2025-12-18
**Phase**: 1 (Design)

## Overview

This guide provides a rapid onboarding path for implementing the Day Tracking Timer feature. Follow these steps to set up, implement, and test the feature.

## Prerequisites

- 001-schedule-import feature merged to main branch
- Node.js 18+ installed
- npm 9+ installed
- Modern browser (Chrome 54+, Firefox 38+, Safari 15.4+)

## Setup

### 1. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b 002-day-tracking
```

### 2. Install Dependencies

No new dependencies required - uses existing Svelte 5, Vite, and Tailwind stack.

### 3. Review Existing Code

Key files from 001-schedule-import to understand:

```bash
# Types you'll extend
cat src/lib/types/index.ts

# Storage patterns to follow
cat src/lib/services/storage.ts

# Store patterns to follow
cat src/lib/stores/importStore.ts
```

## Implementation Order

### Phase 1: Types and Services (Day 1)

```text
1. src/lib/types/index.ts          # Add new types (TimerState, DaySession, etc.)
2. src/lib/services/timer.ts       # Core timer logic with performance.now()
3. src/lib/services/tabSync.ts     # Multi-tab coordination
4. src/lib/services/storage.ts     # Extend for session persistence
```

### Phase 2: Stores (Day 2)

```text
1. src/lib/stores/timerStore.svelte.ts   # Reactive timer state
2. src/lib/stores/sessionStore.svelte.ts # Day session management
```

### Phase 3: Components (Days 3-4)

```text
1. src/lib/components/TimerDisplay.svelte      # Priority: Critical
2. src/lib/components/TaskControls.svelte      # Priority: Critical
3. src/lib/components/CurrentTask.svelte       # Priority: High
4. src/lib/components/LagIndicator.svelte      # Priority: Medium
5. src/lib/components/FixedTaskWarning.svelte  # Priority: Low
6. src/lib/components/DaySummary.svelte        # Priority: Low
```

### Phase 4: Integration (Day 5)

```text
1. src/routes/+page.svelte    # Integrate tracking view
2. E2E tests                  # Full workflow testing
```

## Key Patterns

### Timer Service Pattern

```typescript
// src/lib/services/timer.ts
export function createTimer(config: TimerConfig): TimerServiceContract {
    let startTime: number | null = null;
    let elapsedOffset = 0;
    let frameId: number | null = null;

    function tick() {
        if (startTime === null) return;
        const elapsed = performance.now() - startTime + elapsedOffset;
        config.onTick(elapsed);
        frameId = requestAnimationFrame(tick);
    }

    return {
        start(startFromMs = 0) {
            elapsedOffset = startFromMs;
            startTime = performance.now();
            config.onStart?.();
            tick();
        },
        stop() {
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
            const elapsed = this.getElapsed();
            startTime = null;
            config.onStop?.(elapsed);
            return elapsed;
        },
        isRunning: () => startTime !== null,
        getElapsed: () => startTime === null
            ? elapsedOffset
            : performance.now() - startTime + elapsedOffset,
        destroy() {
            this.stop();
        }
    };
}
```

### Svelte 5 Store Pattern

```typescript
// src/lib/stores/timerStore.svelte.ts
class TimerStore {
    private _elapsedMs = $state(0);
    private _durationMs = $state(0);
    private _isRunning = $state(false);
    private timer: TimerServiceContract | null = null;

    get elapsedMs() { return this._elapsedMs; }
    get remainingMs() { return this._durationMs - this._elapsedMs; }

    get color(): TimerColor {
        const remaining = this.remainingMs;
        if (remaining <= 0) return 'red';
        if (remaining <= 300000) return 'yellow';
        return 'green';
    }

    start(durationSec: number, startFromMs = 0) {
        this._durationMs = durationSec * 1000;
        this.timer = createTimer({
            onTick: (elapsed) => { this._elapsedMs = elapsed; }
        });
        this.timer.start(startFromMs);
        this._isRunning = true;
    }

    stop(): number {
        const elapsed = this.timer?.stop() ?? 0;
        this._isRunning = false;
        return elapsed;
    }
}

export const timerStore = new TimerStore();
```

### Component Pattern

```svelte
<!-- src/lib/components/TimerDisplay.svelte -->
<script lang="ts">
    import { timerStore } from '$lib/stores/timerStore.svelte';
    import { formatTime } from '$lib/utils/time';

    const colorClasses: Record<TimerColor, string> = {
        green: 'text-green-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500'
    };
</script>

<div
    class="text-6xl font-mono font-bold {colorClasses[timerStore.color]}"
    data-testid="timer-display"
>
    {formatTime(timerStore.remainingMs)}
</div>
```

## Testing Strategy

### Unit Tests First

```typescript
// tests/unit/timer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimer } from '$lib/services/timer';

describe('createTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('tracks elapsed time using performance.now()', () => {
        const perfNow = vi.spyOn(performance, 'now');
        perfNow.mockReturnValueOnce(0);

        const onTick = vi.fn();
        const timer = createTimer({ onTick });
        timer.start();

        perfNow.mockReturnValueOnce(1000);
        expect(timer.getElapsed()).toBe(1000);
    });

    it('supports starting with offset for recovery', () => {
        const perfNow = vi.spyOn(performance, 'now');
        perfNow.mockReturnValueOnce(0);

        const timer = createTimer({ onTick: vi.fn() });
        timer.start(5000); // Start with 5 seconds already elapsed

        perfNow.mockReturnValueOnce(1000);
        expect(timer.getElapsed()).toBe(6000); // 5000 + 1000
    });
});
```

### E2E Test Example

```typescript
// tests/e2e/day-tracking.test.ts
import { test, expect } from '@playwright/test';

test.describe('Day Tracking', () => {
    test('starts timer and displays countdown', async ({ page }) => {
        // Setup: Import a schedule first
        await page.goto('/');
        // ... import schedule setup ...

        // Start day tracking
        await page.getByRole('button', { name: 'Start Day' }).click();

        // Verify timer is displayed
        const timer = page.getByTestId('timer-display');
        await expect(timer).toBeVisible();
        await expect(timer).toHaveClass(/text-green-500/);

        // Wait and verify countdown
        await page.waitForTimeout(2000);
        // Timer should have decreased
    });

    test('completes task and advances to next', async ({ page }) => {
        // ... setup ...

        await page.getByRole('button', { name: 'Complete Task' }).click();

        // Verify next task is shown
        const taskName = page.getByTestId('current-task-name');
        await expect(taskName).toContainText('Second Task');
    });
});
```

## Common Pitfalls

### 1. Using Date.now() for timing

```typescript
// WRONG - affected by system clock changes
const start = Date.now();
const elapsed = Date.now() - start;

// CORRECT - monotonic, immune to clock changes
const start = performance.now();
const elapsed = performance.now() - start;
```

### 2. Using setInterval for display updates

```typescript
// WRONG - can drift, not synced to display
setInterval(() => updateDisplay(), 16);

// CORRECT - synced to display refresh
function tick() {
    updateDisplay();
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### 3. Persisting too frequently

```typescript
// WRONG - writes to localStorage every frame (16ms)
function tick() {
    localStorage.setItem('state', JSON.stringify(state));
}

// CORRECT - persist on visibility change and interval
document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
});
setInterval(persist, 5000);
```

### 4. Not handling page recovery

```typescript
// WRONG - assumes fresh start
function startDay() {
    elapsedMs = 0;
}

// CORRECT - check for saved state
function startDay() {
    const saved = storage.getSession();
    if (saved) {
        restore(saved);
    } else {
        elapsedMs = 0;
    }
}
```

## File Checklist

### New Files to Create

- [ ] `src/lib/services/timer.ts`
- [ ] `src/lib/services/tabSync.ts`
- [ ] `src/lib/stores/timerStore.svelte.ts`
- [ ] `src/lib/stores/sessionStore.svelte.ts`
- [ ] `src/lib/components/TimerDisplay.svelte`
- [ ] `src/lib/components/TaskControls.svelte`
- [ ] `src/lib/components/CurrentTask.svelte`
- [ ] `src/lib/components/LagIndicator.svelte`
- [ ] `src/lib/components/FixedTaskWarning.svelte`
- [ ] `src/lib/components/DaySummary.svelte`

### Files to Modify

- [ ] `src/lib/types/index.ts` - Add new types
- [ ] `src/lib/services/storage.ts` - Add session persistence
- [ ] `src/lib/utils/time.ts` - Add lag formatting
- [ ] `src/routes/+page.svelte` - Add tracking view

### Test Files to Create

- [ ] `tests/unit/timer.test.ts`
- [ ] `tests/unit/timerStore.test.ts`
- [ ] `tests/unit/sessionStore.test.ts`
- [ ] `tests/unit/lagCalculation.test.ts`
- [ ] `tests/e2e/day-tracking.test.ts`

## Success Verification

Run these commands to verify implementation:

```bash
# All tests pass
npm test

# E2E tests pass
npm run test:e2e

# Type checking passes
npm run check

# Linting passes
npm run lint

# Build succeeds
npm run build
```
