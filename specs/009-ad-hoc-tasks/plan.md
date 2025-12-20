# Implementation Plan: Ad-Hoc Task Creation

**Branch**: `009-ad-hoc-tasks` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-ad-hoc-tasks/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to create new tasks on-the-fly during an active day session. Ad-hoc tasks support both "fixed" (time-bound) and "flexible" types, integrate with existing schedule projections and risk indicators, and are tracked separately for analytics. Implementation extends the existing `ConfirmedTask` type with an `isAdHoc` flag and adds an AddTaskDialog component with keyboard shortcut support.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x (runes), SvelteKit 2.x, Tailwind CSS 4.x, Vite 6.x
**Storage**: localStorage (via existing `storage` service with schema v5)
**Testing**: Vitest (unit/component), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Single SvelteKit application (client-only, no SSR)
**Performance Goals**: Task creation in <15 seconds (SC-001), projections update within 1 second (SC-004)
**Constraints**: Offline-capable (localStorage only), bundle <50KB gzipped, no external APIs
**Scale/Scope**: Single user, <50 tasks per schedule

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. Component-First Architecture | ✅ | AddTaskDialog will be self-contained Svelte component; state flows through sessionStore |
| II. Offline-First & Local Storage | ✅ | Ad-hoc tasks persist to localStorage via existing storage service; no external APIs |
| III. Performance-Critical Timers | ✅ | No timer modifications; existing projection service handles updates |
| IV. Test-First Development | ✅ | Unit tests for store methods, component tests for dialog, e2e for flow |
| V. Simplicity & YAGNI | ✅ | Extends existing ConfirmedTask with single flag; no new abstractions |
| VI. Comprehensive Documentation | ✅ | Will update USER_GUIDE.md, API.md, DATA_SCHEMA.md per constitution |

**Technology Stack Compliance**:
- Framework: Svelte 5.x with runes ✅
- Build: Vite 7.x ✅
- Styling: Tailwind CSS 4.x utility classes ✅
- Storage: localStorage wrapper service ✅
- Language: TypeScript 5.x strict mode ✅

**Quality Gates**: npm run check, npm run lint, npm run test all must pass

## Project Structure

### Documentation (this feature)

```text
specs/009-ad-hoc-tasks/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/           # Svelte components
│   │   ├── AddTaskDialog.svelte     # NEW: Ad-hoc task creation dialog
│   │   ├── ImpactPanel.svelte       # MODIFY: Add Task button integration
│   │   ├── EditTaskDialog.svelte    # REFERENCE: Existing task edit pattern
│   │   └── ...
│   ├── stores/
│   │   └── sessionStore.svelte.ts   # MODIFY: Add addTask() method
│   ├── services/
│   │   ├── storage.ts               # MODIFY: Handle isAdHoc in task persistence
│   │   ├── export.ts                # MODIFY: Include isAdHoc in exports
│   │   └── projection.ts            # NO CHANGE: Already handles task ordering
│   ├── types/
│   │   └── index.ts                 # MODIFY: Add isAdHoc to ConfirmedTask
│   └── utils/
│       └── duration.ts              # REFERENCE: Duration parsing
└── routes/
    └── +page.svelte                 # MODIFY: Keyboard shortcut handler

tests/
├── unit/
│   └── sessionStore.test.ts         # NEW: addTask() tests
├── component/
│   └── AddTaskDialog.test.ts        # NEW: Dialog component tests
└── e2e/
    └── ad-hoc-tasks.spec.ts         # NEW: Full flow tests

docs/
├── USER_GUIDE.md                    # UPDATE: Add task creation instructions
├── API.md                           # UPDATE: Document addTask() method
└── DATA_SCHEMA.md                   # UPDATE: Document isAdHoc field
```

**Structure Decision**: Single SvelteKit application following existing project conventions. New component follows established patterns from EditTaskDialog.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
