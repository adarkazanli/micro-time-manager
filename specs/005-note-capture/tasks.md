# Tasks: Note Capture

**Input**: Design documents from `/specs/005-note-capture/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included per Constitution IV (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, storage, and store foundation

- [ ] T001 [P] Add Note interface and constants to src/lib/types/index.ts
- [ ] T002 [P] Add schema v3→v4 migration to src/lib/services/storage.ts
- [ ] T003 Add saveNotes, loadNotes, clearNotes methods to src/lib/services/storage.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core store infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create noteStore with state and getters in src/lib/stores/noteStore.svelte.ts
- [ ] T005 Implement addNote action with UUID generation and validation in src/lib/stores/noteStore.svelte.ts
- [ ] T006 Implement restore and reset methods for persistence in src/lib/stores/noteStore.svelte.ts
- [ ] T007 Add unit tests for noteStore CRUD operations in tests/unit/noteStore.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Quick Note Capture During Task (Priority: P1) 🎯 MVP

**Goal**: User can capture a note with keyboard shortcut without disrupting timer

**Independent Test**: Start a task, press Ctrl/Cmd+N, type note, press Enter - note is saved and linked to task

### Tests for User Story 1

- [ ] T008 [P] [US1] Add e2e test for keyboard shortcut opens inline input in tests/e2e/note-capture.test.ts
- [ ] T009 [P] [US1] Add e2e test for note saved with Enter key in tests/e2e/note-capture.test.ts
- [ ] T010 [P] [US1] Add e2e test for note linked to active task in tests/e2e/note-capture.test.ts
- [ ] T011 [P] [US1] Add e2e test for general note when no task active in tests/e2e/note-capture.test.ts

### Implementation for User Story 1

- [ ] T012 [US1] Create NoteInput component with textarea and char counter in src/lib/components/NoteInput.svelte
- [ ] T013 [US1] Add openInput/closeInput actions to noteStore in src/lib/stores/noteStore.svelte.ts
- [ ] T014 [US1] Add keyboard shortcut handler (Ctrl/Cmd+N) in src/routes/+page.svelte
- [ ] T015 [US1] Integrate NoteInput inline display in src/routes/+page.svelte
- [ ] T016 [US1] Connect save handler to noteStore.addNote with task association in src/routes/+page.svelte
- [ ] T017 [US1] Add "Add Note" button as shortcut alternative in src/routes/+page.svelte
- [ ] T018 [US1] Persist notes to storage on addNote in src/routes/+page.svelte

**Checkpoint**: User Story 1 complete - notes can be captured quickly during tasks

---

## Phase 4: User Story 2 - View Notes Chronologically (Priority: P2)

**Goal**: User can view all notes in a panel, sorted newest-first with task names

**Independent Test**: Create several notes, open Notes view, verify order and task names displayed

### Tests for User Story 2

- [ ] T019 [P] [US2] Add e2e test for notes displayed newest-first in tests/e2e/note-capture.test.ts
- [ ] T020 [P] [US2] Add e2e test for task name shown on notes in tests/e2e/note-capture.test.ts
- [ ] T021 [P] [US2] Add e2e test for "General" label on unassociated notes in tests/e2e/note-capture.test.ts

### Implementation for User Story 2

- [ ] T022 [P] [US2] Create NoteRow component with content, timestamp, task name in src/lib/components/NoteRow.svelte
- [ ] T023 [US2] Add formatRelativeTime utility to existing src/lib/utils/time.ts
- [ ] T024 [US2] Create NotesView component with notes list in src/lib/components/NotesView.svelte
- [ ] T025 [US2] Add toggleView action and isViewOpen state to noteStore in src/lib/stores/noteStore.svelte.ts
- [ ] T026 [US2] Add Notes toggle button and panel in src/routes/+page.svelte
- [ ] T027 [US2] Add empty state message when no notes exist in src/lib/components/NotesView.svelte

**Checkpoint**: User Story 2 complete - notes can be viewed in chronological order

---

## Phase 5: User Story 3 - Filter Notes by Task (Priority: P3)

**Goal**: User can filter notes by task in Notes view

**Independent Test**: Create notes for different tasks, select filter, verify only matching notes shown

### Tests for User Story 3

- [ ] T028 [P] [US3] Add e2e test for task filter dropdown in tests/e2e/note-capture.test.ts
- [ ] T029 [P] [US3] Add e2e test for filtering by specific task in tests/e2e/note-capture.test.ts
- [ ] T030 [P] [US3] Add e2e test for "General Notes" filter option in tests/e2e/note-capture.test.ts

### Implementation for User Story 3

- [ ] T031 [US3] Add setTaskFilter action and taskFilter state to noteStore in src/lib/stores/noteStore.svelte.ts
- [ ] T032 [US3] Add filteredNotes derived state to noteStore in src/lib/stores/noteStore.svelte.ts
- [ ] T033 [US3] Add task filter dropdown to NotesView in src/lib/components/NotesView.svelte
- [ ] T034 [US3] Connect filter dropdown to noteStore.setTaskFilter in src/lib/components/NotesView.svelte

**Checkpoint**: User Story 3 complete - notes can be filtered by task

---

## Phase 6: User Story 4 - Search Notes (Priority: P3)

**Goal**: User can search notes by content

**Independent Test**: Create notes with specific content, search for keyword, verify matches shown

### Tests for User Story 4

- [ ] T035 [P] [US4] Add e2e test for search input in Notes view in tests/e2e/note-capture.test.ts
- [ ] T036 [P] [US4] Add e2e test for case-insensitive search in tests/e2e/note-capture.test.ts
- [ ] T037 [P] [US4] Add e2e test for no results empty state in tests/e2e/note-capture.test.ts

### Implementation for User Story 4

- [ ] T038 [US4] Add setSearchQuery action and searchQuery state to noteStore in src/lib/stores/noteStore.svelte.ts
- [ ] T039 [US4] Update filteredNotes to include search filter in src/lib/stores/noteStore.svelte.ts
- [ ] T040 [US4] Add search input field to NotesView in src/lib/components/NotesView.svelte
- [ ] T041 [US4] Connect search input to noteStore.setSearchQuery in src/lib/components/NotesView.svelte

**Checkpoint**: User Story 4 complete - notes can be searched by content

---

## Phase 7: User Story 5 - Edit and Delete Notes (Priority: P4)

**Goal**: User can edit note content and delete notes with confirmation

**Independent Test**: Create note, edit content, verify change persists; delete note, confirm, verify removed

### Tests for User Story 5

- [ ] T042 [P] [US5] Add e2e test for edit action on note in tests/e2e/note-capture.test.ts
- [ ] T043 [P] [US5] Add e2e test for delete with confirmation in tests/e2e/note-capture.test.ts
- [ ] T044 [P] [US5] Add e2e test for cancel delete in tests/e2e/note-capture.test.ts

### Implementation for User Story 5

- [ ] T045 [US5] Add updateNote and deleteNote actions to noteStore in src/lib/stores/noteStore.svelte.ts
- [ ] T046 [US5] Add unit tests for updateNote and deleteNote in tests/unit/noteStore.test.ts
- [ ] T047 [US5] Add edit mode to NoteRow component in src/lib/components/NoteRow.svelte
- [ ] T048 [US5] Create DeleteConfirmDialog component in src/lib/components/DeleteConfirmDialog.svelte
- [ ] T049 [US5] Connect edit/delete actions in NotesView in src/lib/components/NotesView.svelte
- [ ] T050 [US5] Persist changes after edit/delete in src/routes/+page.svelte

**Checkpoint**: User Story 5 complete - notes can be edited and deleted

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, persistence, and final validation

- [ ] T051 [P] Add note persistence restore on page mount in src/routes/+page.svelte
- [ ] T052 [P] Add e2e test for persistence across page refresh in tests/e2e/note-capture.test.ts
- [ ] T053 [P] Update API.md with noteStore documentation in docs/API.md
- [ ] T054 [P] Update USER_GUIDE.md with note capture instructions in docs/USER_GUIDE.md
- [ ] T055 [P] Update DATA_SCHEMA.md with tm_notes structure in docs/DATA_SCHEMA.md
- [ ] T056 Run all tests and verify passing (npm test && npm run test:e2e)
- [ ] T057 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Can start immediately after Foundational
  - US2 (P2): Can start after US1 (needs notes to display)
  - US3 (P3): Can start after US2 (needs NotesView)
  - US4 (P3): Can start after US2 (needs NotesView)
  - US5 (P4): Can start after US2 (needs NoteRow)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - No dependencies on other stories
- **User Story 2 (P2)**: After US1 - Needs notes to exist for viewing
- **User Story 3 (P3)**: After US2 - Extends NotesView with filtering
- **User Story 4 (P3)**: After US2 - Extends NotesView with search (parallel with US3)
- **User Story 5 (P4)**: After US2 - Extends NoteRow with edit/delete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Store changes before components
- Components before page integration
- Core implementation before UI refinements

### Parallel Opportunities

- T001, T002 can run in parallel (different files)
- All test tasks within a story (T008-T011, T019-T021, etc.) can run in parallel
- US3 and US4 can run in parallel after US2 completes
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Add e2e test for keyboard shortcut opens inline input in tests/e2e/note-capture.test.ts"
Task: "Add e2e test for note saved with Enter key in tests/e2e/note-capture.test.ts"
Task: "Add e2e test for note linked to active task in tests/e2e/note-capture.test.ts"
Task: "Add e2e test for general note when no task active in tests/e2e/note-capture.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types, storage)
2. Complete Phase 2: Foundational (noteStore core)
3. Complete Phase 3: User Story 1 (quick capture)
4. **STOP and VALIDATE**: Test keyboard shortcut, note saves, task association
5. Deploy/demo if ready - users can capture notes!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Add User Story 2 → Test independently → Deploy (can view notes)
4. Add User Story 3 + 4 in parallel → Deploy (filter + search)
5. Add User Story 5 → Deploy (edit/delete)
6. Polish phase → Final release

### Task Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 3 | 2 |
| Foundational | 4 | 0 |
| US1 (P1) | 11 | 4 |
| US2 (P2) | 9 | 3 |
| US3 (P3) | 7 | 3 |
| US4 (P3) | 7 | 3 |
| US5 (P4) | 9 | 3 |
| Polish | 7 | 5 |
| **Total** | **57** | **23** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
