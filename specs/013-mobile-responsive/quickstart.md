# Quickstart: Mobile Responsive Design

**Feature**: 013-mobile-responsive
**Date**: 2025-12-28

## Prerequisites

- Node.js 18+
- Existing project setup (npm install completed)
- Understanding of Tailwind CSS responsive utilities

## Development Setup

```bash
# Start dev server with mobile preview
npm run dev

# Open browser devtools → Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
# Test at these viewport widths:
# - 320px (minimum mobile)
# - 375px (iPhone SE)
# - 414px (iPhone 14)
# - 640px (breakpoint: sm)
# - 768px (breakpoint: md)
# - 1024px (breakpoint: lg)
```

## Implementation Order

### Phase 1: Foundation (P1 Components)

1. **app.css** - Add base responsive styles
2. **+page.svelte** - Main layout responsive adjustments
3. **ImpactPanel.svelte** - Panel layout
4. **ImpactTaskRow.svelte** - Row layout + tap-to-reveal
5. **TimerDisplay.svelte** - Responsive font sizes
6. **SchedulePreview.svelte** - Preview layout
7. **TaskRow.svelte** - Row layout

### Phase 2: Interactions (P2 Components)

8. **ImpactTaskRow.svelte** - Touch-and-hold drag
9. **TaskControls.svelte** - Button sizing
10. **ConflictWarning.svelte** - Banner layout
11. **FixedTaskWarning.svelte** - Alert layout
12. **ScheduleOverflowWarning.svelte** - Badge layout
13. **AddTaskDialog.svelte** - Full-screen modal
14. **EditTaskDialog.svelte** - Full-screen modal

### Phase 3: Polish (P3 Components)

15. **SettingsPanel.svelte** - Form layout
16. **AnalyticsDashboard.svelte** - Chart layout
17. **ExportButton.svelte** - Button sizing
18. **FileUploader.svelte** - Button sizing

## Key Patterns

### Mobile-First Responsive Classes

```svelte
<!-- Base styles are for mobile, add responsive prefixes for larger screens -->
<div class="p-2 sm:p-4 md:p-6">
  <span class="text-sm sm:text-base">Text</span>
</div>
```

### Touch Target Sizing

```svelte
<!-- Ensure 44px minimum on mobile -->
<button class="min-h-11 min-w-11 p-2 sm:min-h-8 sm:min-w-8">
  Click me
</button>
```

### Tap-to-Reveal Pattern

```svelte
<script lang="ts">
  let expandedId: string | null = $state(null);

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id;
  }
</script>

<div onclick={() => toggleExpand(task.id)}>
  <span>{task.name}</span>
  {#if expandedId === task.id}
    <div class="flex gap-2 mt-2">
      <button class="min-h-11 min-w-11">Action</button>
    </div>
  {/if}
</div>
```

### Touch-and-Hold Drag

```svelte
<script lang="ts">
  let touchTimer: ReturnType<typeof setTimeout> | null = null;
  let isDragging = $state(false);

  function onTouchStart(e: TouchEvent, taskId: string) {
    touchTimer = setTimeout(() => {
      isDragging = true;
      // Add visual feedback
    }, 500);
  }

  function onTouchEnd() {
    if (touchTimer) clearTimeout(touchTimer);
    isDragging = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging && touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
    if (isDragging) {
      e.preventDefault();
      // Handle drag
    }
  }
</script>

<div
  ontouchstart={(e) => onTouchStart(e, task.id)}
  ontouchend={onTouchEnd}
  ontouchmove={onTouchMove}
>
  {task.name}
</div>
```

### Responsive Active States

```svelte
<!-- Use active: for touch feedback instead of hover: on mobile -->
<button class="
  bg-blue-500
  hover:bg-blue-600
  active:bg-blue-700
  active:scale-95
  transition-transform
">
  Tap me
</button>
```

## Testing

### Manual Testing Checklist

- [ ] Open on iPhone Safari (or iOS simulator)
- [ ] Open on Android Chrome (or Android emulator)
- [ ] Test all viewport widths in devtools
- [ ] Verify no horizontal scroll
- [ ] Verify 44px touch targets
- [ ] Test tap-to-reveal actions
- [ ] Test touch-and-hold drag
- [ ] Test with keyboard open (input focus)
- [ ] Test landscape orientation

### Playwright E2E Tests

```typescript
// tests/e2e/mobile-responsive.test.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 14'] });

test('task list displays correctly on mobile', async ({ page }) => {
  await page.goto('/');
  // Verify single column layout
  // Verify no horizontal scroll
  // Verify touch targets
});

test('tap-to-reveal shows action buttons', async ({ page }) => {
  await page.goto('/');
  // Import a schedule
  // Tap a task row
  // Verify action buttons appear
});
```

### Lighthouse Audit

```bash
# Run Lighthouse mobile audit
npx lighthouse http://localhost:5173 --view --preset=mobile
# Target: 90+ score
```

## Common Issues

### Issue: Horizontal Scroll on Mobile

**Cause**: Element with fixed width larger than viewport
**Fix**: Use `max-w-full` or `w-full` with `overflow-hidden`

### Issue: Touch Events Not Firing

**Cause**: CSS `touch-action: none` on parent
**Fix**: Only use `touch-action: none` on draggable element during drag

### Issue: Buttons Too Small

**Cause**: Missing minimum size constraints
**Fix**: Add `min-h-11 min-w-11` (44px) to all buttons

### Issue: Text Truncation Not Working

**Cause**: Missing `truncate` or container constraints
**Fix**: Add `truncate` class and ensure parent has `overflow-hidden`

## Files to Modify

```
src/app.css                           # Base responsive styles
src/routes/+page.svelte               # Main layout
src/lib/components/ImpactPanel.svelte # Panel layout
src/lib/components/ImpactTaskRow.svelte # Row + interactions
src/lib/components/TimerDisplay.svelte # Font sizing
src/lib/components/SchedulePreview.svelte # Preview layout
src/lib/components/TaskRow.svelte     # Row layout
src/lib/components/ConflictWarning.svelte # Banner
src/lib/components/FixedTaskWarning.svelte # Alert
src/lib/components/ScheduleOverflowWarning.svelte # Badge
src/lib/components/TaskControls.svelte # Buttons
src/lib/components/AddTaskDialog.svelte # Modal
src/lib/components/EditTaskDialog.svelte # Modal
src/lib/components/SettingsPanel.svelte # Form
src/lib/components/AnalyticsDashboard.svelte # Charts
src/lib/components/ExportButton.svelte # Button
src/lib/components/FileUploader.svelte # Button
tests/e2e/mobile-responsive.test.ts   # New tests
docs/USER_GUIDE.md                    # Mobile usage docs
```
