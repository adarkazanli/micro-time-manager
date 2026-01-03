# Tasks: UI Logging System

**Input**: Design documents from `/specs/014-ui-logging-system/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md

**Tests**: Included per Constitution Check ("Test-First Development" principle)

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No special setup required - existing SvelteKit project with established patterns

- [ ] T001 Verify existing project structure matches plan.md expectations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, storage, and logging infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 [P] Add LogAction type union to src/lib/types/index.ts (12 action types from data-model.md)
- [ ] T003 [P] Add LogEntry interface to src/lib/types/index.ts (id, timestamp, action, taskId, taskName, elapsedMs, sessionStatus, parameters)
- [ ] T004 [P] Add LogStorage interface to src/lib/types/index.ts (version, entries)
- [ ] T005 [P] Add log constants to src/lib/types/index.ts (STORAGE_KEY_LOGS, MAX_LOG_ENTRIES, LOG_SCHEMA_VERSION)
- [ ] T006 Add saveLogs function to src/lib/services/storage.ts (with 1000 entry limit enforcement)
- [ ] T007 Add loadLogs function to src/lib/services/storage.ts (returns LogEntry[] from tm_logs key)
- [ ] T008 Add clearLogs function to src/lib/services/storage.ts (removes tm_logs key)
- [ ] T009 [P] Write unit tests for logStore in tests/unit/logStore.test.ts (addEntry, loadFromStorage, 1000 entry limit) - tests MUST fail initially
- [ ] T010 [P] Write unit tests for logging service in tests/unit/logging.test.ts (context capture, entry creation) - tests MUST fail initially
- [ ] T011 Create logStore in src/lib/stores/logStore.svelte.ts (entries state, isLoaded state, addEntry, loadFromStorage methods)
- [ ] T012 Create logging service in src/lib/services/logging.ts (logAction function that captures context from sessionStore/timerStore)

**Checkpoint**: Foundation ready - types, storage, store, and logging service all in place

---

## Phase 3: User Story 1 - View Interaction Logs for Debugging (Priority: P1) 🎯 MVP

**Goal**: Capture all UI interactions with full context and display them in a log viewer accessible from Settings

**Independent Test**: Trigger various UI interactions (Start Day, Complete Task, etc.) and verify log viewer shows all actions with timestamps and context

### Implementation for User Story 1

- [ ] T013 [US1] Create LogViewer.svelte component shell in src/lib/components/LogViewer.svelte (modal structure with header, scrollable entries list, close button)
- [ ] T014 [US1] Implement log entry display in LogViewer.svelte (human-readable timestamp "14:32:05.123", action, taskId, taskName, elapsedMs, sessionStatus, parameters - all inline)
- [ ] T015 [US1] Add real-time update to LogViewer.svelte (subscribe to logStore.entries, auto-scroll to newest)
- [ ] T016 [US1] Add "View Logs" button to SettingsPanel.svelte that opens LogViewer modal
- [ ] T017 [US1] Add logAction('START_DAY') call to handleStartSession in src/routes/+page.svelte
- [ ] T018 [US1] Add logAction('COMPLETE_TASK') call to handleCompleteTask in src/routes/+page.svelte (with taskId, elapsedMs params)
- [ ] T019 [US1] Add logAction('START_TASK') call to handleJumpToTask in src/routes/+page.svelte (with targetTaskId, previousElapsedMs params)
- [ ] T020 [US1] Add logAction('END_DAY') call to handleEndSession in src/routes/+page.svelte
- [ ] T021 [US1] Add logAction('INTERRUPT') call to handleStartInterruption in src/routes/+page.svelte (with taskId param)
- [ ] T022 [US1] Add logAction('RESUME_INTERRUPT') call to handleEndInterruption in src/routes/+page.svelte (with interruptionDurationMs param)
- [ ] T023 [US1] Add logAction('ADD_TASK') call to handleAddTask in src/routes/+page.svelte (with taskName, taskType, duration params)
- [ ] T024 [US1] Add logAction('REORDER_TASK') call to task reorder handler (with fromIndex, toIndex params)
- [ ] T025 [US1] Add logAction('EDIT_TASK') call to task edit handler (with taskId, changedFields params)
- [ ] T026 [US1] Add logAction('UNCOMPLETE_TASK') call to uncomplete handler (with taskId param)
- [ ] T027 [US1] Add logAction('BACK_TO_IMPORT') and logAction('START_NEW_DAY') calls to respective handlers in src/routes/+page.svelte
- [ ] T028 [US1] Load logs from storage on app mount (call logStore.loadFromStorage in +page.svelte onMount)
- [ ] T029 [US1] Write component test for LogViewer in tests/component/LogViewer.test.ts (renders entries, shows all fields, reverse chronological order)

**Checkpoint**: User Story 1 complete - all 12 actions logged, viewable in Settings panel with full context

---

## Phase 4: User Story 2 - Export Logs for External Analysis (Priority: P2)

**Goal**: Export all log entries to CSV file for analysis in Excel

**Independent Test**: Generate log entries, click Export, verify downloaded CSV opens correctly in Excel with all columns

### Implementation for User Story 2

- [ ] T030 [US2] Add exportToCsv method to logStore in src/lib/stores/logStore.svelte.ts (generates CSV string with headers: timestamp, action, taskId, taskName, elapsedMs, sessionStatus, parameters)
- [ ] T031 [US2] Add "Export" button to LogViewer.svelte header
- [ ] T032 [US2] Implement CSV download in LogViewer.svelte (create blob, trigger download with filename logs-YYYY-MM-DD.csv)
- [ ] T033 [US2] Handle parameters column in CSV export (JSON stringify for nested object)
- [ ] T034 [US2] Write unit test for exportToCsv in tests/unit/logStore.test.ts (correct CSV format, proper escaping, all columns)

**Checkpoint**: User Story 2 complete - CSV export works, opens in Excel

---

## Phase 5: User Story 3 - Clear Logs When Starting Fresh (Priority: P3)

**Goal**: Allow users to clear all logs with confirmation dialog

**Independent Test**: Create log entries, click Clear, confirm, verify logs are empty

### Implementation for User Story 3

- [ ] T035 [US3] Add clearAll method to logStore in src/lib/stores/logStore.svelte.ts (clears entries array, calls clearLogs from storage service)
- [ ] T036 [US3] Add "Clear" button to LogViewer.svelte header
- [ ] T037 [US3] Implement confirmation dialog before clearing (window.confirm or custom dialog)
- [ ] T038 [US3] Handle cancel - logs remain intact
- [ ] T039 [US3] Write unit test for clearAll in tests/unit/logStore.test.ts (clears entries, persists to storage)

**Checkpoint**: User Story 3 complete - clear with confirmation works

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, performance, documentation

- [ ] T040 [P] Implement aggressive pruning on storage quota error in src/lib/services/storage.ts (prune beyond 1000 limit, retry save)
- [ ] T041 [P] Add empty state UI to LogViewer.svelte (show message when no logs exist)
- [ ] T042 [P] Style LogViewer.svelte with Tailwind CSS (dark mode support, scrollable container, readable typography)
- [ ] T043 [P] Update docs/USER_GUIDE.md with log viewer instructions (accessing via Settings, viewing entries, export, clear)
- [ ] T044 [P] Update docs/API.md with logStore interface (entries, addEntry, loadFromStorage, exportToCsv, clearAll) and logging service (logAction)
- [ ] T045 Run all tests and fix any failures
- [ ] T046 Run quickstart.md validation scenarios manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational (Phase 2)**: No dependencies - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion (can run parallel to US1)
- **User Story 3 (Phase 5)**: Depends on Foundational completion (can run parallel to US1/US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - MVP standalone
- **User Story 2 (P2)**: Requires LogViewer UI from US1 for Export button placement
- **User Story 3 (P3)**: Requires LogViewer UI from US1 for Clear button placement

### Within Each Phase

- Types (T002-T005) can run in parallel
- Storage functions (T006-T008) should run sequentially (same file)
- Store (T009) depends on types and storage
- Logging service (T010) depends on store
- Tests (T011-T012) depend on their implementation targets

### Parallel Opportunities

**Phase 2 - Types (all parallel)**:
```
T002: Add LogAction type
T003: Add LogEntry interface
T004: Add LogStorage interface
T005: Add log constants
```

**Phase 3 - Logging calls (all parallel, different handlers)**:
```
T017: START_DAY logging
T018: COMPLETE_TASK logging
T019: START_TASK logging
T020: END_DAY logging
T021: INTERRUPT logging
T022: RESUME_INTERRUPT logging
T023: ADD_TASK logging
T024: REORDER_TASK logging
T025: EDIT_TASK logging
T026: UNCOMPLETE_TASK logging
T027: BACK_TO_IMPORT, START_NEW_DAY logging
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (types, storage, store, logging service)
2. Complete Phase 3: User Story 1 (LogViewer + all logging calls)
3. **STOP and VALIDATE**: Test all 12 actions are logged, viewer shows entries correctly
4. Deploy/demo if ready

### Incremental Delivery

1. **Foundational** → Core infrastructure ready
2. **+ User Story 1** → Can view all logged actions (MVP!)
3. **+ User Story 2** → Can export to CSV for Excel analysis
4. **+ User Story 3** → Can clear logs for fresh debugging sessions
5. **+ Polish** → Edge cases handled, styled, documented

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers:
- All 12 UI interactions logged with full context
- Log viewer accessible from Settings
- Real-time updates
- Persistence across refreshes

Export and Clear are P2/P3 enhancements.

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- CSV export uses comma delimiter, quotes for strings, JSON for parameters column
