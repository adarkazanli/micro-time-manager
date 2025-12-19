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
- 007-data-export: Added TypeScript 5.x (strict mode) + Svelte 5.x, SheetJS (xlsx) - already installed, Tailwind CSS 4.x
- 006-analytics-dashboard: Added TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax), SvelteKit, Tailwind CSS 4.x
- 005-note-capture: Added TypeScript 5.x (strict mode) + Svelte 5.x (runes syntax), SvelteKit, Tailwind CSS 4.x


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
