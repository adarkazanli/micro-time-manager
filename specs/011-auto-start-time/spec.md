# Feature Specification: Automatic Start Time Calculation Based on Task Priority

**Feature Branch**: `011-auto-start-time`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "Implement automatic calculation of task start times based on task sequence and duration. When tasks are added, modified, or rescheduled, the system should dynamically recalculate all start times while respecting fixed-time appointments."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sequential Task Scheduling (Priority: P1)

As a user managing my daily tasks, I want the system to automatically calculate start times for my tasks based on their order and duration, so I don't have to manually set each start time.

**Why this priority**: This is the core value proposition of the feature. Without automatic sequential scheduling, users must manually calculate and update every start time, which is tedious and error-prone. This story alone provides significant value even without fixed-time appointments.

**Independent Test**: Can be fully tested by adding 3-4 tasks with different durations and verifying that start times are automatically calculated sequentially from the current time. Delivers immediate value by eliminating manual time calculations.

**Acceptance Scenarios**:

1. **Given** the current time is 8:30 AM and an empty task list, **When** I add a task with duration 2 hours, **Then** the task's calculated start time is 8:30 AM.
2. **Given** Task 1 starts at 8:30 AM with duration 2 hours, **When** I add Task 2 with duration 30 minutes, **Then** Task 2's calculated start time is 10:30 AM.
3. **Given** three tasks in sequence, **When** I remove the middle task, **Then** the third task's start time recalculates to immediately follow the first task.
4. **Given** three tasks in sequence, **When** I change the duration of the first task, **Then** all subsequent task start times recalculate accordingly.
5. **Given** tasks in a list, **When** I reorder tasks by dragging, **Then** all start times recalculate based on the new order.

---

### User Story 2 - Fixed-Time Appointments (Priority: P2)

As a user with scheduled meetings, I want to mark certain tasks as "fixed-time" appointments that cannot be moved, so the system schedules around them.

**Why this priority**: Fixed-time appointments are essential for real-world scheduling but build upon the sequential scheduling foundation. Many users have meetings or appointments that must happen at specific times.

**Independent Test**: Can be tested by adding a fixed-time appointment and verifying it displays at the specified time with a visual indicator. The appointment should not shift when other tasks are added.

**Acceptance Scenarios**:

1. **Given** I'm adding a new task, **When** I toggle the "fixed time" option and set a specific start time, **Then** the task is marked as a fixed-time appointment.
2. **Given** a fixed-time appointment exists, **When** I view the task list, **Then** the fixed appointment displays a clear visual indicator (icon or badge) distinguishing it from normal tasks.
3. **Given** a fixed-time appointment at 9:00 AM, **When** I add or remove other tasks, **Then** the fixed appointment remains at 9:00 AM.
4. **Given** a fixed-time appointment, **When** I edit it, **Then** I can change or remove the fixed-time designation.

---

### User Story 3 - Task Interruption and Resumption (Priority: P3)

As a user with a task in progress when a fixed appointment arrives, I want the system to pause my current task and resume it after the appointment, so I can accurately track my remaining work.

**Why this priority**: This is an advanced scheduling scenario that provides accurate time tracking when appointments interrupt ongoing work. It depends on both sequential scheduling (P1) and fixed appointments (P2).

**Independent Test**: Can be tested by creating a 2-hour task starting at 8:30 AM and a fixed 1-hour meeting at 9:00 AM. Verify the task shows as paused during the meeting and displays 1.5 hours remaining after.

**Acceptance Scenarios**:

1. **Given** Task 1 (2 hours) starts at 8:30 AM and a fixed meeting exists at 9:00 AM (1 hour), **When** the schedule is calculated, **Then** Task 1 shows it will pause at 9:00 AM with 1.5 hours remaining.
2. **Given** an interrupted task with remaining time, **When** viewing the schedule, **Then** the task displays clearly showing both original duration and remaining duration.
3. **Given** a fixed appointment completes, **When** viewing the schedule after, **Then** the interrupted task resumes immediately following the appointment.
4. **Given** multiple fixed appointments in a row, **When** they interrupt a task, **Then** the task resumes after all consecutive appointments complete.

---

### User Story 4 - Schedule Conflict Warnings (Priority: P4)

As a user adding fixed-time appointments, I want to be warned when appointments would overlap or create conflicts, so I can address scheduling issues proactively.

**Why this priority**: Conflict detection is a convenience feature that prevents user errors. The core scheduling works without it, but it improves the user experience significantly.

**Independent Test**: Can be tested by adding two fixed appointments that overlap in time and verifying a warning message appears.

**Acceptance Scenarios**:

1. **Given** a fixed appointment exists at 9:00 AM for 1 hour, **When** I add another fixed appointment at 9:30 AM, **Then** a warning is displayed about the overlap.
2. **Given** an overlap warning is shown, **When** I proceed anyway, **Then** the system allows the appointment but maintains the warning indicator.
3. **Given** overlapping fixed appointments, **When** I edit one to resolve the conflict, **Then** the warning disappears.

---

### Edge Cases

- **Empty task list**: System handles gracefully with no errors when no tasks exist.
- **All fixed appointments**: When all tasks are fixed-time, they display at their specified times without sequential calculation.
- **Fixed appointment at current time**: If a fixed appointment is scheduled for the current moment or past, it should appear at the top of the active schedule.
- **Overnight tasks**: Tasks extending past midnight display a visual warning but are still scheduled with correct times into the next day.
- **Zero-duration tasks**: Tasks with no duration should be handled as milestones taking no time.
- **Back-to-back fixed appointments**: Multiple consecutive fixed appointments should display correctly without gaps.
- **Fixed appointment in the past**: Past fixed appointments should be handled appropriately (completed or skipped).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically calculate start times for tasks based on their sequential order and duration.
- **FR-002**: System MUST recalculate all start times when a task is added to the list.
- **FR-003**: System MUST recalculate all start times when a task is removed from the list.
- **FR-004**: System MUST recalculate all start times when tasks are reordered.
- **FR-005**: System MUST recalculate all start times when a task's duration is changed.
- **FR-006**: System MUST allow users to designate a task as a "fixed-time" appointment with a specific, immovable start time.
- **FR-007**: System MUST display a clear visual indicator for fixed-time appointments (distinct from normal tasks).
- **FR-008**: Fixed-time appointments MUST NOT change their start time when other tasks are added, removed, or reordered.
- **FR-009**: System MUST calculate pause points when a fixed-time appointment interrupts an in-progress task.
- **FR-010**: System MUST track and display remaining duration for interrupted tasks.
- **FR-011**: System MUST schedule interrupted tasks to resume immediately after the interrupting fixed appointment completes.
- **FR-012**: System MUST handle multiple consecutive fixed appointments interrupting a single task.
- **FR-013**: System MUST display calculated start times as read-only for normal (non-fixed) tasks.
- **FR-014**: System MUST allow users to edit the start time only for fixed-time appointments.
- **FR-015**: System MUST warn users when fixed appointments overlap or create scheduling conflicts.
- **FR-016**: System MUST persist the fixed-time designation and associated start time for appointments.
- **FR-017**: System MUST perform recalculations efficiently without noticeable delay to the user.
- **FR-018**: System MUST allow users to set a custom schedule start time (e.g., 9:30 AM) or choose "Start Now" for immediate scheduling.
- **FR-019**: System MUST display a visual warning when the schedule extends past midnight while still allowing tasks to be scheduled.

### Key Entities

- **Task**: A unit of work with a name, duration, and optional fixed start time. Contains properties for tracking whether it's fixed-time, its calculated or specified start time, and remaining duration if interrupted.
- **Schedule**: The ordered collection of tasks with their calculated start times. Represents the day's timeline of work.
- **Interruption Segment**: When a task is interrupted by a fixed appointment, this represents the portion of the task before and after the interruption, tracking original duration vs. remaining duration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new task and see its calculated start time within 1 second without manual input.
- **SC-002**: When any task is modified (added, removed, reordered, duration changed), all affected start times update within 1 second.
- **SC-003**: Users can distinguish fixed-time appointments from normal tasks at a glance (visual indicator visible without interaction).
- **SC-004**: Users can see exactly how much time remains on an interrupted task before the next appointment.
- **SC-005**: The schedule correctly handles at least 50 tasks without performance degradation.
- **SC-006**: 95% of users can successfully add a fixed-time appointment on their first attempt.
- **SC-007**: Overlap warnings appear immediately when creating conflicting fixed appointments.

## Clarifications

### Session 2025-12-26

- Q: What determines the schedule starting point? → A: User-configurable start time with "Start Now" option for immediate scheduling.
- Q: How should schedule overflow (past midnight) be handled? → A: Show visual warning but allow schedule to extend past end of day.

## Assumptions

- The first task in the list begins at the user-configured schedule start time, or at the current time if "Start Now" is selected.
- Tasks are displayed and scheduled for a single day at a time.
- When a fixed-time appointment is in the past relative to the current time, it is treated as already completed.
- The system uses a linear (O(n)) algorithm to recalculate start times, iterating through tasks in order once.
- Recalculation is debounced during rapid successive edits (e.g., while typing duration) to prevent excessive computation.
- The visual indicator for fixed appointments will be a pin/lock icon consistent with common scheduling applications.
- Conflict warnings are non-blocking; users may choose to create overlapping appointments if desired.
