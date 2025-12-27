# Feature Specification: Fixed Task Reorder Behavior

**Feature Branch**: `012-fixed-task-reorder`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "let us fix the issue that when a task is switched to flexible, it should stay where it is in the list of tasks, if we change the task to fixed and specify the time, then the task will be moved to the appropriate time and auto scroll the user to the task"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Flexible Task Stays in Position (Priority: P1)

When a user switches a task from fixed to flexible, the task should remain at its current position in the list rather than being reordered. This preserves the user's intentional task ordering while simply removing the time constraint.

**Why this priority**: This is the most common use case - users often convert fixed appointments to flexible tasks when meetings are cancelled or rescheduled. Maintaining position prevents confusion and preserves the user's mental model of their schedule.

**Independent Test**: Can be fully tested by changing a fixed task to flexible and verifying it stays in the same list position.

**Acceptance Scenarios**:

1. **Given** a schedule with tasks [A, B (fixed at 10:00), C, D], **When** user changes task B from fixed to flexible, **Then** the task list remains [A, B, C, D] with B now showing as flexible
2. **Given** a fixed task in the middle of the list, **When** user removes the fixed time constraint, **Then** the task's position index does not change
3. **Given** a fixed task that was auto-positioned based on its time, **When** user converts it to flexible, **Then** it stays at its current position (does not move back to any "original" position)

---

### User Story 2 - Fixed Task Auto-Reorders by Time (Priority: P1)

When a user switches a task from flexible to fixed and specifies a start time, the task should automatically move to the chronologically correct position in the list based on the specified time.

**Why this priority**: This is the complementary behavior to P1 and equally important. When users designate a task as a fixed appointment, they expect it to be placed at the correct chronological position to accurately reflect their schedule.

**Independent Test**: Can be fully tested by changing a flexible task to fixed with a specific time and verifying it moves to the correct chronological position.

**Acceptance Scenarios**:

1. **Given** a schedule with tasks starting at [8:00, 9:00, 11:00], **When** user changes a flexible task to fixed at 10:00, **Then** the task moves to position 3 (between 9:00 and 11:00)
2. **Given** a flexible task at the end of the list, **When** user sets it as fixed at 8:00 AM (earliest time), **Then** the task moves to the first position
3. **Given** a flexible task at position 1, **When** user sets it as fixed at 5:00 PM (latest time), **Then** the task moves to the last position among scheduled tasks
4. **Given** multiple fixed tasks exist, **When** user adds a new fixed task with a time between two existing fixed tasks, **Then** the new task is inserted at the correct chronological position

---

### User Story 3 - Auto-Scroll to Repositioned Task (Priority: P2)

After a task is automatically repositioned due to becoming fixed, the view should scroll to show the task at its new position, ensuring the user can see where their task ended up.

**Why this priority**: This is a UX enhancement that prevents user confusion. Without auto-scroll, users may not immediately see where their task moved, especially in longer lists.

**Independent Test**: Can be tested by positioning a task outside the visible area after type change and verifying the viewport scrolls to reveal it.

**Acceptance Scenarios**:

1. **Given** a long task list where the target position is outside the viewport, **When** a task is repositioned due to becoming fixed, **Then** the list scrolls to make the repositioned task visible
2. **Given** the repositioned task is already visible, **When** the reorder completes, **Then** no scrolling occurs (avoid unnecessary movement)
3. **Given** a task is repositioned, **When** the scroll completes, **Then** the repositioned task is visually highlighted briefly to draw user attention

---

### Edge Cases

- What happens when a fixed task is set to a time that conflicts with another fixed task? The task is still repositioned chronologically; existing conflict warnings handle the overlap.
- What happens when a task at the top of the list becomes fixed with a later time? It moves down to its chronological position.
- What happens when the user rapidly changes task types multiple times? Each change should be processed; debouncing prevents excessive reorders.
- What happens when multiple tasks have the same fixed time? Tasks with the same time maintain their relative order among themselves.
- What happens when converting to fixed but no time is specified? The task should require a time to become fixed; cannot be fixed without a time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST keep a task in its current list position when the task type changes from fixed to flexible (position index unchanged)
- **FR-003**: System MUST automatically reposition a task to its chronologically correct position when the task type changes from flexible to fixed
- **FR-004**: System MUST insert fixed tasks in chronological order based on their specified start time
- **FR-005**: System MUST scroll the task list to make the repositioned task visible after a reorder operation
- **FR-006**: System MUST only scroll when the repositioned task would be outside the visible viewport
- **FR-007**: System MUST visually highlight the repositioned task briefly after scrolling to help users locate it
- **FR-008**: System MUST handle same-time fixed tasks by maintaining their relative order
- **FR-009**: System MUST require a start time when converting a task to fixed type
- **FR-010**: System MUST apply this reorder behavior consistently in both SchedulePreview (pre-session) and ImpactPanel (during session)

### Key Entities

- **Task Position**: The index of a task within the ordered task list; determines display order
- **Task Type**: Either "fixed" (has immutable start time) or "flexible" (start time calculated dynamically)
- **Chronological Position**: The position a task should occupy based on its start time relative to other tasks

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Flexible tasks maintain their exact list position 100% of the time when converted from fixed
- **SC-002**: Fixed tasks are positioned in correct chronological order within 200ms of the type change
- **SC-003**: Auto-scroll completes within 300ms of task repositioning
- **SC-004**: Users can locate their repositioned task without manual scrolling in 100% of cases where scroll is needed
- **SC-005**: The visual highlight on repositioned tasks is noticeable but non-disruptive (subtle animation or brief color change)

## Assumptions

- The existing schedule calculator determines calculated start times for flexible tasks; this feature only affects list ordering, not time calculation
- The EditTaskDialog already supports changing task type between fixed and flexible
- Conflict warnings for overlapping fixed tasks are handled by the existing ConflictWarning component
- The task list containers (SchedulePreview, ImpactPanel) support programmatic scrolling
