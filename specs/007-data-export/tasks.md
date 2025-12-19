# Tasks: Data Export

**Input**: Design documents from `/specs/007-data-export/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Included based on Constitution IV (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure (SvelteKit SPA):
- Source: `src/lib/` for components, services, types
- Tests: `tests/unit/` for service tests, `tests/e2e/` for flow tests
- Routes: `src/routes/` for page integration

---

## Phase 1: Setup (Types & Utilities)

**Purpose**: Add TypeScript types and time formatting utilities needed for export

- [x] T001 Add ExportFormat type to src/lib/types/index.ts
- [x] T002 Add TaskExportRow interface to src/lib/types/index.ts
- [x] T003 Add InterruptionExportRow interface to src/lib/types/index.ts
- [x] T004 Add NoteExportRow interface to src/lib/types/index.ts
- [x] T005 Add SummaryExportRow interface to src/lib/types/index.ts
- [x] T006 [P] Add formatDurationHHMMSS utility function to src/lib/utils/formatters.ts
- [x] T007 [P] Add formatVarianceHHMMSS utility function to src/lib/utils/formatters.ts
- [x] T008 [P] Add formatTimeHHMMSS utility function to src/lib/utils/formatters.ts
- [x] T009 [P] Add escapeCSVValue utility function to src/lib/utils/formatters.ts

---

## Phase 2: Foundational (Export Service Core)

**Purpose**: Core export service that ALL user stories depend on

**⚠️ CRITICAL**: No component work can begin until this phase is complete

### Tests for Export Service

- [x] T010 [P] Create tests/unit/export.test.ts with test structure
- [x] T011 [P] Add prepareTasksExport tests in tests/unit/export.test.ts
- [x] T012 [P] Add prepareInterruptionsExport tests in tests/unit/export.test.ts
- [x] T013 [P] Add prepareNotesExport tests in tests/unit/export.test.ts
- [x] T014 [P] Add prepareSummaryExport tests in tests/unit/export.test.ts

### Implementation

- [x] T015 Create src/lib/services/export.ts with prepareTasksExport function
- [x] T016 Add prepareInterruptionsExport function to src/lib/services/export.ts
- [x] T017 Add prepareNotesExport function to src/lib/services/export.ts
- [x] T018 Add prepareSummaryExport function to src/lib/services/export.ts
- [x] T019 Add getSessionDate helper function to src/lib/services/export.ts
- [x] T020 Run tests to verify export service data preparation passes all tests

**Checkpoint**: Export data preparation ready - format-specific implementation can begin

---

## Phase 3: User Story 3 - Access Export from Main Interface (Priority: P1) 🎯 Foundation

**Goal**: Export button visible in main interface with inline format selector

**Independent Test**: Navigate to main page during a session, click Export button, verify format options appear

### Tests for User Story 3

- [x] T021 [P] [US3] Add ExportButton component tests in tests/unit/ExportButton.test.ts

### Implementation for User Story 3

- [x] T022 [US3] Create src/lib/components/ExportButton.svelte with props interface
- [x] T023 [US3] Add Export button with disabled state based on session status to ExportButton.svelte
- [x] T024 [US3] Add inline format selector (Excel/CSV buttons) to ExportButton.svelte
- [x] T025 [US3] Add click-outside handler to collapse selector in ExportButton.svelte
- [x] T026 [US3] Add Tailwind styling to ExportButton.svelte
- [x] T027 [US3] Import ExportButton component in src/routes/+page.svelte
- [x] T028 [US3] Add ExportButton to secondary controls area in src/routes/+page.svelte

**Checkpoint**: Export button visible and functional, format selector works

---

## Phase 4: User Story 1 - Export Day Data to Excel (Priority: P1) 🎯 MVP

**Goal**: Download complete session data as multi-sheet Excel file

**Independent Test**: Have session with tasks, interruptions, notes. Click Export → Excel. Open downloaded file and verify all four sheets have correct data.

### Tests for User Story 1

- [x] T029 [P] [US1] Add exportToExcel tests in tests/unit/export.test.ts
- [x] T030 [P] [US1] Add generateExcelWorkbook tests in tests/unit/export.test.ts

### Implementation for User Story 1

- [x] T031 [US1] Add generateExcelWorkbook function to src/lib/services/export.ts
- [x] T032 [US1] Add createTasksSheet helper to src/lib/services/export.ts
- [x] T033 [US1] Add createInterruptionsSheet helper to src/lib/services/export.ts
- [x] T034 [US1] Add createNotesSheet helper to src/lib/services/export.ts
- [x] T035 [US1] Add createSummarySheet helper to src/lib/services/export.ts
- [x] T036 [US1] Add exportToExcel function with file download to src/lib/services/export.ts
- [x] T037 [US1] Add downloadBlob helper function to src/lib/services/export.ts
- [x] T038 [US1] Wire Excel button in ExportButton.svelte to call exportToExcel
- [x] T039 [US1] Run tests to verify Excel export passes all tests

**Checkpoint**: Excel export fully functional - can demo with real data

---

## Phase 5: User Story 2 - Export Day Data to CSV (Priority: P2)

**Goal**: Download session data as four separate CSV files

**Independent Test**: Have session with data. Click Export → CSV. Verify four files download with correct names and content.

### Tests for User Story 2

- [x] T040 [P] [US2] Add generateCSV tests in tests/unit/export.test.ts
- [x] T041 [P] [US2] Add exportToCSV tests in tests/unit/export.test.ts

### Implementation for User Story 2

- [x] T042 [US2] Add generateCSV function to src/lib/services/export.ts
- [x] T043 [US2] Add exportToCSV function with multiple file downloads to src/lib/services/export.ts
- [x] T044 [US2] Wire CSV button in ExportButton.svelte to call exportToCSV
- [x] T045 [US2] Run tests to verify CSV export passes all tests

**Checkpoint**: CSV export fully functional - both formats now available

---

## Phase 6: Polish & Documentation

**Purpose**: Edge cases, documentation, and final validation

- [x] T046 [P] Add edge case handling for empty interruptions array in src/lib/services/export.ts
- [x] T047 [P] Add edge case handling for empty notes array in src/lib/services/export.ts
- [x] T048 [P] Add edge case handling for in-progress tasks in src/lib/services/export.ts
- [x] T049 [P] Add edge case handling for in-progress interruptions in src/lib/services/export.ts
- [x] T050 [P] Add download error handling with user feedback in src/lib/services/export.ts
- [x] T051 [P] Update docs/USER_GUIDE.md with "Exporting Data" section
- [x] T052 [P] Update docs/API.md with Export Service documentation
- [x] T053 [P] Update docs/DATA_SCHEMA.md with export file format documentation
- [x] T054 Run npm test && npm run lint to verify all tests pass
- [x] T055 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (types must exist for service)
- **User Story 3 (Phase 3)**: Depends on Foundational (needs export service structure)
- **User Story 1 (Phase 4)**: Depends on US3 (needs ExportButton with Excel handler)
- **User Story 2 (Phase 5)**: Depends on US3 (needs ExportButton with CSV handler)
- **Polish (Phase 6)**: Can start after US1 is complete

### User Story Dependencies

- **User Story 3 (P1)**: Foundational - Must complete first as it provides UI entry point
- **User Story 1 (P1)**: Depends on US3 - Implements Excel format
- **User Story 2 (P2)**: Depends on US3 - Implements CSV format (can run parallel to US1)

### Parallel Opportunities

- T006-T009: All utility functions can be written in parallel
- T010-T014: All test files can be written in parallel
- T029-T030 and T040-T041: US1 and US2 tests can run in parallel
- T046-T053: All polish tasks can run in parallel

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all utility functions together:
Task: "Add formatDurationHHMMSS utility function to src/lib/utils/formatters.ts"
Task: "Add formatVarianceHHMMSS utility function to src/lib/utils/formatters.ts"
Task: "Add formatTimeHHMMSS utility function to src/lib/utils/formatters.ts"
Task: "Add escapeCSVValue utility function to src/lib/utils/formatters.ts"
```

## Parallel Example: US1 and US2 Tests

```bash
# After US3 complete, launch US1 and US2 tests in parallel:
Task: "Add exportToExcel tests in tests/unit/export.test.ts"
Task: "Add generateCSV tests in tests/unit/export.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types and utilities)
2. Complete Phase 2: Foundational (export service data preparation)
3. Complete Phase 3: User Story 3 (Export button UI)
4. Complete Phase 4: User Story 1 (Excel export)
5. **STOP and VALIDATE**: Test Excel export with real session data
6. Can demo full Excel export functionality

### Incremental Delivery

1. Setup + Foundational → Export data preparation ready
2. Add US3 (Export Button) → UI entry point ready
3. Add US1 (Excel Export) → Test independently → MVP Complete!
4. Add US2 (CSV Export) → Test independently → Full feature complete
5. Polish → Documentation and edge cases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution IV requires tests before implementation (Phase 2, US1, US2)
- US3 is labeled P1 but is actually foundational - must complete before US1/US2
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- SheetJS (xlsx) is already installed - no new dependencies needed
