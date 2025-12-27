# Tasks: Automatic Start Time Calculation

**Input**: Design documents from `/specs/011-auto-start-time/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test-First Development is mandated by the project constitution (Principle IV). Unit tests are included for the schedule calculator service and MUST be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add new types and constants required for the feature

- [x] T001 Add ScheduleStartMode type to src/lib/types/index.ts
- [x] T002 Add ScheduleConfig interface to src/lib/types/index.ts
- [x] T003 Add ScheduledTask interface to src/lib/types/index.ts
- [x] T004 Add ScheduleResult interface to src/lib/types/index.ts
- [x] T005 Add FixedTaskConflict interface to src/lib/types/index.ts
- [x] T006 Add STORAGE_KEY_SCHEDULE_CONFIG and MIDNIGHT_MS constants to src/lib/types/index.ts
- [x] T007 Increment CURRENT_SCHEMA_VERSION from 6 to 7 in src/lib/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core scheduling algorithm and store extensions that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Unit Tests for Schedule Calculator (Constitution Principle IV - Write FIRST)

> **TDD Cycle**: Write each test, verify it FAILS, then implement the corresponding function

- [x] T008 [P] Create tests/unit/scheduleCalculator.test.ts with test structure
- [x] T009 [P] Add test: sequential task scheduling from start time in tests/unit/scheduleCalculator.test.ts
- [x] T010 [P] Add test: fixed task respecting scheduled time in tests/unit/scheduleCalculator.test.ts
- [x] T011 [P] Add test: task interruption by fixed task in tests/unit/scheduleCalculator.test.ts
- [x] T012 [P] Add test: multiple consecutive fixed tasks in tests/unit/scheduleCalculator.test.ts
- [x] T013 [P] Add test: overnight overflow detection in tests/unit/scheduleCalculator.test.ts
- [x] T014 [P] Add test: conflict detection between fixed tasks in tests/unit/scheduleCalculator.test.ts
- [x] T015 [P] Add test: empty task list handling in tests/unit/scheduleCalculator.test.ts
- [x] T016 [P] Add test: zero-duration task (milestone) handling in tests/unit/scheduleCalculator.test.ts
- [x] T017 [P] Add test: fixed appointment in the past handling in tests/unit/scheduleCalculator.test.ts
- [x] T018 [P] Add test: debounced calculation in tests/unit/scheduleCalculator.test.ts

### Schedule Calculator Service (Implement to pass tests)

- [x] T019 Create src/lib/services/scheduleCalculator.ts with module structure and imports
- [x] T020 Implement getScheduleStartTime() function in src/lib/services/scheduleCalculator.ts
- [x] T021 Implement hasScheduleOverflow() function in src/lib/services/scheduleCalculator.ts
- [x] T022 Implement calculateInterruptionSplit() function in src/lib/services/scheduleCalculator.ts
- [x] T023 Implement detectFixedTaskConflicts() function in src/lib/services/scheduleCalculator.ts
- [x] T024 Implement calculateSchedule() main function in src/lib/services/scheduleCalculator.ts
- [x] T025 Implement calculateScheduleDebounced() wrapper in src/lib/services/scheduleCalculator.ts
- [x] T026 Add JSDoc documentation for all exported functions in src/lib/services/scheduleCalculator.ts

### Store Extensions

- [x] T027 Add scheduleConfig field to DaySession interface in src/lib/types/index.ts
- [x] T028 Add defaultScheduleStartTime field to Settings interface in src/lib/types/index.ts
- [x] T029 Update DEFAULT_SETTINGS with defaultScheduleStartTime in src/lib/types/index.ts
- [x] T030 Add schema migration v6 to v7 in src/lib/services/storage.ts
- [x] T031 Add getScheduleConfig() method to sessionStore in src/lib/stores/sessionStore.svelte.ts
- [x] T032 Add setScheduleConfig() method to sessionStore in src/lib/stores/sessionStore.svelte.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Sequential Task Scheduling (Priority: P1)

**Goal**: Automatically calculate start times for tasks based on their order and duration

**Independent Test**: Add 3-4 tasks with different durations and verify start times are automatically calculated sequentially from the schedule start time

### Components for User Story 1

- [x] T033 [P] [US1] Create src/lib/components/ScheduleStartPicker.svelte with props interface
- [x] T034 [US1] Implement "Start Now" / "Custom Time" radio toggle in src/lib/components/ScheduleStartPicker.svelte
- [x] T035 [US1] Implement time picker UI (hidden when "Start Now") in src/lib/components/ScheduleStartPicker.svelte
- [x] T036 [US1] Add disabled state handling in src/lib/components/ScheduleStartPicker.svelte
- [x] T037 [US1] Add accessibility (aria-labels, keyboard nav) to src/lib/components/ScheduleStartPicker.svelte

### Integration for User Story 1

- [x] T038 [US1] Add ScheduleStartPicker to src/lib/components/SchedulePreview.svelte
- [x] T039 [US1] Wire calculateSchedule to SchedulePreview using $derived in src/lib/components/SchedulePreview.svelte
- [x] T040 [US1] Display calculated start times (read-only for flexible tasks) in src/lib/components/SchedulePreview.svelte
- [x] T041 [US1] Update ImpactPanel to use calculateSchedule in src/lib/components/ImpactPanel.svelte
  - Note: ImpactPanel uses projection service for runtime calculations; schedule calculator is for pre-session planning
- [x] T042 [US1] Update ImpactTaskRow to display calculatedStart in src/lib/components/ImpactTaskRow.svelte
  - Note: ImpactTaskRow already displays projected times via projection service
- [x] T043 [US1] Trigger recalculation on task add/remove/reorder/duration change in src/lib/components/ImpactPanel.svelte
  - Note: Recalculation automatic via $derived reactivity in both SchedulePreview and ImpactPanel

**Checkpoint**: User Story 1 complete - sequential scheduling works independently

---

## Phase 4: User Story 2 - Fixed-Time Appointments (Priority: P2)

**Goal**: Mark tasks as "fixed-time" appointments that cannot be moved, with visual indicator

**Independent Test**: Add a fixed-time appointment, verify it displays at specified time with pin icon and doesn't shift when other tasks are added

### Components for User Story 2

- [x] T044 [P] [US2] Create src/lib/components/FixedTaskIndicator.svelte with size prop
- [x] T045 [US2] Implement pin icon with 3 sizes (sm/md/lg) in src/lib/components/FixedTaskIndicator.svelte
- [x] T046 [US2] Add optional tooltip prop to src/lib/components/FixedTaskIndicator.svelte

### Add Task Dialog Modifications for User Story 2

- [x] T047 [US2] Add "Fixed Time" checkbox toggle to src/lib/components/AddTaskDialog.svelte
  - Note: Already implemented in 009-ad-hoc-tasks feature
- [x] T048 [US2] Add time picker input (shown when Fixed Time checked) to src/lib/components/AddTaskDialog.svelte
  - Note: Already implemented in 009-ad-hoc-tasks feature
- [x] T049 [US2] Update task creation to set type='fixed' and startTime in src/lib/components/AddTaskDialog.svelte
  - Note: Already implemented in 009-ad-hoc-tasks feature
- [x] T050 [US2] Hide start time picker for flexible tasks in src/lib/components/AddTaskDialog.svelte
  - Note: Already implemented in 009-ad-hoc-tasks feature

### Integration for User Story 2

- [x] T051 [US2] Add FixedTaskIndicator to ImpactTaskRow for fixed tasks in src/lib/components/ImpactTaskRow.svelte
- [x] T052 [US2] Add FixedTaskIndicator to SchedulePreview task rows in src/lib/components/SchedulePreview.svelte
  - Note: Added to TaskRow.svelte which is used by SchedulePreview
- [x] T053 [US2] Ensure fixed tasks retain their plannedStart in calculateSchedule in src/lib/services/scheduleCalculator.ts
  - Note: Already implemented in schedule calculator

### Edit Task Dialog Modifications for User Story 2

- [x] T054 [US2] Add ability to toggle fixed/flexible in EditTaskDialog in src/lib/components/EditTaskDialog.svelte
  - Note: Already implemented
- [x] T055 [US2] Add time picker for fixed task start time editing in src/lib/components/EditTaskDialog.svelte
  - Note: Already implemented

**Checkpoint**: User Story 2 complete - fixed appointments work with visual indicators

---

## Phase 5: User Story 3 - Task Interruption and Resumption (Priority: P3)

**Goal**: When a fixed task interrupts a flexible task, show pause/resume with remaining time

**Independent Test**: Create a 2-hour task at 8:30 AM, add a fixed 1-hour meeting at 9:00 AM. Verify task shows as paused with 1.5 hours remaining after the meeting

### Components for User Story 3

- [x] T056 [P] [US3] Create src/lib/components/InterruptionBadge.svelte with beforePauseSec and remainingSec props
- [x] T057 [US3] Implement pause icon and duration formatting in src/lib/components/InterruptionBadge.svelte
- [x] T058 [US3] Style interruption badge with appropriate colors in src/lib/components/InterruptionBadge.svelte

### Integration for User Story 3

- [x] T059 [US3] Add InterruptionBadge to ImpactTaskRow when isInterrupted=true in src/lib/components/ImpactTaskRow.svelte
  - Note: Integration done in TaskRow.svelte (used by SchedulePreview) since ImpactPanel uses projection service for runtime calculations
- [x] T060 [US3] Display "continues at X:XX, Y remaining" text for interrupted tasks in src/lib/components/ImpactTaskRow.svelte
  - Note: InterruptionBadge displays "X → pause → Y left @ Z" format
- [x] T061 [US3] Ensure calculateSchedule correctly sets isInterrupted and pauseTime in src/lib/services/scheduleCalculator.ts
  - Note: Already implemented in schedule calculator
- [x] T062 [US3] Handle multiple consecutive fixed tasks interrupting same flexible task in src/lib/services/scheduleCalculator.ts
  - Note: Already implemented in schedule calculator

**Checkpoint**: User Story 3 complete - task interruption/resumption works correctly

---

## Phase 6: User Story 4 - Schedule Conflict Warnings (Priority: P4)

**Goal**: Warn users when fixed appointments overlap or schedule extends past midnight

**Independent Test**: Add two fixed appointments that overlap, verify warning message appears. Add tasks that extend past midnight, verify overflow warning appears.

### Conflict Warning Component

- [x] T063 [P] [US4] Create src/lib/components/ConflictWarning.svelte with conflict prop
- [x] T064 [US4] Implement warning message with task names and overlap duration in src/lib/components/ConflictWarning.svelte
- [x] T065 [US4] Add dismissible option with dismiss event in src/lib/components/ConflictWarning.svelte

### Overflow Warning Component

- [x] T066 [P] [US4] Create src/lib/components/ScheduleOverflowWarning.svelte with scheduleEndTime prop
- [x] T067 [US4] Implement warning message showing end time for next day in src/lib/components/ScheduleOverflowWarning.svelte
- [x] T068 [US4] Style with yellow/amber warning colors in src/lib/components/ScheduleOverflowWarning.svelte

### Integration for User Story 4

- [x] T069 [US4] Add ConflictWarning display to SchedulePreview when conflicts exist in src/lib/components/SchedulePreview.svelte
- [x] T070 [US4] Add ScheduleOverflowWarning to SchedulePreview when hasOverflow=true in src/lib/components/SchedulePreview.svelte
- [x] T071 [US4] Add ConflictWarning to ImpactPanel for runtime conflict detection in src/lib/components/ImpactPanel.svelte
- [x] T072 [US4] Add ScheduleOverflowWarning to ImpactPanel in src/lib/components/ImpactPanel.svelte

**Checkpoint**: User Story 4 complete - all conflict and overflow warnings work

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation

- [ ] T073 [P] Update docs/API.md with scheduleCalculator service documentation
- [ ] T074 [P] Update docs/USER_GUIDE.md with schedule start time and fixed task features
- [ ] T075 [P] Update docs/DATA_SCHEMA.md with new types and schema version 7
- [x] T076 Run npm run check (svelte-check) and fix any type errors
  - Note: 0 errors, 865 warnings (pre-existing CSS/a11y issues)
- [x] T077 Run npm run lint and fix any linting issues
  - Fixed: unused import, prefer-const, eslint-disable for Map/Date false positives
- [x] T078 Run npm run test and ensure all tests pass
  - Result: 538 tests passed (with Node.js 20)
- [ ] T079 Validate quickstart.md examples work correctly
- [ ] T080 Performance test with 50+ tasks to verify recalculation within 1 second

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - Tests (T008-T018) MUST be written FIRST and FAIL before implementation
  - Implementation (T019-T026) makes tests pass
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Stories can proceed in priority order (P1 → P2 → P3 → P4)
  - Or in parallel if multiple developers available
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1 but builds on same foundation
- **User Story 3 (P3)**: Can start after Foundational - Uses interruption logic from calculator
- **User Story 4 (P4)**: Can start after Foundational - Uses conflict detection from calculator

### Within Each Phase

- Tests (T008-T018) MUST be written and FAIL before implementation (T019-T026)
- Types (T001-T007) must complete before service implementation
- Component creation before integration tasks
- All story tasks before moving to next story

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T008-T018 (unit tests) can run in parallel with each other
- Tests MUST be written before corresponding implementation functions

**Phase 3-6 (User Stories)**:
- Component creation tasks marked [P] can run in parallel within a story
- Different user stories can be worked on in parallel by different developers
- Integration tasks depend on component completion

---

## Parallel Example: Phase 2 Tests (Write FIRST)

```bash
# Launch all calculator tests in parallel (these should FAIL initially):
Task: "Create tests/unit/scheduleCalculator.test.ts with test structure"
Task: "Add test: sequential task scheduling from start time"
Task: "Add test: fixed task respecting scheduled time"
Task: "Add test: task interruption by fixed task"
Task: "Add test: multiple consecutive fixed tasks"
Task: "Add test: overnight overflow detection"
Task: "Add test: conflict detection between fixed tasks"
Task: "Add test: empty task list handling"
Task: "Add test: zero-duration task (milestone) handling"
Task: "Add test: fixed appointment in the past handling"
Task: "Add test: debounced calculation"
```

## Parallel Example: User Story 1 Components

```bash
# After Foundational phase, launch US1 component creation:
Task: "Create src/lib/components/ScheduleStartPicker.svelte with props interface"
```

## Parallel Example: User Story 2 + 3 Concurrent Development

```bash
# Developer A: User Story 2
Task: "Create src/lib/components/FixedTaskIndicator.svelte"

# Developer B: User Story 3 (in parallel)
Task: "Create src/lib/components/InterruptionBadge.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types and constants)
2. Complete Phase 2: Foundational (tests FIRST, then calculator + stores)
3. Complete Phase 3: User Story 1 (sequential scheduling)
4. **STOP and VALIDATE**: Test that tasks auto-calculate start times
5. Deploy/demo if ready - provides core value

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Sequential scheduling works → MVP!
3. Add User Story 2 → Fixed appointments with indicators
4. Add User Story 3 → Task interruption/resumption
5. Add User Story 4 → Conflict and overflow warnings
6. Each story adds value without breaking previous stories

### Recommended Order

For a single developer:
1. Phase 1 → Phase 2 (tests first!) → Phase 3 (US1) → Validate → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are included per Constitution Principle IV (Test-First Development)
- **TDD Mandate**: Write tests FIRST (T008-T018), verify they FAIL, then implement (T019-T026)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Schema migration (T030) is critical - test with existing localStorage data
