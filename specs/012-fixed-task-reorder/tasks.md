# Tasks: Fixed Task Reorder Behavior

**Input**: Design documents from `/specs/012-fixed-task-reorder/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included per Constitution Principle IV (Test-First Development).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared utility functions needed by all user stories

- [x] T001 [P] Create scroll utility function in src/lib/utils/scroll.ts
- [x] T002 [P] Create task reorder utility function in src/lib/utils/taskOrder.ts
- [x] T003 [P] Add data-task-id attribute and highlighted prop to TaskRow in src/lib/components/TaskRow.svelte
- [x] T004 [P] Add highlight animation CSS to TaskRow in src/lib/components/TaskRow.svelte

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Write unit tests for utility functions (Test-First per Constitution)

**⚠️ CRITICAL**: Tests must be written and FAIL before implementation

- [x] T005 [P] Write unit tests for reorderTaskChronologically in tests/unit/taskReorder.test.ts
- [x] T006 [P] Write unit tests for scrollToTaskAndHighlight in tests/unit/scroll.test.ts
- [x] T007 Implement reorderTaskChronologically function per tests in src/lib/utils/taskOrder.ts
- [x] T008 Implement scrollToTaskAndHighlight function per tests in src/lib/utils/scroll.ts
- [ ] T009 Verify all unit tests pass for utility functions

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Flexible Task Stays in Position (Priority: P1) 🎯 MVP

**Goal**: When a task is switched from fixed to flexible, it stays at its current position in the list

**Independent Test**: Change a fixed task to flexible and verify it stays in the same list position

### Implementation for User Story 1

- [x] T010 [US1] Verify EditTaskDialog already supports type toggle (no changes needed) in src/lib/components/EditTaskDialog.svelte
- [x] T011 [US1] Verify SchedulePreview does not reorder on fixed→flexible type change in src/lib/components/SchedulePreview.svelte
- [x] T012 [US1] Verify ImpactPanel does not reorder on fixed→flexible type change in src/lib/components/ImpactPanel.svelte
- [x] T013 [US1] Document FR-001 compliance (task stays in position)

**Checkpoint**: User Story 1 complete - fixed→flexible type change preserves position

---

## Phase 4: User Story 2 - Fixed Task Auto-Reorders by Time (Priority: P1)

**Goal**: When a task is switched from flexible to fixed with a start time, it auto-reorders to chronological position

**Independent Test**: Change a flexible task to fixed with a specific time and verify it moves to the correct chronological position

### Tests for User Story 2

- [ ] T014 [P] [US2] Write component test for SchedulePreview reorder behavior in tests/component/SchedulePreview.reorder.test.ts
- [ ] T015 [P] [US2] Write component test for ImpactPanel reorder behavior in tests/component/ImpactPanel.reorder.test.ts

### Implementation for User Story 2

- [x] T016 [US2] Add highlightedTaskId state to SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T017 [US2] Implement handleTaskUpdate with reorder logic in SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T018 [US2] Pass highlighted prop to TaskRow in SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T019 [US2] Add highlightedTaskId state to ImpactPanel in src/lib/components/ImpactPanel.svelte
- [x] T020 [US2] Implement handleSaveTask with reorder logic in ImpactPanel in src/lib/components/ImpactPanel.svelte
- [x] T021 [US2] Pass highlighted prop to ImpactTaskRow/TaskRow in ImpactPanel in src/lib/components/ImpactPanel.svelte
- [ ] T022 [US2] Verify component tests pass

**Checkpoint**: User Story 2 complete - flexible→fixed type change auto-reorders chronologically

---

## Phase 5: User Story 3 - Auto-Scroll to Repositioned Task (Priority: P2)

**Goal**: After a task is repositioned, auto-scroll to it and highlight briefly

**Independent Test**: Reposition a task to outside the viewport and verify scroll + highlight occurs

### Tests for User Story 3

- [ ] T023 [P] [US3] Write integration test for scroll behavior in tests/component/TaskReorder.scroll.test.ts

### Implementation for User Story 3

- [x] T024 [US3] Call scrollToTaskAndHighlight after reorder in SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T025 [US3] Call scrollToTaskAndHighlight after reorder in ImpactPanel in src/lib/components/ImpactPanel.svelte
- [x] T026 [US3] Verify scroll only triggers when task is outside viewport
- [x] T027 [US3] Verify highlight animation displays correctly in light and dark mode
- [ ] T028 [US3] Verify integration test passes

**Checkpoint**: User Story 3 complete - auto-scroll and highlight work correctly

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, edge cases, and final verification

- [x] T029 [P] Update JSDoc comments for new utility functions in src/lib/utils/scroll.ts
- [x] T030 [P] Update JSDoc comments for new utility functions in src/lib/utils/taskOrder.ts
- [x] T031 [P] Update component documentation in SchedulePreview in src/lib/components/SchedulePreview.svelte
- [x] T032 [P] Update component documentation in ImpactPanel in src/lib/components/ImpactPanel.svelte
- [x] T033 Handle edge case: same-time fixed tasks maintain relative order in src/lib/utils/taskOrder.ts
- [x] T034 Handle edge case: rapid type changes (verify debouncing works) in src/lib/components/SchedulePreview.svelte and src/lib/components/ImpactPanel.svelte
- [x] T035 Run full test suite and verify all tests pass
- [x] T036 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - creates test infrastructure
- **User Story 1 (Phase 3)**: Depends on Phase 2 - mostly verification
- **User Story 2 (Phase 4)**: Depends on Phase 2 - main implementation
- **User Story 3 (Phase 5)**: Depends on Phase 4 - builds on reorder
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - verifies existing behavior is correct
- **User Story 2 (P1)**: Uses utility functions from Phase 1/2
- **User Story 3 (P2)**: Depends on User Story 2 (scroll happens after reorder)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation tasks in order
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (all parallel)**:
```bash
Task: "Create scroll utility function in src/lib/utils/scroll.ts"
Task: "Create task reorder utility function in src/lib/utils/taskOrder.ts"
Task: "Add data-task-id attribute and highlighted prop to TaskRow"
Task: "Add highlight animation CSS to TaskRow"
```

**Phase 2 tests (parallel)**:
```bash
Task: "Write unit tests for reorderTaskChronologically"
Task: "Write unit tests for scrollToTaskAndHighlight"
```

**Phase 4 tests (parallel)**:
```bash
Task: "Write component test for SchedulePreview reorder behavior"
Task: "Write component test for ImpactPanel reorder behavior"
```

**Phase 6 documentation (parallel)**:
```bash
Task: "Update JSDoc comments for scroll.ts"
Task: "Update JSDoc comments for taskOrder.ts"
Task: "Update component documentation in SchedulePreview"
Task: "Update component documentation in ImpactPanel"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (utility functions)
2. Complete Phase 2: Foundational (tests + implementation)
3. Complete Phase 3: User Story 1 (verification)
4. Complete Phase 4: User Story 2 (main feature)
5. **STOP and VALIDATE**: Test reorder behavior works correctly
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Verify no regression (MVP!)
3. Add User Story 2 → Test → Verify reorder works
4. Add User Story 3 → Test → Verify scroll + highlight
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- User Stories 1 & 2 are both P1 priority but US1 is mostly verification while US2 is implementation
