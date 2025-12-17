<!--
  ==========================================================================
  SYNC IMPACT REPORT
  ==========================================================================
  Version Change: 1.0.0 → 1.1.0

  Modified Principles: None

  Added Sections:
    - VI. Comprehensive Documentation

  Removed Sections: None

  Templates Requiring Updates:
    - .specify/templates/plan-template.md ✅ No changes required (generic)
    - .specify/templates/spec-template.md ✅ No changes required (generic)
    - .specify/templates/tasks-template.md ✅ No changes required (generic)
    - .specify/templates/checklist-template.md ✅ No changes required (generic)
    - .specify/templates/agent-file-template.md ✅ No changes required (generic)

  Deferred TODOs: None

  Previous Sync Reports:
    - 1.0.0 (2025-12-17): Initial constitution with 5 core principles
  ==========================================================================
-->

# Micro Time Manager Constitution

## Core Principles

### I. Component-First Architecture

All UI functionality MUST be implemented as self-contained Svelte components.

- Components MUST be independently testable without requiring the full application context
- Each component MUST have a single, clear responsibility
- Component props MUST be explicitly typed using TypeScript or JSDoc annotations
- Shared state MUST flow through Svelte stores, never through prop drilling beyond one level
- Components MUST NOT directly access localStorage or external APIs; use dedicated service modules

**Rationale**: Svelte's compilation model rewards small, focused components with optimal bundle output. Loose coupling enables parallel development and simplifies testing.

### II. Offline-First & Local Storage

The application MUST function fully without network connectivity.

- All user data MUST be persisted to localStorage immediately upon modification
- The application MUST gracefully handle localStorage quota limits with user feedback
- File imports (Excel via SheetJS) MUST be processed entirely client-side
- No feature MAY depend on external API calls for core functionality
- Data serialization MUST use JSON with explicit schema versioning for future migrations

**Rationale**: This is a local browser tool. Users expect instant responsiveness and data persistence without accounts or cloud dependencies.

### III. Performance-Critical Timers

Timer accuracy MUST be maintained even under UI load.

- Timer logic MUST use `performance.now()` for elapsed time calculations, NOT `Date.now()` intervals
- Timer state updates MUST NOT trigger expensive re-renders; use derived stores or memoization
- Long-running timers MUST compensate for browser throttling in background tabs
- DOM updates for timer displays MUST be batched to 60fps maximum (requestAnimationFrame)
- Timer operations MUST NOT block the main thread; consider Web Workers for calculations if needed

**Rationale**: The core value proposition is precise time tracking. Accumulated drift from naive setInterval implementations is unacceptable.

### IV. Test-First Development

Tests MUST be written before implementation for non-trivial features.

- Unit tests MUST cover all Svelte store logic and service modules
- Component tests MUST verify user interactions using Svelte Testing Library or Playwright
- Tests MUST run in under 30 seconds for the full suite to encourage frequent execution
- Mocking localStorage and file APIs MUST be standardized across all test files
- Red-Green-Refactor cycle: failing test → minimal implementation → refactor

**Rationale**: A time management app handles critical user data. Regression bugs erode trust and are costly to debug in state-heavy UIs.

### V. Simplicity & YAGNI

Prefer the simplest solution that meets current requirements.

- MUST NOT add abstractions for hypothetical future needs
- MUST NOT introduce external dependencies when Svelte built-ins suffice (stores over Redux, etc.)
- Bundle size MUST remain under 50KB gzipped for core functionality
- Configuration complexity MUST be justified by measurable user benefit
- Three similar lines of code are preferable to a premature abstraction

**Rationale**: Svelte was chosen specifically for its lightweight output. Over-engineering negates this advantage and slows iteration.

### VI. Comprehensive Documentation

All features, APIs, and architectural decisions MUST be documented.

#### Documentation Hierarchy

| Document | Purpose | Location | Update Trigger |
|----------|---------|----------|----------------|
| **README.md** | Project overview, quick start, feature summary | Repository root | Major feature additions |
| **ARCHITECTURE.md** | System design, data flow, component relationships | `docs/` | Structural changes |
| **API.md** | Public interfaces, store contracts, service methods | `docs/` | Any API change |
| **USER_GUIDE.md** | End-user instructions, workflows, screenshots | `docs/` | UI/UX changes |
| **CHANGELOG.md** | Version history, breaking changes, migration notes | Repository root | Every release |
| **DATA_SCHEMA.md** | localStorage structure, Excel format specs, versioning | `docs/` | Data model changes |

#### Documentation Requirements

**Code-Level Documentation**:
- All exported functions MUST have JSDoc/TSDoc comments with `@param`, `@returns`, and `@example`
- All Svelte components MUST document their props interface at the top of the file
- All Svelte stores MUST document their shape, actions, and subscription behavior
- Complex algorithms MUST include inline comments explaining the approach

**Feature Documentation**:
- Every new feature MUST update the USER_GUIDE.md before merge
- Every API change MUST update API.md with before/after examples
- Breaking changes MUST include migration instructions in CHANGELOG.md

**Architectural Documentation**:
- Data flow diagrams MUST be maintained in ARCHITECTURE.md using Mermaid syntax
- Component hierarchy MUST be documented with dependency relationships
- Storage schema MUST include versioning strategy and migration procedures

#### Documentation Standards

- All documentation MUST be written in Markdown
- Code examples MUST be tested and runnable
- Screenshots MUST be updated when UI changes (store in `docs/images/`)
- Documentation MUST be reviewed as part of PR process
- Stale documentation MUST be treated as a bug

#### Required Documentation Structure

```text
docs/
├── ARCHITECTURE.md      # System design and data flow
├── API.md               # Public interfaces and contracts
├── USER_GUIDE.md        # End-user documentation
├── DATA_SCHEMA.md       # Storage and file format specs
├── CONTRIBUTING.md      # Development setup and guidelines
├── images/              # Screenshots and diagrams
│   ├── architecture/    # System diagrams
│   ├── ui/              # UI screenshots
│   └── workflows/       # User flow diagrams
└── decisions/           # Architecture Decision Records (ADRs)
    └── 001-svelte-over-react.md
```

#### Architecture Decision Records (ADRs)

Significant technical decisions MUST be documented as ADRs:

- **When to create**: Framework choices, library selections, architectural patterns, data model designs
- **Format**: Title, Status, Context, Decision, Consequences
- **Naming**: `NNN-short-title.md` (e.g., `001-svelte-over-react.md`)

**Rationale**: A time management application requires clear documentation for users to understand features and for developers to maintain the codebase. Comprehensive docs reduce onboarding time and prevent knowledge silos.

## Technology Stack Requirements

The following technologies are mandated for this project:

| Layer | Technology | Version | Constraint |
|-------|------------|---------|------------|
| Framework | Svelte | 5.x | MUST use runes syntax for reactivity |
| Build | Vite | 6.x | MUST support dev server HMR and optimized production builds |
| Styling | Tailwind CSS | 4.x | MUST use utility classes; custom CSS only when utilities insufficient |
| File I/O | SheetJS (xlsx) | latest | MUST handle .xlsx import/export client-side |
| Charts | Chart.js or Layercake | latest | MUST be tree-shakeable; import only required chart types |
| Storage | localStorage | N/A | MUST use a wrapper service with error handling |
| Language | TypeScript | 5.x | MUST enable strict mode; JSDoc acceptable for .svelte files |
| Docs | Mermaid | latest | MUST use for all diagrams in documentation |

**Prohibited Technologies**:
- Server-side rendering (SSR) - this is a client-only application
- External databases or backend APIs for core features
- CSS-in-JS libraries (styled-components, Emotion) - use Tailwind
- State management libraries (Redux, MobX) - use Svelte stores

## Development Workflow

### Code Review Requirements

- All changes MUST pass `npm run check` (svelte-check) with zero errors
- All changes MUST pass `npm run lint` with zero warnings
- All changes MUST pass `npm run test` before merge
- Bundle size impact MUST be documented for PRs adding dependencies
- Documentation updates MUST be included for user-facing changes

### Quality Gates

1. **Pre-commit**: Formatting (Prettier) and linting (ESLint) MUST pass
2. **Pre-push**: Full test suite MUST pass
3. **PR Review**: At least one approval required; constitution compliance verified
4. **Documentation Check**: Relevant docs updated for feature PRs

### File Organization

```text
src/
├── lib/
│   ├── components/    # Reusable Svelte components
│   ├── stores/        # Svelte stores for shared state
│   ├── services/      # Business logic (storage, file parsing, timers)
│   └── utils/         # Pure utility functions
├── routes/            # SvelteKit routes (if applicable) or App.svelte
└── app.css            # Tailwind directives and global styles

tests/
├── unit/              # Store and service tests
├── component/         # Svelte component tests
└── e2e/               # End-to-end tests (Playwright)

docs/
├── ARCHITECTURE.md    # System design documentation
├── API.md             # Public interface documentation
├── USER_GUIDE.md      # End-user documentation
├── DATA_SCHEMA.md     # Data structure documentation
├── CONTRIBUTING.md    # Developer onboarding
├── images/            # Visual assets for documentation
└── decisions/         # Architecture Decision Records
```

## Governance

This constitution supersedes all other development practices for this project.

### Amendment Procedure

1. Propose change via pull request modifying this file
2. Document rationale and impact assessment
3. Obtain approval from project maintainer(s)
4. Update dependent templates if principle changes affect workflows
5. Increment version according to semantic versioning

### Versioning Policy

- **MAJOR**: Removal or redefinition of core principles
- **MINOR**: Addition of new principles or significant guidance expansion
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance Review

- All PRs MUST include a constitution compliance statement
- Complexity deviations MUST be documented in plan.md Complexity Tracking section
- Documentation completeness MUST be verified for feature PRs
- Annual review of principles against project evolution

**Version**: 1.1.0 | **Ratified**: 2025-12-17 | **Last Amended**: 2025-12-17
