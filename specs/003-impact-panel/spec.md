# Feature Specification: Schedule Impact Panel

**Feature Branch**: `003-impact-panel`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "I would like to add a panel to show the impact of my progress. The impact should be clearly graying out the tasks that have been completed, show hazard around (yellow if we are getting close or within 5 minutes of missing and red if we are likely to miss the appointment) the fixed tasks. I would like to be able to move tasks around in order to go back to green. For example task 1 is taking an extra hour and that makes fixed appointment at 11:00am red, then I can move a task after the current task to the end of the day and hopefully the fixed appointment becomes green again"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Real-Time Schedule Impact (Priority: P1)

As a user tracking my day, I want to see a visual panel showing all my tasks with clear status indicators so I can immediately understand how my current progress affects my upcoming appointments.

**Why this priority**: This is the core value proposition - users need visibility into their schedule impact before they can take corrective action. Without this visibility, the rest of the feature has no context.

**Independent Test**: Can be fully tested by starting a day with multiple tasks (including fixed appointments), spending time on tasks, and verifying the panel displays correct status colors and completed task styling.

**Acceptance Scenarios**:

1. **Given** a user has started tracking their day with multiple tasks, **When** the impact panel is displayed, **Then** all tasks are shown in a list with their scheduled times and current status.

2. **Given** a task has been completed, **When** viewing the impact panel, **Then** that task appears grayed out to visually distinguish it from remaining tasks.

3. **Given** the user is currently working on a task, **When** viewing the impact panel, **Then** the current task is clearly highlighted as "in progress."

---

### User Story 2 - Fixed Task Risk Indicators (Priority: P1)

As a user with fixed appointments (meetings, calls), I want to see warning indicators on my fixed tasks showing whether I'm at risk of missing them so I can proactively adjust my schedule.

**Why this priority**: Equal priority to P1 because risk indicators are essential for users to understand the urgency of schedule conflicts - this is the "hazard" visualization the user explicitly requested.

**Independent Test**: Can be tested by setting up a schedule with fixed tasks, intentionally running overtime on the current task, and verifying the fixed task indicators change color appropriately.

**Acceptance Scenarios**:

1. **Given** the projected completion time of all preceding tasks puts a fixed task on schedule, **When** viewing the impact panel, **Then** that fixed task shows a green (safe) status indicator.

2. **Given** the projected completion puts a fixed task within 5 minutes of being missed, **When** viewing the impact panel, **Then** that fixed task shows a yellow (warning) status indicator.

3. **Given** the projected completion puts a fixed task past its scheduled start time, **When** viewing the impact panel, **Then** that fixed task shows a red (danger) status indicator.

4. **Given** a user is running overtime on the current task, **When** the overtime accumulates, **Then** the status indicators on downstream fixed tasks update in real-time to reflect the new projected impact.

---

### User Story 3 - Reorder Tasks to Resolve Conflicts (Priority: P2)

As a user who sees a red or yellow warning on a fixed task, I want to be able to reorder my flexible tasks within the impact panel so I can recover my schedule and turn the fixed task indicator back to green.

**Why this priority**: This is the corrective action that follows from seeing the risk indicators. While critical, it depends on P1 stories being complete first.

**Independent Test**: Can be tested by creating a schedule conflict (red indicator on fixed task), dragging a flexible task to after the fixed task, and verifying the indicator changes to green.

**Acceptance Scenarios**:

1. **Given** a user sees a yellow or red indicator on a fixed task, **When** they drag a flexible task from before to after the fixed task, **Then** the schedule recalculates and the fixed task indicator updates accordingly.

2. **Given** a user is reordering tasks, **When** they attempt to move a fixed task, **Then** the system prevents the move (fixed tasks cannot be reordered).

3. **Given** a user has moved a flexible task to resolve a conflict, **When** the task is dropped in the new position, **Then** all task start times and indicators update immediately to reflect the new order.

4. **Given** a user is in the middle of the current task, **When** they reorder tasks in the panel, **Then** only tasks after the current task can be moved (completed and current tasks are locked).

---

### User Story 4 - Persistent Schedule Changes (Priority: P3)

As a user who has reordered my schedule, I want my changes to persist so that the new order is maintained throughout the day and across page reloads.

**Why this priority**: Quality-of-life improvement that ensures user's corrective actions aren't lost, but the core functionality works without persistence.

**Independent Test**: Can be tested by reordering tasks, refreshing the page, and verifying the new order is maintained.

**Acceptance Scenarios**:

1. **Given** a user has reordered tasks in the impact panel, **When** they continue tracking their day, **Then** the new order is used for all subsequent tasks.

2. **Given** a user has reordered tasks, **When** the page is reloaded, **Then** the reordered schedule is restored.

---

### User Story 5 - Task Correction (Priority: P2)

As a user who made a mistake (accidentally completed a task or logged the wrong time), I want to be able to correct task elapsed times and mark tasks as incomplete so I can maintain accurate records without restarting my day.

**Why this priority**: Error correction is essential for data accuracy but requires the core tracking functionality to be in place first.

**Independent Test**: Can be tested by completing a task, double-clicking to edit, changing the elapsed time, and verifying the change persists. Also test marking a task as incomplete and verifying the timer continues from the preserved elapsed time.

**Acceptance Scenarios**:

1. **Given** a task has been completed, **When** the user double-clicks the task in the impact panel, **Then** a dialog appears showing the elapsed time field which can be edited.

2. **Given** a user is editing a completed task's elapsed time, **When** they save the change, **Then** the new elapsed time is persisted and lag calculations are updated.

3. **Given** a user is editing the current task, **When** they modify the elapsed time and save, **Then** the timer updates to reflect the new elapsed time.

4. **Given** a task has been completed, **When** the user clicks "Mark as Incomplete" and confirms, **Then** the task becomes the current task and the timer continues from the preserved elapsed time.

---

### User Story 6 - Jump to Any Task (Priority: P2)

As a user whose schedule has changed (meeting moved up, urgent task appeared), I want to start any pending task immediately so I can adapt to changing circumstances without losing tracking data.

**Why this priority**: Schedule flexibility is critical for real-world use but depends on core task tracking being complete.

**Independent Test**: Can be tested by hovering over a pending task, clicking "Start", and verifying the current task is completed and the new task becomes current with a fresh timer.

**Acceptance Scenarios**:

1. **Given** a user hovers over a pending task in the impact panel, **When** viewing the task row, **Then** a "Start" button appears.

2. **Given** a user clicks "Start" on a pending task, **When** the action completes, **Then** the current task is marked complete with its elapsed time and the selected task becomes current.

3. **Given** a user jumps to a task that is not the next sequential task, **When** the jump completes, **Then** intermediate tasks remain as "pending" and can be worked on later or reordered.

---

### Edge Cases

- What happens when all remaining flexible tasks are moved and the fixed task is still red? The user should see a clear indication that no further schedule adjustments can help.
- How does the system handle multiple fixed tasks where saving one causes another to go red? The panel should show the cascading effect in real-time as tasks are dragged.
- What happens when a user completes a task much faster than planned? The indicators should update to reflect the gained time (potentially turning red/yellow to green).
- What happens when there are no flexible tasks to move? The panel should show no drag handles on any tasks.
- What happens if the current task is the last flexible task before a fixed task at risk? The user cannot make schedule changes but should see the warning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an impact panel showing all tasks for the current day during active tracking.
- **FR-002**: System MUST visually gray out completed tasks in the impact panel.
- **FR-003**: System MUST highlight the currently active task distinctly from pending and completed tasks.
- **FR-004**: System MUST calculate projected completion times for all remaining tasks based on: current task elapsed time + remaining task durations.
- **FR-005**: System MUST display a green indicator on fixed tasks when projected to be on-time (more than 5 minutes buffer).
- **FR-006**: System MUST display a yellow indicator on fixed tasks when projected to start within 5 minutes of scheduled time (warning threshold).
- **FR-007**: System MUST display a red indicator on fixed tasks when projected to miss their scheduled start time.
- **FR-008**: System MUST update fixed task indicators in real-time as the current task timer progresses.
- **FR-009**: System MUST allow users to drag and drop flexible tasks to reorder them within the impact panel.
- **FR-010**: System MUST prevent reordering of fixed tasks (they maintain their scheduled position).
- **FR-011**: System MUST prevent reordering of completed tasks.
- **FR-012**: System MUST allow reordering of the current task if it is flexible (updating currentTaskIndex accordingly).
- **FR-013**: System MUST recalculate all projected times and indicators immediately when tasks are reordered.
- **FR-014**: System MUST persist task reordering to maintain changes across page reloads.
- **FR-015**: System MUST show scheduled start times for all tasks in the panel.
- **FR-016**: System MUST allow users to edit elapsed time for completed tasks via the edit dialog.
- **FR-017**: System MUST allow users to edit elapsed time for the current task via the edit dialog.
- **FR-018**: System MUST allow users to mark a completed task as incomplete, preserving its elapsed time.
- **FR-019**: System MUST display a "Start" button on pending tasks (visible on hover) to allow jumping to any task.
- **FR-020**: System MUST complete the current task when user jumps to another task, recording elapsed time.
- **FR-021**: System MUST preserve intermediate tasks as "pending" when user jumps ahead in the schedule.

### Key Entities

- **Task Status**: Represents the current state of a task (completed, in-progress, pending) for visual styling purposes.
- **Risk Level**: Represents the projected impact status for fixed tasks (green/safe, yellow/warning, red/danger) based on schedule projections.
- **Projected Timeline**: The calculated start and end times for all remaining tasks based on current progress and accumulated lag/gain.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify at-risk fixed appointments within 2 seconds of viewing the impact panel.
- **SC-002**: Users can successfully reorder tasks to resolve a schedule conflict in under 10 seconds.
- **SC-003**: Risk indicators update within 1 second of any change (timer tick, task completion, task reorder).
- **SC-004**: 100% of schedule reorderings persist correctly across page reloads.
- **SC-005**: Users can see projected arrival time for each fixed task in the impact panel (enabling informed decisions).
- **SC-006**: Zero fixed tasks can be accidentally moved by users (enforcement rate 100%).

## Assumptions

- The warning threshold of 5 minutes for yellow indicators is appropriate for most users' needs. This can be made configurable in a future iteration if needed.
- Fixed tasks represent appointments that have an external dependency (meetings, calls) and cannot be rescheduled within the app.
- The impact panel uses a side-by-side layout: timer/current task on left, impact panel on right, allowing users to see both focus and schedule impact without scrolling.
- Users understand the color convention: green = safe, yellow = caution, red = danger.
- Flexible tasks (including the current task) can be reordered; only completed tasks and fixed tasks are locked.
- When marking a task as incomplete, the elapsed time is preserved so users don't lose their progress.

## Clarifications

### Session 2025-12-18

- Q: Where should the impact panel appear in relation to the current timer display? → A: Side-by-side layout: timer on left, impact panel on right
