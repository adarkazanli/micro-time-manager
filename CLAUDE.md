# micro-time-manager Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-17

## Active Technologies
- TypeScript 5.x (strict mode) + SvelteKit, Tailwind CSS 4.x, existing stores (sessionStore, timerStore, importStore) (003-impact-panel)
- localStorage (existing `storage` service) (003-impact-panel)
- TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax), SvelteKit, Tailwind CSS 4.x (004-interruption-tracking)
- localStorage (via existing storage service wrapper) (005-note-capture)
- localStorage (existing `storage` service) - read-only for this feature (006-analytics-dashboard)
- TypeScript 5.x (strict mode) + Svelte 5.x, SheetJS (xlsx) - already installed, Tailwind CSS 4.x (007-data-export)
- localStorage (existing stores: sessionStore, interruptionStore, noteStore) (007-data-export)
- TypeScript 5.x (strict mode) + Svelte 5.x, SvelteKit, Tailwind CSS 4.x (008-settings)
- localStorage (existing `storage` service with `tm_settings` key) (008-settings)
- TypeScript 5.x (strict mode) + Svelte 5.x (runes), SvelteKit 2.x, Tailwind CSS 4.x, Vite 7.x (009-ad-hoc-tasks)
- localStorage (via existing `storage` service with schema v5) (009-ad-hoc-tasks)
- TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax) + SvelteKit 2.x, Tailwind CSS 4.x, existing stores (timerStore, sessionStore, interruptionStore) (010-timer-persistence)
- localStorage (via existing `storage` service) (010-timer-persistence)

- TypeScript 5.x (strict mode) + Svelte 5.x, Vite 6.x, SheetJS (xlsx), Tailwind CSS 4.x (001-schedule-import)

## Project Structure

```text
src/
├── lib/
│   ├── components/    # Svelte UI components
│   ├── stores/        # Svelte reactive stores
│   ├── services/      # Business logic (storage, parser, timer, projection)
│   ├── utils/         # Pure utility functions (time, duration)
│   ├── types/         # TypeScript type definitions
│   └── assets/        # Static assets
├── routes/            # SvelteKit page routes
└── app.css            # Global styles

tests/
├── unit/              # Store and service tests
├── component/         # Component tests
└── e2e/               # End-to-end tests (Playwright)

docs/                  # Project documentation
specs/                 # Feature specifications
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode): Follow standard conventions

## Recent Changes
- 010-timer-persistence: Added TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax) + SvelteKit 2.x, Tailwind CSS 4.x, existing stores (timerStore, sessionStore, interruptionStore)
- 009-ad-hoc-tasks: Added TypeScript 5.x (strict mode) + Svelte 5.x (runes), SvelteKit 2.x, Tailwind CSS 4.x, Vite 7.x
- 008-settings: Added TypeScript 5.x (strict mode) + Svelte 5.x, SvelteKit, Tailwind CSS 4.x


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
