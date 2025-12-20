# Feature Specification: Ad-Hoc Task Creation

**Feature Branch**: `009-ad-hoc-tasks`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "we want to add the ability to create a task on the fly during the day. For example, at 2:00pm, I was asked to setup a call at 4:00pm with the CEO. I want to be able to track these tasks which are added after the start of the day but they should be treated like any other task in the day's schedule."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Ad-Hoc Fixed Task (Priority: P1)

A user is working through their day when they receive an unexpected request that requires scheduling a specific time-bound commitment (like a meeting or call). They need to add this new task to their existing schedule without disrupting their current workflow, and the task should be treated exactly like any task from the original imported schedule.

**Why this priority**: This is the core use case described - adding unplanned fixed-time commitments (like a CEO call at 4:00 PM) that must happen at a specific time. Without this, users cannot adapt their day to real-world scheduling changes.

**Independent Test**: Can be fully tested by creating a fixed task during an active session and verifying it appears in the schedule at the correct time with proper risk indicators.

**Acceptance Scenarios**:

1. **Given** I have an active day session in progress, **When** I create a new fixed task with name "CEO Call", start time "4:00 PM", and duration "30 minutes", **Then** the task appears in my Schedule Impact panel at the correct position based on its start time.

2. **Given** I have created an ad-hoc fixed task, **When** I view the Schedule Impact panel, **Then** the task shows risk indicators (green/yellow/red) based on my current progress just like imported fixed tasks.

3. **Given** my schedule projects I will be late for the ad-hoc fixed task, **When** I view my current task, **Then** I see a warning alert about the upcoming fixed task conflict.

---

### User Story 2 - Create Ad-Hoc Flexible Task (Priority: P2)

A user receives an unexpected work item during their day that doesn't have a fixed time requirement but needs to be tracked. They want to add it to their schedule as a flexible task that can be reordered among other flexible tasks.

**Why this priority**: Flexible tasks are common (quick follow-ups, additional work items) and allow users to capture all work without strict time constraints.

**Independent Test**: Can be fully tested by creating a flexible task during an active session and verifying it can be reordered via drag-and-drop.

**Acceptance Scenarios**:

1. **Given** I have an active day session, **When** I create a new flexible task with name "Follow-up email" and duration "15 minutes", **Then** the task appears in my Schedule Impact panel after the current task.

2. **Given** I have created an ad-hoc flexible task, **When** I drag it to a different position among other flexible pending tasks, **Then** the task moves to the new position and projections update accordingly.

---

### User Story 3 - Quick Task Entry (Priority: P2)

A user needs to quickly capture a new task without leaving their current workflow. The entry process should be fast and non-disruptive, allowing them to return to their current task immediately.

**Why this priority**: Speed of entry is critical during an active workday - users shouldn't lose focus on their current task while adding new ones.

**Independent Test**: Can be fully tested by timing the task creation flow and verifying it completes within the target time.

**Acceptance Scenarios**:

1. **Given** I am working on a task, **When** I click "Add Task" (or use a keyboard shortcut), **Then** a task entry form appears without navigating away from my current view.

2. **Given** the task entry form is open, **When** I enter task name and duration (minimum required fields), **Then** I can save the task with a single action.

3. **Given** I have saved a new ad-hoc task, **When** the form closes, **Then** I am returned to my previous view with the new task visible in the schedule.

---

### User Story 4 - Track Ad-Hoc Tasks in Analytics (Priority: P3)

A user wants to see how much of their day was spent on planned vs. unplanned work. Ad-hoc tasks should be distinguishable from originally imported tasks in analytics and exports.

**Why this priority**: Understanding planned vs. unplanned work helps users improve future planning, but this is an enhancement on top of core functionality.

**Independent Test**: Can be fully tested by completing ad-hoc tasks and verifying they appear correctly in analytics with proper categorization.

**Acceptance Scenarios**:

1. **Given** I have completed both imported and ad-hoc tasks, **When** I view my Analytics dashboard, **Then** I can see how many tasks were ad-hoc vs. planned.

2. **Given** I export my day's data, **When** I open the export file, **Then** ad-hoc tasks are marked or grouped separately from imported tasks.

---

### Edge Cases

- What happens when a user creates a fixed task with a start time that has already passed? System warns but allows creation, task is marked as "missed" if start time was before current time.
- What happens when a user creates a fixed task that conflicts with another fixed task? System displays a warning about the time overlap but allows creation.
- How does the system handle ad-hoc tasks when the day ends early? Treat same as imported tasks - mark as pending/missed based on completion status.
- What happens when a user tries to add a task while interrupted? Allow task creation during interruption - does not affect interruption timer.
- What is the maximum number of ad-hoc tasks a user can add? No artificial limit - same as imported tasks.
- What happens if user tries to add ad-hoc task before starting day? Button is disabled or hidden - ad-hoc tasks require an active session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create new tasks during an active day session
- **FR-002**: System MUST support both "fixed" and "flexible" task types for ad-hoc tasks
- **FR-003**: Ad-hoc tasks MUST require at minimum: task name, duration, and type
- **FR-004**: Ad-hoc fixed tasks MUST also require a start time
- **FR-005**: Ad-hoc tasks MUST appear in the Schedule Impact panel immediately after creation
- **FR-006**: Ad-hoc tasks MUST be positioned correctly based on type (fixed at scheduled time, flexible after current task)
- **FR-007**: Ad-hoc tasks MUST participate in all schedule calculations (projections, risk indicators, warnings)
- **FR-008**: Ad-hoc tasks MUST be reorderable (if flexible) via drag-and-drop like imported tasks
- **FR-009**: Ad-hoc tasks MUST be editable (name, duration, type, start time) like imported tasks
- **FR-010**: Ad-hoc tasks MUST be tracked in session progress and contribute to analytics
- **FR-011**: Ad-hoc tasks MUST be included in data exports with an indicator distinguishing them from imported tasks
- **FR-012**: Ad-hoc tasks MUST persist across page refresh as part of session state
- **FR-013**: System MUST warn users when creating a fixed task with a past start time
- **FR-014**: System MUST warn users when creating a fixed task that overlaps with an existing fixed task
- **FR-015**: System MUST provide a keyboard shortcut for quick task creation
- **FR-016**: Add Task button MUST only be enabled during an active day session

### Key Entities

- **AdHocTask**: Extends the existing ConfirmedTask with an `isAdHoc: boolean` flag to distinguish from imported tasks. Shares all other properties: taskId, name, type, plannedStart, plannedDurationSec, sortOrder.
- **TaskSource**: Distinguishes between "imported" (from file upload) and "ad-hoc" (created during session) tasks for analytics and export purposes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create an ad-hoc task in under 15 seconds from button click to task appearing in schedule
- **SC-002**: Ad-hoc tasks integrate seamlessly - 100% of existing task features work with ad-hoc tasks (timer, completion, interruptions, notes, analytics, export)
- **SC-003**: 95% of users can successfully create an ad-hoc task without referring to documentation on first attempt
- **SC-004**: Schedule projections update within 1 second of ad-hoc task creation
- **SC-005**: Ad-hoc task data persists correctly across page refresh with zero data loss

## Clarifications

### Q1: Default Task Type Selection
**Question**: What should be the default task type when opening the Add Task form?
**Answer**: Default based on context - the form defaults to "flexible" unless the user enters a start time, in which case it automatically switches to "fixed" type.

## Assumptions

- Ad-hoc tasks use the same duration formats as imported tasks (e.g., "30m", "1h 30m")
- The default position for new flexible tasks is immediately after the current task
- Ad-hoc tasks are created for the current day only (no future day planning)
- Time input will use the same formats supported by import (12-hour or 24-hour)
- The keyboard shortcut will follow existing patterns (Ctrl/Cmd + T for "Task")
- Ad-hoc tasks can be deleted before they are started (pending status) - uses existing task deletion functionality, no new implementation required
