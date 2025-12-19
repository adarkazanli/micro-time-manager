# Feature Specification: Data Export

**Feature Branch**: `007-data-export`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Export complete day's data to Excel and CSV formats with multiple sheets for tasks, interruptions, notes, and summary analytics"

## Clarifications

### Session 2025-12-19

- Q: How should the format selection be presented to the user? → A: Inline buttons/dropdown - Export click reveals Excel/CSV buttons directly

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export Day Data to Excel (Priority: P1)

A user who has completed their day (or is mid-session) wants to export all their productivity data to a single Excel file for record-keeping, sharing with a manager, or uploading to cloud storage for AI analysis.

**Why this priority**: This is the primary export format that captures everything in a single professional file. Excel is universally supported and allows multi-sheet organization of related data.

**Independent Test**: Complete a session with at least one task, one interruption, and one note. Click Export, choose Excel, and verify the downloaded file contains all four sheets with correct data.

**Acceptance Scenarios**:

1. **Given** a user has an active or completed session with tasks, **When** they click the Export button and select Excel format, **Then** an Excel file downloads containing a Tasks sheet with all task details.

2. **Given** a user has logged interruptions during their session, **When** they export to Excel, **Then** the Interruptions sheet contains all interruption entries with task associations, times, categories, and notes.

3. **Given** a user has captured notes during their session, **When** they export to Excel, **Then** the Notes sheet contains all notes with timestamps and task associations.

4. **Given** a user has session data, **When** they export to Excel, **Then** the Summary sheet contains analytics metrics including total times, completion rate, concentration score, and interruption totals.

5. **Given** a user has not started any session (idle state), **When** the Export button is present, **Then** it is disabled with appropriate visual indication.

---

### User Story 2 - Export Day Data to CSV (Priority: P2)

A user needs their data in CSV format for compatibility with other tools, databases, or custom analysis scripts that don't support Excel.

**Why this priority**: CSV is a secondary format for users with specific tool requirements. Most users will prefer Excel's single-file convenience.

**Independent Test**: Complete a session with data. Click Export, choose CSV, and verify four separate CSV files download (or a zip archive) with correct data in each.

**Acceptance Scenarios**:

1. **Given** a user has session data, **When** they click Export and select CSV format, **Then** separate CSV files are downloaded for tasks, interruptions, notes, and summary.

2. **Given** a user exports to CSV, **When** they open the tasks CSV, **Then** it contains headers and data matching the Excel Tasks sheet structure.

3. **Given** a user exports multiple CSV files, **When** the files are named, **Then** they include the date and data type (e.g., `2025-12-19_tasks.csv`).

---

### User Story 3 - Access Export from Main Interface (Priority: P1 - Foundational)

A user wants easy access to the export functionality from the main application interface without navigating through multiple menus.

**Why this priority**: Discoverability and ease of access are critical for users to actually use the export feature.

**Independent Test**: Navigate to main interface during a session, locate and click the Export button, verify export options are displayed.

**Acceptance Scenarios**:

1. **Given** a user is on the main application screen, **When** they look for export functionality, **Then** an Export button is visible in the secondary controls area.

2. **Given** a user clicks the Export button, **When** the inline format selector appears, **Then** they see Excel and CSV buttons to choose from directly.

3. **Given** a user is in idle state with no session, **When** they view the Export button, **Then** it is disabled since there's no data to export.

**Dependency Note**: This story provides the UI entry point and must be completed before US1 (Excel) or US2 (CSV) can be wired to user actions.

---

### Edge Cases

- What happens when exporting with zero tasks completed? Export should still work, showing 0 completed in summary and actual durations as 0 for incomplete tasks.
- How does the system handle tasks with no interruptions? Interruptions sheet shows headers only with no data rows, or a single row indicating "No interruptions recorded."
- What happens when notes have special characters (quotes, commas)? CSV must properly escape per RFC 4180; Excel handles natively.
- How does export handle very long task names or notes? Export full content without truncation; spreadsheet applications handle cell overflow.
- What happens if the browser blocks the download? Show user-friendly error message explaining how to allow downloads.
- What if export is triggered during an active interruption? Include the in-progress interruption with calculated duration up to current moment.
- What if export is triggered with a task in progress? Include task with actual duration calculated from elapsed time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an Export button in the main application interface secondary controls area
- **FR-002**: System MUST disable the Export button when session status is idle (no data to export)
- **FR-003**: System MUST display an inline selector with Excel (.xlsx) and CSV format buttons when Export is clicked
- **FR-004**: System MUST generate an Excel file with four sheets: Tasks, Interruptions, Notes, Summary
- **FR-005**: System MUST generate four separate CSV files when CSV format is selected
- **FR-006**: Tasks sheet/file MUST include: Task Name, Type, Planned Start (HH:MM:SS), Actual Start (HH:MM:SS), Planned Duration (HH:MM:SS), Actual Duration (HH:MM:SS), Variance (+/-HH:MM:SS), Interruptions (count), Interruption Time (HH:MM:SS), Status
- **FR-007**: Interruptions sheet/file MUST include: Task (name), Start Time (HH:MM:SS), End Time (HH:MM:SS), Duration (HH:MM:SS), Category, Note
- **FR-008**: Notes sheet/file MUST include: Time (HH:MM:SS), Task (name or empty), Content
- **FR-009**: Summary sheet/file MUST include: Session Date, Session Start, Session End, Total Planned Time, Total Actual Time, Total Interruption Time, Interruption Count, Concentration Score (%), Schedule Adherence (%), Tasks Completed (X of Y)
- **FR-010**: System MUST name exported files with the session date (e.g., `2025-12-19_productivity.xlsx` or `2025-12-19_tasks.csv`)
- **FR-011**: System MUST format all time values as HH:MM:SS in exports
- **FR-012**: System MUST properly escape special characters in CSV exports per RFC 4180 (quotes, commas, newlines)
- **FR-013**: System MUST export current state for in-progress sessions (calculate actual durations from elapsed time)
- **FR-014**: System MUST calculate duration for in-progress interruptions based on current time

### Key Entities

- **Export Configuration**: Selected format (Excel or CSV) and trigger for file generation
- **Tasks Export Data**: Joined data from ConfirmedTask[], TaskProgress[], and computed variance/interruption aggregates
- **Interruptions Export Data**: Interruption[] with task name lookup from ConfirmedTask[]
- **Notes Export Data**: Note[] with task name lookup from ConfirmedTask[]
- **Summary Export Data**: AnalyticsSummary metrics plus session start/end times and date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export their complete day's data in 2 clicks (Export button → format selection)
- **SC-002**: Exported Excel files open correctly in common spreadsheet applications without errors or warnings
- **SC-003**: Exported CSV files parse correctly without data corruption (special characters properly escaped)
- **SC-004**: Export operation completes within 2 seconds for a typical day's data (50 tasks, 100 interruptions, 50 notes)
- **SC-005**: 100% of session data is accurately represented in exported files (no data loss or transformation errors)
- **SC-006**: Time values are human-readable in HH:MM:SS format rather than raw seconds/milliseconds

## Assumptions

- The SheetJS (xlsx) library already present in the project for import will be reused for Excel export
- Browser's native download capability is sufficient (no server-side processing required)
- Export operates on current session data in memory/stores, not persisted historical data
- Only one session is active at a time; multi-day/historical export is out of scope
- Individual CSV files will download separately rather than being bundled into a zip archive
- The session date is derived from the sessionStore's startedAt field
