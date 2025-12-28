# Research: Mobile Responsive Design

**Feature**: 013-mobile-responsive
**Date**: 2025-12-28
**Status**: Complete

## Research Tasks

### 1. Tailwind CSS 4.x Responsive Breakpoints

**Decision**: Use Tailwind's default breakpoint system with mobile-first approach

**Rationale**: Tailwind 4.x uses the same breakpoint values as v3 (sm:640px, md:768px, lg:1024px, xl:1280px). Mobile-first means base styles apply to mobile, then override with `sm:`, `md:`, `lg:` prefixes for larger screens.

**Alternatives Considered**:
- Custom breakpoints: Rejected - default breakpoints align perfectly with spec requirements
- Container queries: Considered but browser support still maturing; stick with viewport breakpoints

**Implementation Pattern**:
```html
<!-- Mobile-first: base is mobile, add responsive modifiers for larger -->
<div class="p-2 sm:p-4 md:p-6 lg:p-8">
  <span class="text-sm sm:text-base md:text-lg">Content</span>
</div>
```

### 2. Touch-and-Hold Drag Implementation (500ms delay)

**Decision**: Use `touchstart`/`touchend` events with setTimeout for drag activation

**Rationale**: Native HTML5 drag events don't work well on touch devices. A 500ms delay differentiates intentional drag from scroll gestures.

**Alternatives Considered**:
- Libraries (SortableJS, dnd-kit): Rejected - adds bundle size, YAGNI principle
- CSS `touch-action: none`: Partial - disables scrolling, bad UX
- Immediate drag on touch: Rejected - conflicts with scroll behavior

**Implementation Pattern**:
```typescript
let touchTimer: ReturnType<typeof setTimeout> | null = null;
let isDragging = false;

function handleTouchStart(e: TouchEvent) {
  touchTimer = setTimeout(() => {
    isDragging = true;
    // Visual feedback: add drag styling
  }, 500);
}

function handleTouchEnd() {
  if (touchTimer) clearTimeout(touchTimer);
  isDragging = false;
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging) {
    // Not yet dragging - allow scroll
    if (touchTimer) clearTimeout(touchTimer);
  } else {
    e.preventDefault(); // Prevent scroll while dragging
    // Handle drag position
  }
}
```

### 3. Tap-to-Reveal Action Buttons Pattern

**Decision**: Use component state to track "expanded" row, with click-outside to collapse

**Rationale**: On mobile, hover states don't exist. Tapping a row reveals actions; tapping elsewhere collapses them. Only one row can be expanded at a time.

**Alternatives Considered**:
- Swipe-to-reveal: More complex gesture handling, not needed for our use case
- Long-press to reveal: Conflicts with drag gesture (both use long press)
- Always visible icons: Takes too much horizontal space on mobile

**Implementation Pattern**:
```svelte
<script>
  let expandedRowId: string | null = $state(null);

  function toggleRow(taskId: string) {
    expandedRowId = expandedRowId === taskId ? null : taskId;
  }

  function handleClickOutside() {
    expandedRowId = null;
  }
</script>

{#each tasks as task}
  <div onclick={() => toggleRow(task.id)}>
    <span>{task.name}</span>
    {#if expandedRowId === task.id}
      <div class="flex gap-2">
        <button>Start</button>
        <button>Complete</button>
      </div>
    {/if}
  </div>
{/each}
```

### 4. Mobile Touch Target Sizing (44x44px)

**Decision**: Use Tailwind's `min-h-11 min-w-11` (44px) for all interactive elements on mobile

**Rationale**: Apple HIG and WCAG 2.2 recommend 44x44px minimum touch targets. Tailwind's spacing scale: 11 = 44px (11 * 4px base).

**Alternatives Considered**:
- 40px (min-h-10): Too small for comfortable touch
- 48px (min-h-12): Slightly larger, but 44px meets accessibility standards

**Implementation Pattern**:
```html
<!-- Mobile: 44px touch target; Desktop: can be smaller -->
<button class="min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 p-2">
  <Icon />
</button>
```

### 5. Responsive Typography Scale

**Decision**: 16px base on mobile (browser default), scale up on larger screens

**Rationale**: 16px is the minimum for readable text without zoom. Smaller text on desktop is fine due to higher pixel density and closer viewing distance.

**Alternatives Considered**:
- 14px base: Too small on mobile, fails accessibility
- 18px base: Slightly large, wastes screen real estate

**Implementation Pattern**:
```html
<!-- Base (mobile): 16px body, scale up on larger screens -->
<p class="text-base md:text-lg">Body text</p>
<h1 class="text-xl sm:text-2xl md:text-3xl">Heading</h1>

<!-- Timer needs to be extra prominent on mobile -->
<span class="text-2xl sm:text-3xl md:text-4xl font-mono">00:00:00</span>
```

### 6. Mobile Viewport Meta Tag

**Decision**: Ensure proper viewport meta tag exists in app.html

**Rationale**: Required for responsive design to work correctly on mobile devices.

**Implementation Pattern**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### 7. Touch State Feedback (Active States)

**Decision**: Use `active:` pseudo-class for touch feedback instead of hover

**Rationale**: Mobile devices don't have hover. Active state provides immediate visual feedback on touch.

**Alternatives Considered**:
- No feedback: Poor UX, user doesn't know if tap registered
- Hover fallback: Doesn't work on touch devices

**Implementation Pattern**:
```html
<!-- Desktop: hover effect; Mobile: active (pressed) effect -->
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 active:scale-95">
  Action
</button>
```

### 8. Handling Keyboard Appearance on Mobile

**Decision**: Use CSS viewport units (dvh) and scroll-into-view for input focus

**Rationale**: When mobile keyboard appears, viewport shrinks. Using `dvh` (dynamic viewport height) ensures layout adapts.

**Alternatives Considered**:
- Fixed positioning: Can cause elements to be hidden behind keyboard
- JavaScript resize handling: More complex, CSS solution preferred

**Implementation Pattern**:
```css
/* Use dynamic viewport height for full-screen layouts */
.full-height {
  height: 100dvh;
}
```

```svelte
<input onfocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
```

## Summary

All research tasks complete. Key findings:
1. Use Tailwind's mobile-first responsive utilities
2. Implement touch-hold drag with 500ms setTimeout
3. Tap-to-reveal pattern for action buttons
4. 44px minimum touch targets (min-h-11)
5. 16px minimum body text
6. Active states for touch feedback
7. Dynamic viewport units for keyboard handling

No external dependencies required. All patterns can be implemented with existing Tailwind CSS and vanilla JavaScript.
