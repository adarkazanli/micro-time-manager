# Feature Specification: Day Tracking Timer

**Feature Branch**: `002-day-tracking`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Tracking Your Day - Timer display with countdown, task completion, schedule lag, and fixed task warnings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Day and View Timer (Priority: P1)

As a user with an imported schedule, I want to start my day and see a countdown timer for my current task so I can track my time against the plan.

**Why this priority**: This is the core functionality - without a working timer display, the entire day tracking feature is non-functional. Users need to see their current task and remaining time to manage their schedule.

**Independent Test**: Can be fully tested by importing a schedule, clicking "Start Day", and verifying the timer counts down while displaying the current task name and type.

**Acceptance Scenarios**:

1. **Given** a confirmed schedule with tasks, **When** I click "Start Day", **Then** the timer starts counting down from the first task's duration
2. **Given** the timer is running, **When** I view the main screen, **Then** I see the countdown timer, task name, task type badge, and lag indicator
3. **Given** the timer is running, **When** time passes, **Then** the countdown updates every second

---

### User Story 2 - Complete Task and Auto-Advance (Priority: P1)

As a user tracking my day, I want to complete a task and have the next task automatically start so I can maintain my workflow momentum.

**Why this priority**: Task completion is essential for progressing through the schedule. Without this, users cannot advance beyond the first task.

**Independent Test**: Can be fully tested by starting a task, clicking "Complete Task", and verifying the next task begins automatically with its timer.

**Acceptance Scenarios**:

1. **Given** a task is in progress, **When** I click "Complete Task", **Then** the actual time is recorded and the next task starts immediately
2. **Given** I complete a task, **When** the next task starts, **Then** its countdown timer begins from the planned duration
3. **Given** I am on the last task, **When** I click "Complete Task", **Then** the day is marked complete and a summary is shown

---

### User Story 3 - Timer State Visual Feedback (Priority: P2)

As a user tracking my day, I want the timer display to change color based on time remaining so I can quickly understand my status at a glance.

**Why this priority**: Visual feedback enhances usability but the timer functions without it. This improves the user experience significantly.

**Independent Test**: Can be fully tested by observing the timer color as time progresses through running, warning, and overdrawn states.

**Acceptance Scenarios**:

1. **Given** more than 5 minutes remain on a task, **When** I view the timer, **Then** the numbers display in green (running state)
2. **Given** less than 5 minutes remain on a task, **When** I view the timer, **Then** the numbers display in yellow (warning state)
3. **Given** the allocated time is exceeded, **When** I view the timer, **Then** the numbers display in red with a negative value (overdrawn state)

---

### User Story 4 - Schedule Lag Indicator (Priority: P2)

As a user tracking my day, I want to see how far ahead or behind schedule I am so I can adjust my pace accordingly.

**Why this priority**: The lag indicator provides critical awareness of overall schedule health, helping users make informed decisions about time allocation.

**Independent Test**: Can be fully tested by completing tasks faster or slower than planned and observing the lag indicator update.

**Acceptance Scenarios**:

1. **Given** I complete tasks faster than planned, **When** I view the lag indicator, **Then** it shows "X min ahead" in green
2. **Given** I am on schedule, **When** I view the lag indicator, **Then** it shows "On schedule" in green
3. **Given** I complete tasks slower than planned, **When** I view the lag indicator, **Then** it shows "X min behind" in yellow (1-10 min) or red (>10 min)

---

### User Story 5 - Fixed Task Warnings (Priority: P3)

As a user tracking flexible tasks, I want to be warned when my current pace will make me late for an upcoming fixed task so I can adjust my schedule.

**Why this priority**: Fixed task warnings are an advanced feature that depends on lag calculation working correctly. It provides proactive guidance but isn't essential for basic tracking.

**Independent Test**: Can be fully tested by creating a schedule with a fixed task, running behind on a flexible task, and observing the warning message appear.

**Acceptance Scenarios**:

1. **Given** a fixed task is upcoming and current pace would cause a conflict, **When** I view the timer screen, **Then** a warning displays: "At current pace, you will be X minutes late for [Task Name]"
2. **Given** a warning is displayed, **When** I complete tasks and get back on schedule, **Then** the warning disappears
3. **Given** no schedule conflict exists, **When** I view the timer screen, **Then** no warning is displayed

---

### Edge Cases

- What happens when the user refreshes the page mid-task? Timer state should persist and resume from saved position
- How does the system handle when all tasks are complete? Display a day summary with total time tracked vs planned
- What happens if a user tries to start a day with no imported schedule? Show an error prompting them to import a schedule first
- How does the system handle negative lag (ahead of schedule) when the buffer exceeds 60 minutes? Display as "1 hr 5 min ahead"
- What happens if a fixed task's start time has already passed when starting the day? Mark the task as "missed" and start with the next available task
- What happens if the user opens the app in multiple browser tabs? Display a warning in secondary tabs indicating another session is active, and disable timer controls to prevent conflicts

### Out of Scope

- **Pause/Resume functionality**: Timer runs continuously without pause capability; interruption tracking will be a separate feature

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a countdown timer showing time remaining on the current task
- **FR-002**: System MUST display the current task name prominently on the timer screen
- **FR-003**: System MUST display a badge indicating task type (fixed or flexible)
- **FR-004**: System MUST display a lag indicator showing how far ahead or behind schedule the user is
- **FR-005**: System MUST update the countdown timer every second
- **FR-006**: System MUST change timer color to green when more than 5 minutes remain
- **FR-007**: System MUST change timer color to yellow when 5 minutes or less remain
- **FR-008**: System MUST change timer color to red and show negative time when duration is exceeded
- **FR-009**: System MUST provide a "Start Day" button to begin tracking the first task
- **FR-010**: System MUST provide a "Complete Task" button to finish the current task
- **FR-011**: System MUST automatically start the next task when current task is completed
- **FR-012**: System MUST record actual time spent on each completed task
- **FR-013**: System MUST calculate and update schedule lag after each task completion
- **FR-014**: System MUST display warnings when current pace conflicts with upcoming fixed tasks
- **FR-015**: System MUST persist timer state to survive page refreshes
- **FR-016**: System MUST display a day summary when all tasks are complete
- **FR-017**: System MUST detect and warn when opened in multiple browser tabs, disabling controls in secondary tabs

### Key Entities

- **Timer State**: Current task reference, elapsed time, timer status (running/complete), calculated lag
- **Task Progress**: Task ID, planned duration, actual duration, completion timestamp, status (pending/active/complete/missed)
- **Day Session**: Start timestamp, total planned time, total actual time, overall status, list of task progress records

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start tracking their day within 2 seconds of clicking "Start Day"
- **SC-002**: Timer display updates smoothly every second without visible lag or stutter
- **SC-003**: 95% of users can identify their current schedule status (ahead/behind) within 3 seconds of viewing the screen
- **SC-004**: Fixed task warnings appear at least 15 minutes before the potential conflict
- **SC-005**: Timer state persists correctly through page refresh 100% of the time
- **SC-006**: Users can complete a full day's schedule tracking without any system errors

## Clarifications

### Session 2025-12-18

- Q: Should users be able to pause the timer mid-task? → A: No pause - timer runs continuously until task completion (interruption tracking deferred to separate feature)
- Q: How should the system handle multiple browser tabs? → A: Single active session only - warn and disable controls if another tab is active

## Assumptions

- Users have already imported a valid schedule using the schedule import feature (001-schedule-import)
- The application runs in a modern browser that supports localStorage for state persistence
- Time calculations use the device's local time
- A "day" is defined as the time span from the first task's start time to the last task's end time
- Warning threshold for fixed task conflicts is set at current lag + remaining time on current task
