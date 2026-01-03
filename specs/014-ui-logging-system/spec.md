# Feature Specification: UI Logging System

**Feature Branch**: `014-ui-logging-system`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Create comprehensive logging system for debugging UI interactions and task switching issues. Bug context: Task 1 time is being incorrectly assigned to Task 2 when switching tasks."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Interaction Logs for Debugging (Priority: P1)

A developer or user needs to investigate unexpected behavior (such as task time being assigned to the wrong task) by reviewing a chronological log of all UI interactions and state changes.

**Why this priority**: This is the core purpose of the logging system - enabling post-hoc debugging of issues like the task switching bug described.

**Independent Test**: Can be fully tested by triggering various UI interactions (starting tasks, completing tasks, switching tasks) and verifying the log displays all actions with correct timestamps and context.

**Acceptance Scenarios**:

1. **Given** the user is on any screen of the application, **When** they press any interactive button (Start Task, Complete Task, End Day, etc.), **Then** a log entry is created with the action name, timestamp, and relevant context (task ID, elapsed time, etc.)
2. **Given** log entries have been created, **When** the user opens the log viewer, **Then** they see all entries in reverse chronological order (newest first) with timestamps, action names, and full context data
3. **Given** multiple actions have occurred, **When** viewing the logs, **Then** the user can clearly see the sequence of events with precise timing

---

### User Story 2 - Export Logs for External Analysis (Priority: P2)

A developer needs to export interaction logs to share with others or analyze in external tools for debugging complex issues.

**Why this priority**: Essential for bug reporting and collaborative debugging, but secondary to viewing logs within the app.

**Independent Test**: Can be tested by generating some log entries, triggering export, and verifying the exported file contains all log data in a readable format.

**Acceptance Scenarios**:

1. **Given** log entries exist, **When** the user clicks "Export Logs", **Then** a file is downloaded containing all log entries in a structured, readable format
2. **Given** the exported file, **When** opened in a text editor, **Then** the entries are clearly formatted with timestamps, actions, and context data

---

### User Story 3 - Clear Logs When Starting Fresh (Priority: P3)

A user wants to clear old logs to start fresh for a new debugging session or to free up storage space.

**Why this priority**: Maintenance feature that supports the primary debugging workflow but is not essential for core functionality.

**Independent Test**: Can be tested by creating log entries, triggering clear, and verifying the log is empty.

**Acceptance Scenarios**:

1. **Given** log entries exist, **When** the user clicks "Clear Logs", **Then** a confirmation prompt appears
2. **Given** the user confirms clearing, **When** viewing the log, **Then** all previous entries are removed
3. **Given** the user cancels clearing, **When** viewing the log, **Then** all entries remain intact

---

### Edge Cases

- What happens when logs accumulate over a very long session? System retains the last 1000 entries, automatically removing oldest entries when the limit is reached.
- What happens when storage is full? System gracefully handles storage limits and continues operating without logs if storage writes fail.
- What happens if the log viewer is open while new actions occur? New entries appear in real-time without requiring a manual refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST log every user-initiated button press with a unique identifier, timestamp, action type, and relevant context data
- **FR-002**: System MUST log these specific UI interactions:
  - Start Day button press
  - Complete Task button press (with task ID and elapsed time)
  - Start/Resume Task button press (with target task ID and current elapsed time)
  - End Day button press
  - Interrupt button press (with current task ID)
  - Resume from Interrupt button press
  - Add Task dialog submission (with new task details)
  - Task reorder actions (with from/to positions)
  - Edit Task actions (with task ID and changed fields)
  - Uncomplete Task actions (with task ID)
  - Back to Import / Start New Day button presses
- **FR-003**: Each log entry MUST include:
  - Timestamp (with millisecond precision)
  - Action type/name
  - Current task ID (if applicable)
  - Current task name (if applicable)
  - Timer elapsed time at moment of action (if timer is running)
  - Any action-specific parameters (e.g., target task for "Start Task")
  - Session status (idle, running, complete)
- **FR-004**: System MUST persist logs to local storage so they survive page refreshes
- **FR-005**: System MUST provide a log viewer accessible from the main UI (without disrupting active tracking)
- **FR-006**: System MUST display logs in reverse chronological order (newest first)
- **FR-007**: System MUST allow exporting all logs to a downloadable file
- **FR-008**: System MUST allow clearing all logs with user confirmation
- **FR-009**: System MUST retain logs across sessions until explicitly cleared by the user
- **FR-010**: System MUST update the log viewer in real-time as new actions occur
- **FR-011**: System MUST limit log storage to 1000 entries, automatically removing oldest entries when the limit is reached

### Key Entities

- **LogEntry**: Represents a single logged interaction. Attributes: unique id, timestamp (ISO string with milliseconds), action (string identifier), taskId (optional), taskName (optional), elapsedMs (optional), sessionStatus, parameters (map of action-specific key-value pairs)
- **LogStore**: Manages the collection of log entries with operations for adding, retrieving (all or paginated), exporting, and clearing entries

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of button interactions listed in FR-002 are logged with complete context data as defined in FR-003
- **SC-002**: Users can access and view logs within 2 seconds of opening the log viewer
- **SC-003**: Log export completes within 5 seconds for up to 1000 entries
- **SC-004**: Logs persist correctly across page refreshes (verified by refreshing and checking logs remain)
- **SC-005**: When investigating a task-switching issue, the user can identify the exact sequence of actions within 1 minute by reviewing the logs
- **SC-006**: Log entries contain sufficient detail to reconstruct what happened (action, task context, timing) without ambiguity

## Clarifications

### Session 2026-01-03

- Q: Where should the log viewer be accessed from? → A: Inside Settings panel (less prominent, keeps UI clean)

## Assumptions

- Logs are intended primarily for debugging by the app user/developer, not for end-user analytics
- Log entries do not need to be searchable or filterable in the initial implementation (simple chronological view is sufficient)
- Export format will be plain text or JSON (structured for readability, not spreadsheet-optimized)
- Log viewer will be accessed via the Settings panel, keeping the main UI uncluttered
- Logs are stored locally only; no server-side logging is in scope
