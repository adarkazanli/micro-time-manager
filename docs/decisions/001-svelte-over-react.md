# ADR-001: Svelte over React

**Status:** Accepted
**Date:** 2025-12-17
**Decision Makers:** Project Team

## Context

We need to select a frontend framework for the Micro Time Manager application. The app has these key requirements:

- **Offline-first**: Must work entirely in the browser with no network dependencies
- **Timer precision**: Countdown timer accuracy is critical for the core value proposition
- **Bundle size**: Fast initial load for a local tool
- **Responsive**: Mobile-first with desktop support
- **File I/O**: Excel import/export via SheetJS

The main candidates considered were:
1. **Svelte 5** with Vite
2. **React 18** with Vite
3. **Vanilla JavaScript**

## Decision

We will use **Svelte 5 with Vite** as our frontend framework.

## Rationale

### Bundle Size

| Framework | Baseline Bundle | Impact |
|-----------|-----------------|--------|
| Svelte 5 | ~2 KB runtime | Fastest load times |
| React 18 | ~40 KB runtime | Additional overhead |
| Vanilla JS | 0 KB | No framework overhead |

Svelte compiles components to vanilla JavaScript at build time, eliminating runtime overhead. For an offline-first tool where every kilobyte matters, this is a significant advantage.

### Timer Performance

Svelte's compilation model results in more efficient DOM updates:
- No virtual DOM diffing overhead
- Direct DOM manipulation from compiled output
- Better control over update batching

This is critical for our timer display, which updates every second and must remain accurate under load.

### Developer Experience

| Factor | Svelte | React |
|--------|--------|-------|
| Boilerplate | Minimal | useState/useEffect required |
| State management | Built-in stores | External library or Context |
| Learning curve | Gentle (HTML-like) | Moderate (JSX paradigm) |
| Reactivity | Automatic | Manual dependency arrays |

Svelte's simpler mental model means:
- Faster development velocity
- Fewer bugs from forgotten dependencies
- More intuitive code for contributors

### Svelte 5 Runes

Svelte 5 introduces runes (`$state`, `$derived`, `$effect`) which provide:
- More explicit reactivity when needed
- Better TypeScript integration
- Fine-grained control over updates

### Why Not React?

React was considered because of:
- Larger ecosystem and community
- More developers familiar with it
- Rich component libraries (shadcn/ui)

However, for this project:
- We don't need complex component libraries
- Bundle size directly impacts user experience
- Timer precision is paramount
- Simplicity is a core principle

### Why Not Vanilla JS?

Vanilla JS was considered for zero framework overhead, but:
- More boilerplate for reactive state
- Manual DOM management is error-prone
- Harder to maintain component structure
- No benefit over Svelte's compiled output

## Consequences

### Positive

- **Smaller bundles**: Meeting our <50KB target is easier
- **Better performance**: Direct DOM updates benefit timer accuracy
- **Simpler codebase**: Less boilerplate, more maintainable
- **Faster development**: Built-in reactivity and stores

### Negative

- **Smaller ecosystem**: Fewer third-party components available
- **Smaller talent pool**: Fewer developers know Svelte vs. React
- **Learning curve**: Team members may need to learn Svelte
- **Svelte 5 is new**: Runes syntax is different from Svelte 4

### Mitigations

- Build custom components rather than relying on ecosystem
- Document Svelte patterns thoroughly for contributors
- Use TypeScript for better tooling and onboarding
- Pin Svelte 5 version until stable

## Alternatives Considered

### React 18 + Vite

**Pros:**
- Larger ecosystem
- More developers familiar
- shadcn/ui for polished components

**Cons:**
- 40KB+ runtime overhead
- Virtual DOM adds latency
- More boilerplate code

**Rejected because:** Bundle size and timer precision are critical requirements that Svelte better addresses.

### Preact

**Pros:**
- React-compatible API
- ~3KB runtime
- Familiar to React developers

**Cons:**
- React compatibility layer adds complexity
- Less direct than Svelte's compilation model
- Smaller ecosystem than React

**Rejected because:** If moving away from React, Svelte offers more advantages with similar bundle size.

### Vanilla JavaScript

**Pros:**
- Zero framework overhead
- Maximum control
- No framework lock-in

**Cons:**
- Manual state management
- Manual DOM updates
- More code to maintain
- Higher bug potential

**Rejected because:** Development velocity and maintainability suffer without framework benefits that Svelte provides at minimal cost.

## References

- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Svelte vs React Performance](https://krausest.github.io/js-framework-benchmark/current.html)
- [Project Technology Stack](../../technology_stack.md)
- [Project Constitution](.specify/memory/constitution.md)

---

**Last Updated:** 2025-12-17
