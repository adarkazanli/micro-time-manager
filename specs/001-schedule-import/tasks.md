# Tasks: Schedule Import

**Input**: Design documents from `/specs/001-schedule-import/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included per constitution Principle IV (Test-First Development).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Per plan.md structure:
- Source: `src/lib/` (components, stores, services, utils)
- Tests: `tests/` (unit, component, e2e)
- Single project layout

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Svelte 5 + Vite + Tailwind + SheetJS

- [x] T001 Initialize Svelte 5 project with Vite in repository root
- [x] T002 Install SheetJS (xlsx) dependency for file parsing
- [x] T003 [P] Configure Tailwind CSS 4.x in src/app.css
- [x] T004 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T005 [P] Setup Vitest for unit testing in vitest.config.ts
- [x] T006 [P] Setup Playwright for e2e testing in playwright.config.ts
- [x] T007 Create directory structure: src/lib/components/, src/lib/stores/, src/lib/services/, src/lib/utils/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create shared TypeScript types in src/lib/types/index.ts (DraftTask, ValidationError, ImportState, TaskType)
- [x] T009 [P] Implement duration parser utility in src/lib/utils/duration.ts
- [x] T010 [P] Implement time parser utility in src/lib/utils/time.ts
- [x] T011 [P] Write unit tests for duration parser in tests/unit/duration.test.ts
- [x] T012 [P] Write unit tests for time parser in tests/unit/time.test.ts
- [x] T013 Implement localStorage wrapper service in src/lib/services/storage.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Upload Schedule File (Priority: P1) 🎯 MVP

**Goal**: Users can upload Excel/CSV files and see parsed tasks in preview

**Independent Test**: Upload a valid .xlsx file → see tasks displayed in chronological order

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T014 [P] [US1] Write parser service tests in tests/unit/parser.test.ts (valid file, file size, task count)
- [x] T015 [P] [US1] Write FileUploader component tests in tests/component/FileUploader.test.ts

### Implementation for User Story 1

- [x] T016 [US1] Implement file parser service in src/lib/services/parser.ts (SheetJS parsing, column extraction)
- [x] T017 [US1] Create import store in src/lib/stores/importStore.ts (status, file, tasks, errors)
- [x] T018 [US1] Create FileUploader component in src/lib/components/FileUploader.svelte (drag-drop + click)
- [x] T019 [US1] Create TaskRow component in src/lib/components/TaskRow.svelte (read-only display)
- [x] T020 [US1] Create SchedulePreview component in src/lib/components/SchedulePreview.svelte (task list)
- [x] T021 [US1] Wire components in src/routes/+page.svelte (or App.svelte) with import flow
- [x] T022 [US1] Add loading state UI during file parsing

**Checkpoint**: User can upload a valid file and see tasks in preview

---

## Phase 4: User Story 2 - Validate Import Data (Priority: P1)

**Goal**: Invalid files show clear, actionable error messages with row/column details

**Independent Test**: Upload file with invalid duration → see specific error with row number

### Tests for User Story 2

- [x] T023 [P] [US2] Write validation error tests in tests/unit/parser.test.ts (missing columns, invalid formats, all errors shown)
- [x] T024 [P] [US2] Write ValidationErrors component tests in tests/component/ValidationErrors.test.ts

### Implementation for User Story 2

- [x] T025 [US2] Extend parser service with comprehensive validation in src/lib/services/parser.ts
- [x] T026 [US2] Add file size validation (1MB limit) in src/lib/services/parser.ts
- [x] T027 [US2] Add task count validation (50 max) in src/lib/services/parser.ts
- [x] T028 [US2] Create ValidationErrors component in src/lib/components/ValidationErrors.svelte
- [x] T029 [US2] Update import store to handle error state in src/lib/stores/importStore.ts
- [x] T030 [US2] Add retry flow (error → idle transition) in src/routes/+page.svelte

**Checkpoint**: Invalid files show all errors at once with row/column details

---

## Phase 5: User Story 3 - Review and Edit Schedule (Priority: P2)

**Goal**: Users can edit task properties and reorder flexible tasks before confirmation

**Independent Test**: Import schedule → edit task name → see change reflected

### Tests for User Story 3

- [x] T031 [P] [US3] Write inline editing tests in tests/component/TaskRow.test.ts
- [x] T032 [P] [US3] Write drag-drop reorder tests in tests/component/SchedulePreview.test.ts

### Implementation for User Story 3

- [x] T033 [US3] Add inline name editing to TaskRow in src/lib/components/TaskRow.svelte
- [x] T034 [US3] Add inline duration editing to TaskRow in src/lib/components/TaskRow.svelte
- [x] T035 [US3] Add inline time editing to TaskRow in src/lib/components/TaskRow.svelte
- [x] T036 [US3] Add type toggle (fixed/flexible) to TaskRow in src/lib/components/TaskRow.svelte
- [x] T037 [US3] Implement drag-drop reordering in src/lib/components/SchedulePreview.svelte
- [x] T038 [US3] Add updateTask action to import store in src/lib/stores/importStore.ts
- [x] T039 [US3] Add reorderTasks action to import store in src/lib/stores/importStore.ts
- [x] T040 [US3] Add start time recalculation on reorder in src/lib/stores/importStore.ts

**Checkpoint**: Users can edit all task fields and reorder flexible tasks

---

## Phase 6: User Story 4 - Confirm and Start Schedule (Priority: P2)

**Goal**: Users can confirm schedule and persist to localStorage for tracking

**Independent Test**: Confirm schedule → refresh page → tasks still present

### Tests for User Story 4

- [x] T041 [P] [US4] Write confirm flow tests in tests/component/SchedulePreview.test.ts
- [x] T042 [P] [US4] Write localStorage persistence tests in tests/unit/storage.test.ts

### Implementation for User Story 4

- [x] T043 [US4] Add Confirm button to SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T044 [US4] Add Cancel button to SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T045 [US4] Implement confirmSchedule action in src/lib/stores/importStore.ts
- [x] T046 [US4] Add DraftTask → ConfirmedTask transformation in src/lib/stores/importStore.ts
- [x] T047 [US4] Persist confirmed tasks to localStorage (tm_tasks key) in src/lib/services/storage.ts
- [x] T048 [US4] Add transition to "ready" state after confirm in src/routes/+page.svelte

**Checkpoint**: Confirmed schedule persists and survives page refresh

---

## Phase 7: User Story 5 - Download Template (Priority: P3)

**Goal**: New users can download a properly formatted template to understand import format

**Independent Test**: Click "Download Template" → Excel file downloads with headers and examples

### Tests for User Story 5

- [x] T049 [P] [US5] Write template download tests in tests/unit/template.test.ts

### Implementation for User Story 5

- [x] T050 [US5] Create template generator function in src/lib/services/template.ts
- [x] T051 [US5] Create TemplateDownload component in src/lib/components/TemplateDownload.svelte
- [x] T052 [US5] Add TemplateDownload to upload screen in src/routes/+page.svelte

**Checkpoint**: Template downloads with correct format and example data

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Warnings, documentation, and final refinements

- [x] T053 [P] Add overlap warning detection in src/lib/stores/importStore.ts
- [x] T054 [P] Add past-due warning detection in src/lib/stores/importStore.ts
- [x] T055 [P] Add warning indicators to TaskRow in src/lib/components/TaskRow.svelte
- [ ] T056 [P] Update USER_GUIDE.md with import instructions in docs/USER_GUIDE.md (deferred - create when requested)
- [ ] T057 [P] Update API.md with store and service interfaces in docs/API.md (deferred - create when requested)
- [ ] T058 [P] Update DATA_SCHEMA.md with import data structures in docs/DATA_SCHEMA.md (deferred - create when requested)
- [x] T059 Write e2e test for full import flow in tests/e2e/import-flow.test.ts
- [x] T060 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
┌───────────────────────────────────────────────┐
│  User Stories can proceed in priority order   │
│  or in parallel if team capacity allows       │
└───────────────────────────────────────────────┘
    ↓
Phase 3 (US1: Upload) ← MVP
    ↓
Phase 4 (US2: Validate) ← Required for MVP
    ↓
Phase 5 (US3: Edit)
    ↓
Phase 6 (US4: Confirm)
    ↓
Phase 7 (US5: Template)
    ↓
Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (Upload) | Phase 2 | Foundational complete |
| US2 (Validate) | US1 | US1 parser exists |
| US3 (Edit) | US1 | US1 components exist |
| US4 (Confirm) | US1 | US1 store exists |
| US5 (Template) | Phase 2 | Foundational complete |

### Within Each User Story

1. Tests written and FAIL first
2. Core implementation
3. UI components
4. Integration
5. Checkpoint validation

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# After T001, T002:
T003, T004, T005, T006 can run in parallel
```

**Phase 2 (Foundational)**:
```bash
# After T008:
T009, T010 can run in parallel
T011, T012 can run in parallel
```

**Within User Stories**:
```bash
# US1 Tests:
T014, T015 can run in parallel

# US2 Tests:
T023, T024 can run in parallel
```

---

## Parallel Example: Foundational Phase

```bash
# Launch utility implementations together:
Task: "Implement duration parser utility in src/lib/utils/duration.ts"
Task: "Implement time parser utility in src/lib/utils/time.ts"

# Launch utility tests together:
Task: "Write unit tests for duration parser in tests/unit/duration.test.ts"
Task: "Write unit tests for time parser in tests/unit/time.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Upload)
4. Complete Phase 4: User Story 2 (Validate)
5. **STOP and VALIDATE**: Can upload and see errors
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Upload) → **Minimal working import**
3. Add US2 (Validate) → **Production-ready MVP**
4. Add US3 (Edit) → Enhanced UX
5. Add US4 (Confirm) → Persistence
6. Add US5 (Template) → Onboarding improvement
7. Polish → Warnings, docs, e2e tests

### Suggested MVP Scope

**MVP = Phase 1 + 2 + 3 + 4** (Setup + Foundational + Upload + Validate)

This delivers:
- File upload (drag-drop and click)
- Task parsing and preview
- Clear error messages
- Core value proposition complete

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| 1. Setup | 7 | 4 tasks |
| 2. Foundational | 6 | 4 tasks |
| 3. US1 (Upload) | 9 | 2 tasks |
| 4. US2 (Validate) | 8 | 2 tasks |
| 5. US3 (Edit) | 10 | 2 tasks |
| 6. US4 (Confirm) | 8 | 2 tasks |
| 7. US5 (Template) | 4 | 1 task |
| 8. Polish | 8 | 6 tasks |
| **Total** | **60** | **23 parallel** |

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- Each user story is independently testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Constitution requires Test-First Development (Principle IV)
