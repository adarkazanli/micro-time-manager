# Quickstart: UI Logging System

**Feature**: 014-ui-logging-system
**Date**: 2026-01-03

## Overview

This guide provides step-by-step instructions to implement the UI logging system for debugging task-switching issues. The system captures all button presses and user actions with full context, persists logs to localStorage, and provides a log viewer accessible from Settings.

## Prerequisites

- Node.js 18+ and npm
- Existing micro-time-manager codebase with sessionStore, timerStore, and storage service
- Familiarity with Svelte 5 runes syntax

## Implementation Steps

### Step 1: Add Type Definitions

Add the following types to `src/lib/types/index.ts`:

```typescript
export type LogAction =
  | 'START_DAY'
  | 'COMPLETE_TASK'
  | 'START_TASK'
  | 'END_DAY'
  | 'INTERRUPT'
  | 'RESUME_INTERRUPT'
  | 'ADD_TASK'
  | 'REORDER_TASK'
  | 'EDIT_TASK'
  | 'UNCOMPLETE_TASK'
  | 'BACK_TO_IMPORT'
  | 'START_NEW_DAY';

export interface LogEntry {
  id: string;
  timestamp: string;
  action: LogAction;
  taskId: string | null;
  taskName: string | null;
  elapsedMs: number | null;
  sessionStatus: SessionStatus;
  parameters: Record<string, unknown>;
}

export interface LogStorage {
  version: number;
  entries: LogEntry[];
}

export const STORAGE_KEY_LOGS = 'tm_logs';
export const MAX_LOG_ENTRIES = 1000;
export const LOG_SCHEMA_VERSION = 1;
```

### Step 2: Extend Storage Service

Add log persistence methods to `src/lib/services/storage.ts`:

```typescript
import type { LogEntry, LogStorage } from '$lib/types';
import { STORAGE_KEY_LOGS, LOG_SCHEMA_VERSION, MAX_LOG_ENTRIES } from '$lib/types';

export function saveLogs(entries: LogEntry[]): boolean {
  try {
    const storage: LogStorage = {
      version: LOG_SCHEMA_VERSION,
      entries: entries.slice(-MAX_LOG_ENTRIES) // Keep newest entries
    };
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(storage));
    return true;
  } catch (e) {
    console.error('Failed to save logs:', e);
    return false;
  }
}

export function loadLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) return [];
    const storage: LogStorage = JSON.parse(raw);
    return storage.entries || [];
  } catch (e) {
    console.error('Failed to load logs:', e);
    return [];
  }
}

export function clearLogs(): void {
  localStorage.removeItem(STORAGE_KEY_LOGS);
}
```

### Step 3: Create Log Store

Create `src/lib/stores/logStore.svelte.ts`:

```typescript
import type { LogEntry, LogAction } from '$lib/types';
import { MAX_LOG_ENTRIES } from '$lib/types';
import { saveLogs, loadLogs, clearLogs } from '$lib/services/storage';

function createLogStore() {
  let entries = $state<LogEntry[]>([]);
  let isLoaded = $state(false);

  return {
    get entries() { return entries; },
    get isLoaded() { return isLoaded; },

    addEntry(entry: LogEntry) {
      entries = [entry, ...entries].slice(0, MAX_LOG_ENTRIES);
      saveLogs([...entries].reverse()); // Store oldest first
    },

    loadFromStorage() {
      const loaded = loadLogs();
      entries = [...loaded].reverse(); // Display newest first
      isLoaded = true;
    },

    clearAll() {
      entries = [];
      clearLogs();
    },

    exportToCsv(): string {
      const headers = ['timestamp', 'action', 'taskId', 'taskName', 'elapsedMs', 'sessionStatus', 'parameters'];
      const rows = entries.map(e => [
        e.timestamp,
        e.action,
        e.taskId ?? '',
        e.taskName ?? '',
        e.elapsedMs?.toString() ?? '',
        e.sessionStatus,
        JSON.stringify(e.parameters)
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
  };
}

export const logStore = createLogStore();
```

### Step 4: Create Logging Service

Create `src/lib/services/logging.ts`:

```typescript
import type { LogAction, LogEntry } from '$lib/types';
import { logStore } from '$lib/stores/logStore.svelte';
import { sessionStore } from '$lib/stores/sessionStore.svelte';
import { timerStore } from '$lib/stores/timerStore.svelte';

export function logAction(
  action: LogAction,
  parameters: Record<string, unknown> = {}
): void {
  const currentTask = sessionStore.currentTask;

  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    taskId: currentTask?.taskId ?? null,
    taskName: currentTask?.taskName ?? null,
    elapsedMs: timerStore.elapsedMs ?? null,
    sessionStatus: sessionStore.status,
    parameters
  };

  logStore.addEntry(entry);
}
```

### Step 5: Add Logging to UI Handlers

In `src/routes/+page.svelte`, import and call `logAction` for each button handler:

```typescript
import { logAction } from '$lib/services/logging';

// Example: Start Day handler
function handleStartDay() {
  logAction('START_DAY');
  sessionStore.startSession();
}

// Example: Complete Task handler
function handleCompleteTask() {
  logAction('COMPLETE_TASK', {
    taskId: sessionStore.currentTask?.taskId,
    elapsedMs: timerStore.elapsedMs
  });
  sessionStore.completeCurrentTask(timerStore.elapsedMs);
}
```

### Step 6: Create LogViewer Component

Create `src/lib/components/LogViewer.svelte`:

```svelte
<script lang="ts">
  import { logStore } from '$lib/stores/logStore.svelte';
  import { onMount } from 'svelte';

  let { onClose }: { onClose: () => void } = $props();

  onMount(() => {
    if (!logStore.isLoaded) {
      logStore.loadFromStorage();
    }
  });

  function handleExport() {
    const csv = logStore.exportToCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    if (confirm('Clear all logs? This cannot be undone.')) {
      logStore.clearAll();
    }
  }
</script>

<div class="log-viewer">
  <header>
    <h2>UI Logs</h2>
    <div class="actions">
      <button onclick={handleExport}>Export</button>
      <button onclick={handleClear}>Clear</button>
      <button onclick={onClose}>Close</button>
    </div>
  </header>

  <div class="entries">
    {#each logStore.entries as entry (entry.id)}
      <div class="entry">
        <span class="timestamp">{entry.timestamp}</span>
        <span class="action">{entry.action}</span>
        {#if entry.taskName}
          <span class="task">{entry.taskName}</span>
        {/if}
      </div>
    {/each}
  </div>
</div>
```

### Step 7: Add to Settings Panel

In the SettingsPanel component, add a "View Logs" button that opens the LogViewer as a modal.

## Testing

Run the test suite:

```bash
npm test
```

Key test scenarios:
1. Log entry creation with all required fields
2. Storage persistence across page refresh
3. 1000 entry limit enforcement
4. Export produces valid CSV with proper escaping
5. Clear removes all entries

## Verification

1. Open the app and perform several actions (start day, complete task, etc.)
2. Open Settings > View Logs
3. Verify entries appear with correct timestamps and context
4. Export logs and verify CSV opens in Excel with all columns
5. Clear logs and verify list is empty
