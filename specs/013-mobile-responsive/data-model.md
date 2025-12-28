# Data Model: Mobile Responsive Design

**Feature**: 013-mobile-responsive
**Date**: 2025-12-28

## Overview

This feature is primarily CSS/layout focused. No new data entities are created. This document defines the **component responsive requirements** - which elements need responsive modifications and what breakpoint-specific behaviors they require.

## Component Responsive Requirements

### Priority 1: Core Task Views

#### ImpactPanel.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Container | Full width, single column | Full width, single column | Current layout |
| Header | Compact, stacked title/actions | Inline title/actions | Current |
| Task list | Single column, 44px row height | Single column, 40px row height | Current |
| Overflow indicator | Badge visible, full message | Full message | Current |

#### ImpactTaskRow.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Row container | 44px min height, tap-to-expand | 40px min height, hover actions | Current (hover) |
| Task name | Truncate with ellipsis at 60% width | Truncate at 70% | Current |
| Time display | Stack below name if needed | Inline | Current |
| Action buttons | Hidden until tap, 44px touch targets | Show on hover, 36px | Current |
| Drag handle | Touch-and-hold (500ms) | Touch-and-hold | Current (drag icon) |
| Status indicators | Icon only | Icon + short label | Current |

#### TaskRow.svelte (SchedulePreview)

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Row height | 44px min | 40px min | Current |
| Time column | 60px fixed width | 80px | Current |
| Task name | Flex grow, truncate | Current | Current |
| Duration | Hidden on mobile | Show | Current |

#### TimerDisplay.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Font size | text-2xl (24px) | text-3xl (30px) | text-4xl (36px) |
| Container | Centered, prominent | Current | Current |

#### SchedulePreview.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Container | Full width, max-height 60vh | Max-height 70vh | Current |
| Export button | Icon only, 44px | Icon + text | Current |
| Task rows | Single column | Current | Current |

### Priority 2: Warnings & Actions

#### ConflictWarning.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Banner | Full width, padding-y increased | Current | Current |
| Text | Wrap if needed, 16px min | Current | Current |
| Dismiss button | 44px touch target | Current | Current |

#### FixedTaskWarning.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Container | Full width alert | Current | Current |
| Risk indicator | Bold color, larger icon | Current | Current |
| Buffer time | Prominent display | Current | Current |

#### ScheduleOverflowWarning.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Badge | Visible, 16px min text | Current | Current |
| Tooltip/details | Tap to expand on mobile | Hover | Current |

#### TaskControls.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Buttons | 44px min, icon + short label | Icon + label | Current |
| Button group | Stack vertically if needed | Horizontal | Current |
| Spacing | gap-2 (8px) minimum | Current | Current |

#### AddTaskDialog.svelte / EditTaskDialog.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Modal | Full screen (100dvh) | Centered, max-w-lg | Current |
| Form inputs | Full width, 44px height | Current | Current |
| Buttons | Full width, stacked | Side by side | Current |
| Close button | 44px, top-right | Current | Current |

### Priority 3: Secondary Views

#### SettingsPanel.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Panel | Full width | Current | Current |
| Form groups | Single column | Two columns | Current |
| Toggle switches | 44px touch targets | Current | Current |
| Labels | Stack above inputs | Inline | Current |

#### AnalyticsDashboard.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Charts | Full width, stacked | Two column grid | Current |
| Chart height | 200px min | 250px | Current |
| Legend | Below chart | Side or below | Current |

#### ExportButton.svelte / FileUploader.svelte

| Element | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|---------|-----------------|---------------------|-------------------|
| Button | 44px, icon only or compact text | Full text | Current |
| File picker | Native mobile picker | Current | Current |

## State Additions

### ImpactTaskRow - Expanded State

```typescript
// New state for tap-to-reveal on mobile
let expandedRowId: string | null = $state(null);

// Detect if we're on a touch device
const isTouchDevice = $derived(
  typeof window !== 'undefined' && 'ontouchstart' in window
);
```

### Touch Drag State

```typescript
// For touch-and-hold drag activation
interface TouchDragState {
  touchTimer: ReturnType<typeof setTimeout> | null;
  isDragging: boolean;
  draggedTaskId: string | null;
  initialY: number;
}

let touchDrag: TouchDragState = $state({
  touchTimer: null,
  isDragging: false,
  draggedTaskId: null,
  initialY: 0
});
```

## Breakpoint Reference

| Name | Width | Tailwind Prefix | Usage |
|------|-------|-----------------|-------|
| Mobile | <640px | (base) | Phone portrait |
| Small | ≥640px | `sm:` | Phone landscape, small tablet |
| Medium | ≥768px | `md:` | Tablet portrait |
| Large | ≥1024px | `lg:` | Tablet landscape, desktop |
| XL | ≥1280px | `xl:` | Large desktop |

## CSS Variables (app.css additions)

```css
:root {
  /* Touch target minimum size */
  --touch-target-min: 44px;

  /* Mobile-specific spacing */
  --mobile-padding: 0.5rem; /* 8px */
  --mobile-gap: 0.5rem;

  /* Timer size per breakpoint */
  --timer-size-mobile: 1.5rem; /* 24px */
  --timer-size-tablet: 1.875rem; /* 30px */
  --timer-size-desktop: 2.25rem; /* 36px */
}
```

## No New Entities

This feature does not introduce new data entities to localStorage. All changes are presentational:
- No schema version change needed
- No migration required
- No new stores needed
