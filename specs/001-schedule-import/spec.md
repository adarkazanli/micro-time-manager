# Feature Specification: Schedule Import

**Feature Branch**: `001-schedule-import`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "Import daily schedule from Excel/CSV files with task name, start time, duration, and type (fixed/flexible)"

## Clarifications

### Session 2025-12-17

- Q: Should there be a maximum number of tasks allowed per imported schedule? → A: Limit to 50 tasks per schedule
- Q: When a file has multiple validation errors, how should the system display them? → A: Show all errors at once (list all issues found)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Schedule File (Priority: P1)

As a user, I want to upload my daily schedule from an Excel or CSV file so that I can quickly start tracking my time without manual data entry.

**Why this priority**: This is the core entry point for the application. Without file upload, users cannot use the time tracking features. This delivers immediate value by eliminating tedious manual schedule creation.

**Independent Test**: Can be fully tested by uploading a valid schedule file and verifying tasks appear in preview. Delivers the primary value of converting spreadsheet data into an actionable schedule.

**Acceptance Scenarios**:

1. **Given** I am on the schedule setup screen, **When** I drag and drop a valid .xlsx file onto the upload area, **Then** the system accepts the file and begins parsing.
2. **Given** I am on the schedule setup screen, **When** I click the upload area and select a .csv file from my device, **Then** the system accepts the file and begins parsing.
3. **Given** I have uploaded a valid schedule file, **When** parsing completes successfully, **Then** I see a preview of all parsed tasks in chronological order.

---

### User Story 2 - Validate Import Data (Priority: P1)

As a user, I want the system to validate my schedule file and show me specific errors so that I can fix problems before starting my day.

**Why this priority**: Validation is essential for the upload feature to be useful. Without clear error messages, users cannot correct their files, making the import feature frustrating and unusable.

**Independent Test**: Can be tested by uploading files with various errors (missing columns, invalid formats) and verifying appropriate error messages appear with row/column details.

**Acceptance Scenarios**:

1. **Given** I upload a file missing the "Task Name" column, **When** parsing completes, **Then** I see an error message specifying which required column is missing.
2. **Given** I upload a file with an invalid duration format in row 5, **When** parsing completes, **Then** I see an error message indicating row 5, column "Duration", with the invalid value shown.
3. **Given** I upload a file with an unrecognized task type "maybe", **When** parsing completes, **Then** I see an error specifying the row, column, and valid options ("fixed" or "flexible").
4. **Given** I upload a file with an invalid time format "25:00", **When** parsing completes, **Then** I see an error indicating the specific cell with the invalid time.

---

### User Story 3 - Review and Edit Imported Schedule (Priority: P2)

As a user, I want to review my imported schedule and make adjustments before confirming so that I can correct errors or make last-minute changes without re-uploading.

**Why this priority**: While the core import works without editing, the ability to make quick adjustments significantly improves user experience and reduces friction when schedules need minor tweaks.

**Independent Test**: Can be tested by importing a schedule, modifying task properties, and verifying changes persist when confirming the schedule.

**Acceptance Scenarios**:

1. **Given** I have a schedule preview displayed, **When** I click on a task name, **Then** I can edit the task name inline.
2. **Given** I have a schedule preview displayed, **When** I click on a task duration, **Then** I can modify the duration and see the updated value.
3. **Given** I have a schedule preview displayed, **When** I click on a task type badge, **Then** I can toggle between "fixed" and "flexible".
4. **Given** I have a schedule preview with flexible tasks, **When** I drag a flexible task to a new position, **Then** the task order updates and start times recalculate.

---

### User Story 4 - Confirm and Start Schedule (Priority: P2)

As a user, I want to confirm my schedule after review so that I can lock in my plan and begin tracking.

**Why this priority**: This completes the import flow by transitioning from setup to active tracking. Without confirmation, the imported data cannot be used.

**Independent Test**: Can be tested by confirming a schedule and verifying the app transitions to the tracking view with the first task ready.

**Acceptance Scenarios**:

1. **Given** I have reviewed my schedule preview, **When** I click "Confirm Schedule", **Then** the schedule is saved and I transition to the ready state.
2. **Given** I have confirmed my schedule, **When** I view the schedule, **Then** all tasks appear in the confirmed order with their properties preserved.
3. **Given** I am in the preview state, **When** I click "Cancel", **Then** I return to the empty upload screen with no schedule data retained.

---

### User Story 5 - Download Schedule Template (Priority: P3)

As a new user, I want to download a template spreadsheet so that I know the exact format required for import.

**Why this priority**: While helpful for onboarding, users with existing spreadsheets can often adapt them without a template. This is a convenience feature that improves first-time user experience.

**Independent Test**: Can be tested by downloading the template and verifying it contains correct headers and example data.

**Acceptance Scenarios**:

1. **Given** I am on the upload screen, **When** I click "Download Template", **Then** an Excel file downloads to my device.
2. **Given** I have downloaded the template, **When** I open it, **Then** I see column headers: Task Name, Start Time, Duration, Type.
3. **Given** I have downloaded the template, **When** I view the contents, **Then** I see 2-3 example rows demonstrating correct formats.

---

### Edge Cases

- **Empty file (headers only)**: System displays "No tasks found in file. Please add at least one task row."
- **File too large (over 1MB)**: System displays "File too large. Please use a file under 1MB."
- **Overlapping task times**: System accepts the schedule but displays a warning indicator on overlapping tasks.
- **Fixed task scheduled in the past**: System accepts the schedule but marks the task as "past due" with a visual indicator.
- **Duration exceeds 24 hours**: System rejects and displays "Duration cannot exceed 24 hours."
- **Extra columns in file**: System ignores extra columns and processes only the four required columns.
- **Duplicate task names**: System allows duplicate names (users may have multiple similar tasks).
- **Special characters in task names**: System preserves special characters and emojis in task names.
- **Too many tasks (over 50)**: System displays "Schedule exceeds 50 task limit. Please reduce the number of tasks."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept .xlsx, .xls, and .csv file formats for schedule import.
- **FR-002**: System MUST support drag-and-drop file upload onto the designated upload area.
- **FR-003**: System MUST support click-to-browse file selection from the device.
- **FR-004**: System MUST require four columns in imported files: Task Name, Start Time, Duration, Type.
- **FR-005**: System MUST parse duration values in multiple formats: minutes ("30m", "45m"), hours ("1h", "2h"), combined ("1h 30m"), and time format ("01:30:00", "30:00").
- **FR-006**: System MUST parse start times in 24-hour format ("09:00", "14:30") and 12-hour format with AM/PM ("9:00 AM", "2:30 PM").
- **FR-007**: System MUST recognize task types "fixed" and "flexible" (case-insensitive).
- **FR-008**: System MUST display all validation errors at once, each with specific row number, column name, and the invalid value.
- **FR-009**: System MUST display a preview of successfully parsed tasks in chronological order before confirmation.
- **FR-010**: System MUST allow inline editing of task name, start time, duration, and type in the preview.
- **FR-011**: System MUST allow drag-and-drop reordering of flexible tasks in the preview.
- **FR-012**: System MUST automatically recalculate start times when flexible tasks are reordered.
- **FR-013**: System MUST persist the confirmed schedule to local storage.
- **FR-014**: System MUST provide a downloadable template file with headers and example rows.
- **FR-015**: System MUST reject files larger than 1MB with an appropriate error message.
- **FR-016**: System MUST reject files with no data rows (headers only) with an appropriate message.
- **FR-017**: System MUST ignore extra columns beyond the four required columns.
- **FR-018**: System MUST display a warning for tasks with overlapping time slots.
- **FR-019**: System MUST reject files containing more than 50 tasks with an appropriate error message.

### Key Entities

- **Imported File**: The source spreadsheet uploaded by the user. Attributes: file name, file type, file size, upload timestamp.
- **Parse Result**: The outcome of file parsing. Contains either a list of parsed tasks or a list of validation errors.
- **Validation Error**: A specific issue found during parsing. Attributes: row number, column name, invalid value, error message.
- **Task (Draft)**: A task in preview state before confirmation. Attributes: name, start time, duration, type, sort order. Can be edited or reordered.
- **Task (Confirmed)**: A task after schedule confirmation. Immutable until schedule reset. Linked to tracking data.

### Assumptions

- Column headers are in the first row of the spreadsheet.
- Column names are matched case-insensitively ("task name", "Task Name", "TASK NAME" all work).
- Empty rows in the spreadsheet are ignored during parsing.
- Times are interpreted as being on the current day (no date component needed).
- The template file is available in .xlsx format (most common format).
- Users have a modern browser that supports drag-and-drop file APIs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload and confirm a schedule in under 60 seconds for files with up to 20 tasks.
- **SC-002**: 95% of validation errors are resolved on the first retry after reading the error message.
- **SC-003**: Users successfully import their first schedule within 3 attempts (including template download if needed).
- **SC-004**: Schedule preview loads within 2 seconds for files up to 50 tasks.
- **SC-005**: Inline editing changes are reflected immediately (under 100ms perceived latency).
- **SC-006**: Drag-and-drop reordering updates the display within 200ms.
- **SC-007**: Zero data loss during the import-preview-confirm flow.
