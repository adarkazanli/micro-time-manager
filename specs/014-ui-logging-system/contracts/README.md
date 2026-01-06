# Contracts: UI Logging System

**Feature**: 014-ui-logging-system
**Date**: 2026-01-03

## No External API Contracts

This feature is entirely local (client-side) with no external API dependencies.

All interfaces are internal TypeScript types defined in:
- `src/lib/types/index.ts` - LogEntry, LogAction types
- `src/lib/stores/logStore.svelte.ts` - Store interface
- `src/lib/services/logging.ts` - Service interface

See [data-model.md](../data-model.md) for the complete type definitions.

## Internal Interfaces

### logStore

```typescript
interface LogStore {
  // State (reactive via $state)
  entries: LogEntry[];          // All entries, newest first
  isLoaded: boolean;            // Whether loaded from storage

  // Actions
  log(action: LogAction, params?: Record<string, unknown>): void;
  loadFromStorage(): void;
  clearAll(): void;
  exportToJson(): string;
}
```

### logging service

```typescript
// Context-aware logging function
function logAction(
  action: LogAction,
  parameters?: Record<string, unknown>
): void;

// Captures current context automatically:
// - timestamp from Date.now()
// - taskId/taskName from sessionStore.currentTask
// - elapsedMs from timerStore.elapsedMs
// - sessionStatus from sessionStore.status
```

### storage service extensions

```typescript
// Added to existing storage service
function saveLogs(entries: LogEntry[]): boolean;
function loadLogs(): LogEntry[];
function clearLogs(): void;
```
