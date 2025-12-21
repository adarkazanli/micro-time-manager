# Feature Specification: Timer Persistence Across Browser/System Interruptions

**Feature Branch**: `010-timer-persistence`
**Created**: 2025-12-21
**Status**: Draft
**Input**: User description: "the timer should continue to run if the computer goes to sleep or if the browser is killed. for example if we are in the middle of a task with 20 minutes elapsed time and then browser is killed or i close the computer for say 30 minutes then the app when it starts should begin with 0 minutes"

## Clarifications

### Session 2025-12-21

- Q: What interval should the system use for periodic sync during active timing? → A: Every 10 seconds
- Q: Should the user see a notification when session is recovered after browser restart? → A: No, silently restore and continue

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Timer Continues After Browser Closure (Priority: P1)

A user is in the middle of a task with 20 minutes elapsed time when they accidentally close the browser or the browser crashes. When they reopen the app 10 minutes later, the timer should show 30 minutes elapsed (20 + 10), accurately reflecting that time continued to pass.

**Why this priority**: This is the core functionality that ensures users don't lose track of time when unexpected interruptions occur. Without this, the entire time tracking value is compromised when the app is closed.

**Independent Test**: Can be fully tested by starting a task, closing the browser, waiting a known interval, reopening the app, and verifying the elapsed time matches expectations.

**Acceptance Scenarios**:

1. **Given** a task is running with 20 minutes elapsed, **When** the user closes the browser and reopens after 10 minutes, **Then** the timer displays 30 minutes elapsed
2. **Given** a task is running with 5 minutes elapsed, **When** the browser crashes and is reopened after 2 minutes, **Then** the timer displays 7 minutes elapsed and continues counting
3. **Given** a task is running with 10 minutes elapsed on a 15-minute task, **When** the browser is closed and reopened after 10 minutes, **Then** the timer shows 20 minutes elapsed (5 minutes overtime)

---

### User Story 2 - Timer Continues During Computer Sleep (Priority: P1)

A user steps away from their computer with a task running. The computer goes to sleep. When they return and wake the computer, the timer should reflect all the time that passed, including the sleep period.

**Why this priority**: This addresses the most common real-world scenario where users leave their computer during a task. Equal priority with browser closure as both are critical interruption types.

**Independent Test**: Can be tested by starting a task, putting computer to sleep, waiting, waking the computer, and verifying elapsed time.

**Acceptance Scenarios**:

1. **Given** a task is running with 10 minutes elapsed, **When** the computer sleeps for 30 minutes, **Then** the timer shows 40 minutes elapsed when the computer wakes
2. **Given** a task is running with 5 minutes elapsed, **When** the computer sleeps and wakes repeatedly over 20 minutes, **Then** the timer accurately shows 25 minutes elapsed
3. **Given** a task is running, **When** the lid is closed and opened after an hour, **Then** the timer includes the full hour in elapsed time

---

### User Story 3 - Seamless Session Recovery on App Restart (Priority: P2)

When the app starts after an interruption, it should automatically restore the user to their previous state - same task, correct elapsed time, all previous task completions intact - without requiring any user intervention.

**Why this priority**: This ensures the user experience is smooth and uninterrupted. Without automatic recovery, users would need to manually restore their session.

**Independent Test**: Can be tested by completing some tasks, starting another, closing app, reopening, and verifying all state is preserved.

**Acceptance Scenarios**:

1. **Given** a user completed 3 tasks and is on task 4 with 15 minutes elapsed, **When** the app restarts, **Then** the user sees task 4 as current with correct elapsed time and tasks 1-3 marked complete
2. **Given** a session is running with accumulated lag of 5 minutes behind, **When** the app restarts, **Then** the lag display shows the correct "5 min behind" status
3. **Given** a task is running, **When** the app restarts, **Then** the timer immediately continues counting from the restored elapsed time without user action

---

### User Story 4 - Interruption Time Persists Across Browser/System Events (Priority: P1)

When a user logs an interruption (e.g., phone call, colleague visit) and the browser closes or computer sleeps during that interruption, the dead time should be added to the interruption's duration. Interruptions are treated like tasks for persistence purposes.

**Why this priority**: Interruptions are a key part of accurate time tracking. If interruption time is lost during browser events, users cannot accurately account for where their time went. This is equally critical as task timer persistence.

**Independent Test**: Can be tested by starting an interruption, closing the browser, waiting, reopening, and verifying the interruption duration includes the away time.

**Acceptance Scenarios**:

1. **Given** an interruption is active with 5 minutes elapsed, **When** the browser is closed and reopened after 10 minutes, **Then** the interruption shows 15 minutes elapsed
2. **Given** an interruption is being tracked, **When** the computer sleeps for 20 minutes, **Then** the interruption duration includes the 20 minutes of sleep time
3. **Given** an interruption was started before browser closure, **When** the app restarts, **Then** the user sees the interruption still active with correct accumulated time

---

### User Story 5 - Timer Handles Overtime Scenarios (Priority: P3)

Based on the user's example: if elapsed time exceeds the task's planned duration during an interruption, the timer should show negative time (overtime) correctly. The specific example of "20 minutes elapsed + 30 minutes away = app should begin with 0 minutes" suggests the timer should show the correct remaining time (which would be negative/overtime).

**Why this priority**: This is an extension of the core functionality that handles a specific edge case with overtime scenarios.

**Independent Test**: Can be tested by starting a short task, leaving for longer than the task duration, and verifying the overtime display.

**Acceptance Scenarios**:

1. **Given** a 25-minute task with 20 minutes elapsed, **When** the browser is closed for 30 minutes, **Then** upon reopening the timer shows 25 minutes overtime (displayed as -25:00 or similar)
2. **Given** a 10-minute task with 5 minutes elapsed, **When** the computer sleeps for 20 minutes, **Then** the timer shows 15 minutes overtime
3. **Given** a task already showing overtime of -5:00, **When** the browser is closed for 10 minutes, **Then** the timer shows -15:00 overtime upon reopening

---

### Edge Cases

- What happens when the stored timestamp is corrupted or in the future (clock sync issues)?
  - System should detect invalid timestamps and reset the timer with a warning
- How does the system handle very long interruptions (e.g., overnight)?
  - Timer continues to accumulate time; cap at 24 hours maximum for any single recovery
- What happens if the calculated elapsed time is unreasonably large (e.g., system clock jumped forward)?
  - Cap elapsed time at 24 hours; log warning for debugging
- What happens if the task was completed during the interruption window (manually marked elsewhere)?
  - System should respect the completed status and not override it
- What happens if browser storage is cleared while app is closed?
  - System starts fresh with no active session (graceful degradation)
- How does the system behave when the device clock changes (daylight saving, manual adjustment)?
  - Use monotonic elapsed time tracking where possible; cap recovered elapsed time at 24 hours maximum

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST persist the timer start timestamp and current elapsed time whenever timer state changes
- **FR-002**: System MUST restore timer state automatically when the application loads
- **FR-003**: System MUST calculate elapsed time based on the difference between the stored start timestamp and current time
- **FR-004**: System MUST immediately resume countdown display upon app load if a session was active
- **FR-005**: System MUST preserve all session context (current task index, completed tasks, lag) across interruptions
- **FR-006**: System MUST persist timer state before the page unloads (browser close, navigation away)
- **FR-007**: System MUST handle overtime scenarios correctly (elapsed time > planned duration)
- **FR-008**: System MUST validate restored timestamps and handle invalid/corrupt data gracefully
- **FR-009**: System MUST sync timer state to storage every 10 seconds during active timing (not just on page unload)
- **FR-010**: System MUST persist active interruption state (start timestamp, elapsed time) alongside task timer state
- **FR-011**: System MUST restore active interruption state on app load and continue accumulating time
- **FR-012**: System MUST treat interruptions equivalently to tasks for all persistence and recovery behaviors
- **FR-013**: System MUST restore session silently without user notification (no toast, modal, or alert on recovery)

### Key Entities

- **TimerSnapshot**: Captures the exact state of the timer at a point in time (elapsed time, running state, associated task ID, start timestamp)
- **InterruptionSnapshot**: Captures active interruption state (start timestamp, elapsed time, interruption type/reason)
- **SessionState**: Extended to include timer recovery data and active interruption recovery data

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Timer state survives browser closure and accurately reflects passed time within 1 second accuracy
- **SC-002**: Timer state survives computer sleep/wake cycles and accurately reflects passed time
- **SC-003**: Session recovery occurs automatically with no user intervention required
- **SC-004**: 100% of session data (task progress, lag, current position) is preserved across app restarts
- **SC-005**: App load time with session recovery is under 500ms perceived delay
- **SC-006**: Overtime scenarios display correctly when elapsed time exceeds planned duration
- **SC-007**: Active interruption state survives browser closure and accurately reflects passed time within 1 second accuracy

## Assumptions

- The device's system clock is reasonably accurate (small deviations of a few seconds are acceptable)
- Browser storage (localStorage) is available and has sufficient quota
- The existing storage service can be extended to handle timer persistence needs
- Users expect time to continue counting even when they're not actively viewing the app
