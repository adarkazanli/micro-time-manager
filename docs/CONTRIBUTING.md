# Contributing to Micro Time Manager

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Constitution Compliance](#constitution-compliance)

## Development Setup

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/adarkazanli/micro-time-manager.git
cd micro-time-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run svelte-check for type errors |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run test suite |
| `npm run test:unit` | Run unit tests only |
| `npm run test:e2e` | Run end-to-end tests |

## Project Structure

```
src/
├── lib/
│   ├── components/    # Reusable Svelte components
│   │   ├── Timer/     # Timer-related components
│   │   ├── Schedule/  # Schedule view components
│   │   ├── Notes/     # Notes panel components
│   │   └── common/    # Shared UI components
│   ├── stores/        # Svelte stores for shared state
│   │   ├── timer.ts   # Timer state management
│   │   ├── tasks.ts   # Task list management
│   │   └── settings.ts# User preferences
│   ├── services/      # Business logic modules
│   │   ├── storage.ts # localStorage wrapper
│   │   ├── parser.ts  # Excel/CSV file parsing
│   │   ├── exporter.ts# Data export generation
│   │   └── timer.ts   # Timer logic with drift correction
│   └── utils/         # Pure utility functions
│       ├── time.ts    # Time formatting helpers
│       └── validation.ts # Input validation
├── routes/            # SvelteKit routes or App.svelte
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
├── images/            # Visual assets
└── decisions/         # Architecture Decision Records
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Follow Test-First Development

Per the project constitution, tests MUST be written before implementation:

```bash
# 1. Write failing tests first
npm run test:unit -- --watch

# 2. Implement minimal code to pass tests

# 3. Refactor while keeping tests green
```

### 3. Verify Quality Gates

Before committing, ensure all checks pass:

```bash
# Type checking
npm run check

# Linting
npm run lint

# Tests
npm run test

# Format code
npm run format
```

### 4. Commit Changes

Follow conventional commit format:

```bash
git commit -m "feat: add timer pause functionality"
git commit -m "fix: correct drift calculation in background tabs"
git commit -m "docs: update API reference for timer store"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

## Code Style

### TypeScript

- Enable strict mode in `tsconfig.json`
- Use explicit return types for exported functions
- Prefer interfaces over type aliases for object shapes

```typescript
// Good
export function formatDuration(seconds: number): string {
  // ...
}

// Avoid
export const formatDuration = (seconds) => {
  // ...
}
```

### Svelte Components

- Document props at the top of each component
- Use TypeScript or JSDoc for prop types
- Keep components focused on a single responsibility

```svelte
<script lang="ts">
  /**
   * TimerDisplay - Shows countdown timer with overrun detection
   * @prop {number} remainingSeconds - Seconds remaining (negative = overrun)
   * @prop {boolean} isRunning - Whether timer is actively counting
   */
  export let remainingSeconds: number;
  export let isRunning: boolean = false;
</script>
```

### Svelte Stores

- Document store shape and available actions
- Use Svelte 5 runes syntax for reactivity

```typescript
/**
 * Timer Store
 *
 * Shape:
 * - remainingSeconds: number (negative = overrun)
 * - isRunning: boolean
 * - isPaused: boolean
 *
 * Actions:
 * - start(): void - Begin countdown
 * - pause(): void - Pause countdown
 * - resume(): void - Resume from pause
 * - reset(): void - Reset to initial state
 */
```

### CSS / Tailwind

- Use Tailwind utility classes as primary styling method
- Custom CSS only when utilities are insufficient
- Group related utilities with comments for complex components

```svelte
<!-- Timer display with responsive sizing -->
<div class="
  text-4xl md:text-6xl lg:text-8xl
  font-mono tabular-nums
  text-center
">
  {formattedTime}
</div>
```

## Testing

### Unit Tests

Test stores and services in isolation:

```typescript
// tests/unit/stores/timer.test.ts
import { describe, it, expect } from 'vitest';
import { createTimerStore } from '$lib/stores/timer';

describe('Timer Store', () => {
  it('should decrement remaining time each tick', () => {
    const store = createTimerStore(60);
    store.tick();
    expect(store.remainingSeconds).toBe(59);
  });
});
```

### Component Tests

Test user interactions with Svelte Testing Library:

```typescript
// tests/component/TimerDisplay.test.ts
import { render, screen } from '@testing-library/svelte';
import TimerDisplay from '$lib/components/TimerDisplay.svelte';

describe('TimerDisplay', () => {
  it('shows negative time when overrun', () => {
    render(TimerDisplay, { props: { remainingSeconds: -125 } });
    expect(screen.getByText('-02:05')).toBeInTheDocument();
  });
});
```

### E2E Tests

Test complete user flows with Playwright:

```typescript
// tests/e2e/import-schedule.test.ts
import { test, expect } from '@playwright/test';

test('user can import schedule from Excel file', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('input[type="file"]', 'fixtures/sample-schedule.xlsx');
  await expect(page.getByText('Schedule Preview')).toBeVisible();
});
```

## Pull Request Process

### 1. Pre-PR Checklist

- [ ] All tests pass (`npm run test`)
- [ ] No type errors (`npm run check`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Documentation updated for user-facing changes
- [ ] Constitution compliance verified

### 2. PR Description Template

```markdown
## Summary
[Brief description of changes]

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Constitution Compliance
- [ ] Component-First: New components are self-contained
- [ ] Offline-First: No network dependencies added
- [ ] Performance: Timer logic uses performance.now()
- [ ] Test-First: Tests written before implementation
- [ ] Simplicity: No unnecessary abstractions
- [ ] Documentation: Relevant docs updated

## Test Plan
[How to test these changes]

## Screenshots (if applicable)
```

### 3. Review Process

- At least one approval required
- All CI checks must pass
- Documentation must be updated for feature PRs

## Constitution Compliance

All contributions must adhere to the [Project Constitution](.specify/memory/constitution.md). Key principles:

1. **Component-First**: UI as self-contained Svelte components
2. **Offline-First**: No network dependencies for core features
3. **Performance-Critical Timers**: Use `performance.now()` for timing
4. **Test-First Development**: TDD is mandatory
5. **Simplicity & YAGNI**: Keep it simple, <50KB bundle target
6. **Comprehensive Documentation**: Document all public APIs

### Complexity Tracking

If your PR introduces complexity that deviates from the constitution, document it:

| Violation | Why Needed | Alternative Rejected |
|-----------|------------|---------------------|
| [Pattern/Library] | [Specific need] | [Why simpler approach fails] |

---

## Questions?

Open an issue for questions about contributing or the codebase.

---

**Last Updated**: 2025-12-17
