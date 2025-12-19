# Feature Specification: Note Capture

**Feature Branch**: `005-note-capture`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Taking Notes - Quick note capture during task execution with task association, categorization, and search capabilities"

## Clarifications

### Session 2025-12-19

- Q: What UI pattern should the note input use? → A: Inline input (compact field appears at top/bottom of current view)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Note Capture During Task (Priority: P1)

A user working on a task receives a phone call with a callback number. Without leaving their current view or disrupting their timer, they press a keyboard shortcut, type the number and a brief context note, and save it. The note is automatically linked to their current task for later reference.

**Why this priority**: This is the core value proposition - capturing information quickly without breaking flow. Users need to record fleeting information (phone numbers, action items, ideas) before they forget, while maintaining focus on their current task.

**Independent Test**: Can be fully tested by starting a task, pressing the note shortcut, typing a note, and saving. Delivers immediate value by preserving important information.

**Acceptance Scenarios**:

1. **Given** a user has an active task running, **When** they press `Ctrl+N` (or `Cmd+N` on Mac), **Then** an inline note input field appears at the top of the current view without pausing the task timer
2. **Given** the note input is open, **When** the user types text and presses Enter, **Then** the note is saved and linked to the current task
3. **Given** the note input is open, **When** the user types text and clicks the Save button, **Then** the note is saved and linked to the current task
4. **Given** the note input is open, **When** the user presses Escape, **Then** the input closes without saving
5. **Given** no task is active, **When** the user triggers "Add Note", **Then** the note is saved without a task association (general note)

---

### User Story 2 - View Notes Chronologically (Priority: P2)

A user wants to review all notes taken during their work session. They open the Notes view and see all their notes listed in chronological order, with the most recent notes first. Each note shows its content, timestamp, and associated task (if any).

**Why this priority**: After capturing notes, users need to retrieve them. A simple chronological view provides immediate access to recent captures without requiring complex navigation.

**Independent Test**: Can be tested by creating several notes and verifying they appear in correct order in the Notes view.

**Acceptance Scenarios**:

1. **Given** a user has captured multiple notes, **When** they open the Notes view, **Then** notes are displayed newest-first
2. **Given** a note is linked to a task, **When** viewed in the Notes list, **Then** the task name is displayed with the note
3. **Given** a note has no task association, **When** viewed in the Notes list, **Then** it shows as a "General" note

---

### User Story 3 - Filter Notes by Task (Priority: P3)

A user wants to see all notes related to a specific task. They select a task filter and the Notes view updates to show only notes linked to that task.

**Why this priority**: Filtering enhances retrieval but is not essential for basic functionality. Users can manually scan chronological list for smaller note volumes.

**Independent Test**: Can be tested by creating notes for different tasks, then filtering to verify only matching notes appear.

**Acceptance Scenarios**:

1. **Given** a user is in the Notes view with multiple notes, **When** they select a task from the filter dropdown, **Then** only notes linked to that task are displayed
2. **Given** a filter is active, **When** the user clears the filter, **Then** all notes are displayed again
3. **Given** the filter dropdown is shown, **When** the user views options, **Then** all tasks with notes are listed plus a "General Notes" option

---

### User Story 4 - Search Notes (Priority: P3)

A user remembers writing down a callback number but doesn't remember which task it was during. They type a search term and the Notes view filters to show only notes containing that text.

**Why this priority**: Search is valuable for larger note collections but not essential for basic capture and retrieval workflow.

**Independent Test**: Can be tested by creating notes with specific content, then searching for keywords to verify matches appear.

**Acceptance Scenarios**:

1. **Given** a user is in the Notes view, **When** they type in the search field, **Then** notes are filtered to show only those containing the search text
2. **Given** a search is active, **When** the user clears the search field, **Then** all notes (respecting any active task filter) are displayed
3. **Given** a search term is entered, **When** no notes match, **Then** an empty state message is shown

---

### User Story 5 - Edit and Delete Notes (Priority: P4)

A user notices a typo in a saved note or wants to remove a note that's no longer relevant. They can edit the note content or delete the note entirely.

**Why this priority**: Editing and deletion are quality-of-life features. Users can work around these by creating new notes, but editing improves the experience.

**Independent Test**: Can be tested by creating a note, editing its content, verifying the change persists, then deleting and verifying it's removed.

**Acceptance Scenarios**:

1. **Given** a user is viewing a note, **When** they click the edit action, **Then** the note content becomes editable
2. **Given** a note is being edited, **When** the user saves changes, **Then** the updated content is persisted
3. **Given** a user is viewing a note, **When** they click the delete action, **Then** a confirmation prompt appears
4. **Given** the delete confirmation is shown, **When** the user confirms, **Then** the note is permanently removed

---

### Edge Cases

- What happens when the user tries to save an empty note? System prevents saving; Save button is disabled when content is empty or whitespace-only.
- What happens when a task is completed or the session ends? Notes remain associated with the task; task completion does not affect notes.
- How does the system handle very long notes? Notes are limited to 500 characters with a character counter shown during input.
- What happens if the user has no notes? The Notes view shows an empty state with guidance on how to create notes.
- What happens during page refresh? Notes persist and are restored on reload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a keyboard shortcut (`Ctrl+N` / `Cmd+N`) to open an inline note input at the top of the current view without disrupting the task timer
- **FR-002**: System MUST provide a clickable "Add Note" button as an alternative to the keyboard shortcut
- **FR-003**: System MUST automatically associate notes with the currently active task when one exists
- **FR-004**: System MUST allow notes to be created without task association when no task is active
- **FR-005**: System MUST save notes when the user presses Enter or clicks Save
- **FR-006**: System MUST close the note input without saving when the user presses Escape
- **FR-007**: System MUST prevent saving empty notes (whitespace-only content)
- **FR-008**: System MUST limit note content to 500 characters maximum
- **FR-009**: System MUST display a character counter during note input showing remaining characters with visual feedback (gray >50 remaining, yellow 10-50 remaining, red <10 remaining)
- **FR-010**: System MUST provide a Notes view accessible from the main interface
- **FR-011**: System MUST display notes in reverse chronological order (newest first)
- **FR-012**: System MUST show the associated task name for each note (or "General" if unassociated)
- **FR-013**: System MUST show the timestamp for each note
- **FR-014**: System MUST provide a task filter dropdown in the Notes view
- **FR-015**: System MUST provide a text search field in the Notes view
- **FR-016**: System MUST allow editing of note content
- **FR-017**: System MUST allow deletion of notes with confirmation
- **FR-018**: System MUST persist notes to local storage
- **FR-019**: System MUST restore notes on page refresh
- **FR-020**: System MUST display an empty state when no notes exist

### Key Entities

- **Note**: A captured piece of information containing text content, creation timestamp, and optional task association. Has a unique identifier, content (max 500 chars), createdAt timestamp, and taskId reference (nullable).
- **Task Association**: The relationship between a note and a task. A note can be associated with zero or one task. A task can have zero or many notes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can capture a note in under 3 seconds from pressing the shortcut to saving
- **SC-002**: Notes persist across page refreshes with 100% reliability
- **SC-003**: Users can find a specific note through search or filter in under 10 seconds
- **SC-004**: The note input appears within 100ms of triggering the shortcut (perceived as instant)
- **SC-005**: Interface follows platform conventions (keyboard shortcut, inline input pattern) to maximize discoverability without instructions

## Assumptions

- Keyboard shortcuts follow platform conventions (`Ctrl` for Windows/Linux, `Cmd` for Mac)
- Notes are session-scoped but persist in local storage (same as tasks/interruptions)
- The note input uses an inline compact field at the top of the current view (not a modal or separate panel)
- The Notes view for browsing/searching is accessible from the main day tracking interface
- Notes do not support rich text formatting (plain text only)
- Search is case-insensitive and matches partial words
- There is no limit on the number of notes a user can create
