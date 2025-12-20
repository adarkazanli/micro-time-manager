# Tasks: Settings Panel

**Input**: Design documents from `/specs/008-settings/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and storage key setup

- [x] T001 [P] Add Settings and Theme types to `src/lib/types/index.ts`
- [x] T002 [P] Add STORAGE_KEY_SETTINGS constant to `src/lib/types/index.ts`
- [x] T003 [P] Add DEFAULT_SETTINGS constant to `src/lib/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create settingsStore at `src/lib/stores/settingsStore.svelte.ts` with basic state
- [x] T005 Add settings persistence functions to `src/lib/services/storage.ts` (saveSettings, loadSettings)
- [x] T006 Add app schema migration v4→v5 (CURRENT_SCHEMA_VERSION bump) for settings initialization in `src/lib/services/storage.ts`
- [x] T007 Wire settingsStore to load from storage on initialization
- [x] T007a [P] Add error toast/feedback UI in SettingsPanel for storage failures (FR-015)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Access Settings Panel (Priority: P1) 🎯 MVP

**Goal**: Users can open and close a settings panel from the main interface

**Independent Test**: Click settings icon, panel opens; click outside or Escape, panel closes

### Implementation for User Story 1

- [x] T008 [US1] Create SettingsPanel component shell at `src/lib/components/SettingsPanel.svelte` with slide-out animation
- [x] T009 [US1] Add panel open/close state to settingsStore (`isPanelOpen` derived state or local state)
- [x] T010 [US1] Add settings gear icon to `src/routes/+page.svelte` main interface
- [x] T011 [US1] Implement click-outside-to-close behavior in SettingsPanel
- [x] T012 [US1] Implement Escape key to close panel in SettingsPanel
- [x] T013 [US1] Add ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) to SettingsPanel
- [x] T014 [US1] Add panel sections layout (Theme section header, Alerts section header)

**Checkpoint**: Settings panel opens/closes, organized into sections

---

## Phase 4: User Story 2 - Change Application Theme (Priority: P1)

**Goal**: Users can switch between Light, Dark, and System themes with immediate effect

**Independent Test**: Select Dark theme, all UI elements update immediately without refresh

### Implementation for User Story 2

- [x] T015 [US2] Create theme service at `src/lib/services/theme.ts` with applyTheme function
- [x] T016 [US2] Add dark mode CSS variables to `src/app.css` (background, text, borders, etc.)
- [x] T017 [US2] Add theme radio buttons (Light/Dark/System) to SettingsPanel Theme section
- [x] T018 [US2] Implement setTheme action in settingsStore that persists and applies theme
- [x] T019 [US2] Add system preference listener in theme service for `prefers-color-scheme` changes
- [x] T020 [US2] Initialize theme on app load from settingsStore in `src/routes/+layout.svelte` or `+page.svelte`
- [x] T021 [US2] Verify Tailwind `dark:` variants work with `dark` class on `<html>` element

**Checkpoint**: Theme switching works immediately, persists across sessions

---

## Phase 5: User Story 3 - Configure Task Warning Time (Priority: P1)

**Goal**: Users can customize when task ending warnings appear (0-30 minutes)

**Independent Test**: Set warning to 3 minutes, timer shows yellow 3 minutes before task ends

### Implementation for User Story 3

- [x] T022 [US3] Add warning threshold input (number input or slider, 0-30 min) to SettingsPanel Alerts section
- [x] T023 [US3] Implement setWarningThreshold action in settingsStore (converts minutes to seconds, validates 0-1800)
- [x] T024 [US3] Connect timerStore to read warningThresholdSec from settingsStore for color logic
- [x] T025 [US3] Update timer color calculation in timerStore to use dynamic threshold instead of WARNING_THRESHOLD_MS constant

**Checkpoint**: Task warning timing is configurable and affects timer color

---

## Phase 6: User Story 4 - Configure Fixed Task Alert Time (Priority: P2)

**Goal**: Users can control how far in advance they're alerted about fixed tasks (0-30 minutes)

**Independent Test**: Set alert to 15 minutes, fixed task alert appears 15 minutes before start

### Implementation for User Story 4

- [x] T026 [US4] Add fixed task alert input (number input, 0-30 min) to SettingsPanel Alerts section
- [x] T027 [US4] Implement setFixedTaskAlert action in settingsStore (validates 0-30)
- [x] T028 [US4] Connect sessionStore to read fixedTaskAlertMin from settingsStore for alert timing
- [x] T029 [US4] Update fixed task warning logic in sessionStore/ImpactPanel to use dynamic threshold

**Checkpoint**: Fixed task alert timing is configurable

---

## Phase 7: User Story 5 - Toggle Sound Notifications (Priority: P2)

**Goal**: Users can enable/disable sound alerts

**Independent Test**: Disable sounds, trigger a warning, no audio plays

### Implementation for User Story 5

- [x] T030 [US5] Add sound toggle switch to SettingsPanel Alerts section
- [x] T031 [US5] Implement setSoundEnabled action in settingsStore
- [x] T032 [US5] Add canPlayAudio capability detection in `src/lib/services/theme.ts`
- [x] T033 [US5] Add playAlertSound function that checks soundEnabled setting before playing
- [x] T034 [US5] Integrate sound trigger with task warning events (when timer goes red/yellow)

**Checkpoint**: Sound can be toggled on/off, plays on warnings when enabled

---

## Phase 8: User Story 6 - Toggle Vibration Notifications (Priority: P3)

**Goal**: Mobile users can enable/disable vibration for alerts

**Independent Test**: Enable vibration on mobile, trigger warning, device vibrates

### Implementation for User Story 6

- [x] T035 [US6] Add vibration toggle switch to SettingsPanel Alerts section
- [x] T036 [US6] Implement setVibrationEnabled action in settingsStore
- [x] T037 [US6] Add canVibrate capability detection using Navigator.vibrate API
- [x] T038 [US6] Hide or disable vibration toggle on devices without vibration support
- [x] T039 [US6] Add triggerVibration function that checks vibrationEnabled setting
- [x] T040 [US6] Integrate vibration trigger with task warning events

**Checkpoint**: Vibration toggle works on supported devices

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Testing, documentation, and final validation

- [ ] T041 [P] Write unit tests for settingsStore in `tests/unit/settingsStore.test.ts`
- [ ] T042 [P] Write unit tests for theme service in `tests/unit/theme.test.ts`
- [ ] T043 [P] Write e2e tests for settings flow in `tests/e2e/settings.spec.ts`
- [ ] T044 [P] Update USER_GUIDE.md with settings documentation
- [ ] T045 [P] Update API.md with settingsStore API documentation
- [ ] T046 [P] Update DATA_SCHEMA.md with Settings entity and tm_settings key
- [ ] T047 Run quickstart.md validation checklist
- [ ] T048 Run full test suite (`npm test`)
- [ ] T049 Run lint and type check (`npm run lint && npm run check`)
- [ ] T050 Run build verification (`npm run build`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (Panel Access) should complete first as it provides the UI container
  - US2-6 can proceed after US1 provides the panel structure
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Access Panel)**: Foundation only - creates the panel container
- **US2 (Theme)**: Depends on US1 panel existing, but theme logic is independent
- **US3 (Task Warning)**: Depends on US1, integrates with timerStore
- **US4 (Fixed Task Alert)**: Depends on US1, integrates with sessionStore
- **US5 (Sound)**: Depends on US1, can parallel with US3/US4
- **US6 (Vibration)**: Depends on US1, can parallel with US5

### Parallel Opportunities

- All Phase 1 Setup tasks (T001-T003) can run in parallel
- After US1 complete, US2-US6 can largely run in parallel (different sections of panel)
- All Phase 9 tests and documentation tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (types, constants)
2. Complete Phase 2: Foundational (store, storage)
3. Complete Phase 3: US1 - Panel access works
4. Complete Phase 4: US2 - Theme switching works
5. **STOP and VALIDATE**: Core settings functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Panel) → Basic panel opens/closes
3. Add US2 (Theme) → Theme switching (MVP!)
4. Add US3 (Task Warning) → Warning thresholds work
5. Add US4 (Fixed Alert) → Fixed task alerts work
6. Add US5 (Sound) → Audio alerts work
7. Add US6 (Vibration) → Mobile vibration works
8. Polish → Tests, docs, validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Theme must work with existing Tailwind CSS 4.x dark mode support
- Avoid over-engineering: no complex state machines, just reactive stores
