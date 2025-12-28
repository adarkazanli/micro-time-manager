# Feature Specification: Mobile Responsive Design

**Feature Branch**: `013-mobile-responsive`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "I want this app to be responsive and to look great on a mobile app"

## Clarifications

### Session 2025-12-28

- Q: How should drag & drop work on touch devices? → A: Enable touch-and-hold drag (500ms delay before drag activates)
- Q: Should action buttons always be visible on mobile or require tap to reveal? → A: Tap row to reveal action buttons (keeps UI cleaner)
- Q: What visual design direction for mobile? → A: Adapt for mobile conventions (bolder touch states, mobile-native spacing)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile Task Tracking (Priority: P1)

As a user on a mobile device, I want to view and interact with my task list so that I can track my time while on the go.

**Why this priority**: The task list is the core feature of the app. Users must be able to see their tasks, current task timer, and task status on mobile screens. Without this, the app is unusable on mobile.

**Independent Test**: Can be fully tested by opening the app on a mobile device (or mobile viewport) and verifying all task rows are visible, readable, and tappable.

**Acceptance Scenarios**:

1. **Given** a user on a mobile device (viewport width < 640px), **When** they view the task list, **Then** all tasks are visible in a single-column layout with readable text and touch-friendly tap targets (minimum 44px height).
2. **Given** a user viewing tasks on mobile, **When** they see the current active task, **Then** the timer display is prominently visible with large, readable digits.
3. **Given** a user on mobile with many tasks, **When** they scroll the task list, **Then** the list scrolls smoothly without horizontal overflow.

---

### User Story 2 - Mobile Schedule Impact Viewing (Priority: P1)

As a user on mobile, I want to see the Impact Panel with projected task times so I can understand my schedule at a glance.

**Why this priority**: The Impact Panel provides critical schedule awareness. Users need to see projected times and buffer information even on small screens.

**Independent Test**: Can be fully tested by viewing the Impact Panel on mobile and verifying projected times, task names, and status indicators are visible.

**Acceptance Scenarios**:

1. **Given** a user on mobile viewing the Impact Panel, **When** the panel displays tasks, **Then** each task row shows task name, projected time, and status with appropriate text sizing.
2. **Given** a user on mobile, **When** they view a task with risk level (yellow/red), **Then** the risk indicator is clearly visible and distinguishable.
3. **Given** a user on mobile with the panel open, **When** task projections update, **Then** the updates are visible without layout shifts.

---

### User Story 3 - Mobile Task Actions (Priority: P2)

As a user on mobile, I want to start, complete, and manage tasks using touch-friendly controls so I can control my timer easily.

**Why this priority**: After viewing tasks, users need to interact with them. Touch-friendly action buttons are essential for usability.

**Independent Test**: Can be fully tested by tapping task action buttons (start, complete, jump) on mobile and verifying they respond correctly.

**Acceptance Scenarios**:

1. **Given** a user on mobile viewing a pending task, **When** they tap the task row, **Then** action buttons (start, jump) are accessible and have adequate touch targets (minimum 44x44px).
2. **Given** a user with an active task on mobile, **When** they want to complete it, **Then** the complete button is easily tappable and provides visual feedback on tap.
3. **Given** a user on mobile, **When** they tap on a task row, **Then** action buttons are revealed in a mobile-appropriate layout (not overlapping content).

---

### User Story 4 - Mobile Warnings and Alerts (Priority: P2)

As a user on mobile, I want to see schedule conflicts, overflow warnings, and task alerts clearly so I don't miss important schedule issues.

**Why this priority**: Warnings prevent users from missing appointments. They must be visible and attention-grabbing on mobile.

**Independent Test**: Can be fully tested by creating a schedule conflict and viewing the warning on mobile.

**Acceptance Scenarios**:

1. **Given** a schedule conflict exists, **When** viewed on mobile, **Then** the warning banner is visible without truncation and readable.
2. **Given** a fixed task is at risk (yellow/red), **When** viewed on mobile, **Then** the risk indicator and buffer time are clearly displayed.
3. **Given** an overflow warning is active, **When** the user views the Impact Panel on mobile, **Then** the overflow badge is visible and the message is readable.

---

### User Story 5 - Tablet and Landscape Support (Priority: P3)

As a user on a tablet or phone in landscape mode, I want an optimized layout that uses the available screen space effectively.

**Why this priority**: While portrait mobile is the primary use case, landscape and tablet users should have a good experience too.

**Independent Test**: Can be fully tested by viewing the app in landscape orientation or on a tablet-sized viewport.

**Acceptance Scenarios**:

1. **Given** a user on a tablet (viewport 768-1024px), **When** viewing the app, **Then** the layout adapts to show more information without wasted space.
2. **Given** a user in landscape on phone, **When** viewing tasks, **Then** the layout adjusts appropriately and all content remains accessible.

---

### Edge Cases

- What happens when the task name is very long on mobile? (Should truncate with ellipsis)
- How does the system handle very small viewports (< 320px)? (Minimum supported width)
- What happens when action buttons would overlap on narrow screens? (Stack vertically or use icon-only mode)
- Drag reordering on touch devices uses touch-and-hold gesture (500ms delay) to differentiate from scrolling
- What happens when the keyboard opens on mobile? (Layout should adjust, timer should remain visible)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render properly on viewports from 320px to 2560px width
- **FR-002**: System MUST use responsive breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)
- **FR-003**: All interactive elements MUST have minimum touch target size of 44x44px on mobile
- **FR-004**: Task list MUST display in single-column layout on mobile with no horizontal scrolling
- **FR-005**: Timer display MUST remain visible and readable on all viewport sizes
- **FR-006**: Text MUST be readable without zooming (minimum 16px base font on mobile)
- **FR-007**: Action buttons MUST be accessible via touch on mobile devices
- **FR-008**: Warning banners and alerts MUST be visible and not truncated on mobile
- **FR-009**: System MUST support both portrait and landscape orientations
- **FR-010**: System MUST use Tailwind CSS responsive utilities for breakpoint handling
- **FR-011**: Drag reordering on touch devices MUST use touch-and-hold gesture with 500ms delay before drag activates
- **FR-012**: On mobile, action buttons MUST be revealed on row tap (not always visible) to maintain clean UI
- **FR-013**: Mobile UI MUST adapt visual conventions (bolder touch states, mobile-native spacing) rather than just scaling desktop design

### Key Entities

- **Viewport Breakpoints**: mobile (<640px), sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Targets**: Minimum 44x44px for all interactive elements on touch devices
- **Layout Modes**: Single-column (mobile), flexible multi-column (tablet/desktop)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: App passes Lighthouse mobile usability audit with score of 90+
- **SC-002**: All tap targets meet 44x44px minimum on mobile viewports
- **SC-003**: No horizontal scrolling occurs on any supported mobile viewport (320-639px)
- **SC-004**: Text is readable without zoom (16px minimum for body text on mobile)
- **SC-005**: Core workflows are completable on mobile with equivalent tap counts:
  - Start day: 1 tap (same as 1 click)
  - Complete current task: 2 taps (tap row to reveal, tap complete - vs 1 click on desktop hover)
  - View schedule: 0 taps (visible on load, same as desktop)
  - Start specific task: 2 taps (tap row, tap start - vs 1 click on desktop hover)
- **SC-006**: Layout renders correctly in both portrait and landscape orientations
- **SC-007**: Visual design maintains consistency across breakpoints:
  - Color palette identical across all viewports
  - Typography scale follows defined responsive sizing (text-2xl → text-4xl)
  - Spacing uses consistent Tailwind scale (gap-2, p-2 on mobile; gap-4, p-4 on desktop)
  - Component visual hierarchy preserved (current task prominently styled on all sizes)
