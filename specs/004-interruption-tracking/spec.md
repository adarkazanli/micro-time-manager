# Feature Specification: Interruption Tracking

**Feature Branch**: `004-interruption-tracking`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Managing Interruptions - Allow users to log and track interruptions during tasks with categories and notes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log an Interruption (Priority: P1)

As a user working on a task, I want to quickly log an interruption when it occurs so that my task timer pauses and I can track time spent on the interruption separately.

**Why this priority**: This is the core functionality - without the ability to log interruptions, no other feature can work. Users need a frictionless way to pause their current task when interrupted.

**Independent Test**: Can be fully tested by starting a task, clicking "Interrupt" button, and verifying the task timer pauses while an interruption timer starts. Delivers immediate value by preventing task time from being inflated by interruptions.

**Acceptance Scenarios**:

1. **Given** a task timer is running, **When** user clicks "Interrupt" button, **Then** the task timer pauses and an interruption timer starts
2. **Given** a task timer is running, **When** user presses "I" key, **Then** the task timer pauses and an interruption timer starts
3. **Given** no task is active, **When** user tries to log an interruption, **Then** the interrupt action is disabled/unavailable

---

### User Story 2 - Resume Work After Interruption (Priority: P1)

As a user who has been interrupted, I want to end the interruption and resume my task so that my task timer continues and the interruption is logged with optional metadata.

**Why this priority**: Equally critical as P1 - users must be able to resume their task after an interruption. Together with Story 1, this completes the basic interruption logging flow.

**Independent Test**: Can be tested by logging an interruption, clicking "Resume", verifying the task timer resumes immediately, and then editing the interruption to add category/note.

**Acceptance Scenarios**:

1. **Given** an interruption is active, **When** user clicks "Resume" button, **Then** the interruption timer stops, task timer resumes immediately, and interruption is recorded with duration only
2. **Given** an interruption is active, **When** user presses "R" key, **Then** the interruption timer stops, task timer resumes immediately, and interruption is recorded with duration only
3. **Given** an interruption has been recorded, **When** user edits the interruption, **Then** they can add/modify category and note
4. **Given** an interruption is being edited, **When** user selects a category from the list, **Then** the category is saved with the interruption record
5. **Given** an interruption is being edited, **When** user adds a note, **Then** the note is saved with the interruption record

---

### User Story 3 - View Interruption Summary on Main Screen (Priority: P2)

As a user during my work session, I want to see the current task's interruption count and total interruption time so that I have awareness of how often I'm being interrupted.

**Why this priority**: Provides immediate feedback and awareness without requiring users to navigate away. Enhances the value of interruption logging by making the data visible.

**Independent Test**: Can be tested by logging multiple interruptions for a task and verifying the main screen displays accurate count and total time.

**Acceptance Scenarios**:

1. **Given** a task has recorded interruptions, **When** viewing the main screen, **Then** the interruption count for the current task is displayed
2. **Given** a task has recorded interruptions, **When** viewing the main screen, **Then** the total interruption time for the current task is displayed
3. **Given** a task has no interruptions, **When** viewing the main screen, **Then** the interruption count shows zero or is hidden
4. **Given** an interruption is in progress, **When** viewing the main screen, **Then** the interruption timer is visible

---

### User Story 4 - View Full Interruption Log (Priority: P3)

As a user, I want to view a detailed log of all interruptions so that I can analyze patterns and identify major sources of interruption.

**Why this priority**: Valuable for retrospective analysis but not essential for the core interruption tracking workflow. Users can derive value from Stories 1-3 without this.

**Independent Test**: Can be tested by logging several interruptions with different categories and notes, opening the Interruptions view, and verifying all records are displayed with correct details.

**Acceptance Scenarios**:

1. **Given** interruptions have been logged, **When** user opens the Interruptions view from the menu, **Then** a list of all interruptions is displayed
2. **Given** the Interruptions view is open, **When** viewing an interruption entry, **Then** the timestamp, duration, category, note, and associated task are shown
3. **Given** the Interruptions view is open, **When** multiple interruptions exist, **Then** they are displayed in chronological order (most recent first)

---

### Edge Cases

- What happens when user completes a task while an interruption is active? (Interruption should be auto-ended before task completion)
- What happens when user tries to start a new task while interruption is active? (Auto-end the current interruption, consistent with FR-015)
- What happens when the session/day ends while an interruption is active? (Should auto-end and save the interruption)
- How does the system handle very short interruptions (< 5 seconds)? (Still record them - user explicitly triggered)
- What happens if user navigates away from the app during an interruption? (Interruption timer continues; state persisted to localStorage)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Interrupt" button visible when a task is active
- **FR-002**: System MUST support keyboard shortcut "I" to trigger interruption when a task is active
- **FR-003**: System MUST pause the current task timer when an interruption is logged
- **FR-004**: System MUST start an interruption timer when an interruption is logged
- **FR-005**: System MUST provide a "Resume" button visible when an interruption is active
- **FR-006**: System MUST support keyboard shortcut "R" to resume work when an interruption is active
- **FR-007**: System MUST stop the interruption timer and resume task timer when user resumes work
- **FR-008**: System MUST provide optional category selection when editing an interruption with categories: Phone, Luci, Colleague, Personal, Other
- **FR-009**: System MUST provide optional free-text note field when editing an interruption (max 200 characters)
- **FR-010**: System MUST record each interruption with: start time, end time, duration, category (optional), note (optional), associated task ID
- **FR-011**: System MUST display current task's interruption count on the main tracking screen
- **FR-012**: System MUST display current task's total interruption time on the main tracking screen
- **FR-013**: System MUST provide an Interruptions view accessible from the menu showing full interruption history
- **FR-014**: System MUST persist interruption data to localStorage for session recovery
- **FR-015**: System MUST auto-end any active interruption when a task is completed
- **FR-016**: System MUST prevent starting a new interruption while one is already active
- **FR-017**: System MUST allow editing recorded interruptions to add/modify category and note after resume

### Key Entities

- **Interruption**: Represents a single interruption event. Key attributes: unique ID, start timestamp, end timestamp, duration (seconds), category (enum: Phone | Luci | Colleague | Personal | Other | null), note (string, optional), associated task ID
- **InterruptionSummary**: Aggregated interruption data per task. Key attributes: task ID, interruption count, total interruption time (seconds)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can log an interruption in under 1 second (single click or keypress)
- **SC-002**: Users can resume work in under 3 seconds (including optional category/note selection)
- **SC-003**: Interruption count and total time are visible on main screen without additional navigation
- **SC-004**: All interruption data persists across page refreshes and browser sessions
- **SC-005**: 100% of interruption records include accurate duration (end time - start time)
- **SC-006**: Users can view complete interruption history within 2 clicks from main screen

## Clarifications

### Session 2025-12-19

- Q: What is the interaction pattern when resuming from an interruption? → A: Immediate resume - task resumes instantly on Resume click; category/note can be added afterward via edit

## Assumptions

- The existing timerStore and sessionStore infrastructure can be extended to support interruption state
- Keyboard shortcuts "I" and "R" don't conflict with existing app shortcuts
- The "Luci" category is specific to this user's context (a person or pet they're frequently interrupted by)
- Interruption data is session-scoped (cleared when starting a new day/session) unless explicitly exported
- The menu referenced for accessing Interruptions view is an existing or planned navigation element
