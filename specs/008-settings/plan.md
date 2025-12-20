# Implementation Plan: Settings Panel

**Branch**: `008-settings` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-settings/spec.md`

## Summary

Implement a slide-out settings panel allowing users to configure theme (light/dark/system), alert timing thresholds, and notification preferences (sound/vibration). Settings persist to localStorage and apply immediately. Uses Svelte 5 runes, Tailwind CSS, and integrates with existing timerStore for warning thresholds.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5.x, SvelteKit, Tailwind CSS 4.x
**Storage**: localStorage (existing `storage` service with `tm_settings` key)
**Testing**: Vitest for unit tests, Playwright for e2e
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: SPA (SvelteKit)
**Performance Goals**: Instant theme application (<16ms), settings save <50ms
**Constraints**: Offline-capable, <50KB gzipped bundle impact, no external APIs
**Scale/Scope**: Single user, 5 settings fields, 1 new component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | SettingsPanel as self-contained component, props typed, uses stores |
| II. Offline-First & Local Storage | ✅ PASS | All data in localStorage, no API calls |
| III. Performance-Critical Timers | ✅ PASS | Thresholds passed to existing timer logic, no new timer code |
| IV. Test-First Development | ✅ PASS | Tests planned before implementation |
| V. Simplicity & YAGNI | ✅ PASS | No abstractions, uses Svelte stores, minimal dependencies |
| VI. Comprehensive Documentation | ✅ PASS | USER_GUIDE.md, API.md, DATA_SCHEMA.md updates planned |

**Gate Status**: PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/008-settings/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   └── SettingsPanel.svelte    # NEW: Slide-out settings panel
│   ├── stores/
│   │   └── settingsStore.svelte.ts # NEW: Settings state management
│   ├── services/
│   │   ├── storage.ts              # MODIFY: Add settings persistence
│   │   └── theme.ts                # NEW: Theme application logic
│   └── types/
│       └── index.ts                # MODIFY: Add Settings type
├── routes/
│   └── +page.svelte                # MODIFY: Add settings icon trigger
└── app.css                         # MODIFY: Add dark theme variables

tests/
├── unit/
│   ├── settingsStore.test.ts       # NEW: Store tests
│   └── theme.test.ts               # NEW: Theme service tests
└── e2e/
    └── settings.spec.ts            # NEW: Settings flow tests
```

**Structure Decision**: Single SPA following existing SvelteKit structure. New files integrate with existing component/store/service patterns.

## Complexity Tracking

> No violations - table not needed.
