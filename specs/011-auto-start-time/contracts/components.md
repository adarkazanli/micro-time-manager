# Component Contracts: Automatic Start Time Calculation

**Feature**: 011-auto-start-time
**Date**: 2025-12-26

---

## ScheduleStartPicker

**Path**: `src/lib/components/ScheduleStartPicker.svelte`

### Purpose

Allows users to configure the schedule start time with "Start Now" and custom time options.

### Props

```typescript
interface Props {
  /** Current schedule configuration (two-way bindable) */
  config: ScheduleConfig;

  /** Whether the picker is disabled (e.g., during active session) */
  disabled?: boolean;
}
```

### Events

```typescript
interface Events {
  /** Emitted when configuration changes */
  change: { config: ScheduleConfig };
}
```

### Visual Specification

```
┌─────────────────────────────────────────────────────┐
│ Schedule Start                                       │
│                                                     │
│  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ ● Start Now      │  │ ○ Custom Time          │  │
│  └──────────────────┘  └────────────────────────┘  │
│                                                     │
│  [Hidden when "Start Now" selected]                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Time: [ 09 ] : [ 30 ] [ AM ▼ ]              │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### States

| State | Description |
|-------|-------------|
| Default | "Start Now" selected, time picker hidden |
| Custom | Time picker visible, user can select time |
| Disabled | All inputs disabled, shown during active session |

### Accessibility

- Radio buttons for mode selection with proper labeling
- Time inputs with aria-label
- Keyboard navigation between options

---

## ScheduleOverflowWarning

**Path**: `src/lib/components/ScheduleOverflowWarning.svelte`

### Purpose

Displays a warning when the schedule extends past midnight.

### Props

```typescript
interface Props {
  /** End time of the schedule */
  scheduleEndTime: Date;

  /** Whether to show the warning */
  visible: boolean;
}
```

### Visual Specification

```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Schedule extends past midnight                   │
│ Tasks will continue until 1:30 AM tomorrow          │
└─────────────────────────────────────────────────────┘
```

### Styling

- Yellow/amber background color
- Warning icon
- Positioned at bottom of task list or inline with schedule

---

## FixedTaskIndicator

**Path**: `src/lib/components/FixedTaskIndicator.svelte`

### Purpose

Visual indicator (pin/lock icon) for fixed-time tasks.

### Props

```typescript
interface Props {
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg';

  /** Optional tooltip text */
  tooltip?: string;
}
```

### Visual Specification

```
Small:  📌 (16px)
Medium: 📌 (20px)
Large:  📌 (24px)
```

### Usage

Placed next to task name in:
- SchedulePreview
- ImpactPanel
- TaskRow

---

## ConflictWarning

**Path**: `src/lib/components/ConflictWarning.svelte`

### Purpose

Displays overlap warnings for conflicting fixed tasks.

### Props

```typescript
interface Props {
  /** The conflict to display */
  conflict: FixedTaskConflict;

  /** Whether the warning can be dismissed */
  dismissible?: boolean;
}
```

### Events

```typescript
interface Events {
  dismiss: void;
}
```

### Visual Specification

```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Time conflict                               [×]  │
│ "Meeting" overlaps with "Call" by 15 minutes       │
└─────────────────────────────────────────────────────┘
```

---

## Modified Components

### ImpactTaskRow

**Modifications**:

1. Add `FixedTaskIndicator` next to task name for fixed tasks
2. Display calculated start time instead of planned start
3. Show "remaining" badge for interrupted tasks

```
┌─────────────────────────────────────────────────────┐
│ 📌 9:00 AM  Meeting with Team               [1hr]   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│    8:30 AM  Deep Work           [2hr] ⏸️ 30m done  │
│             (continues at 10:00 AM, 1h 30m left)    │
└─────────────────────────────────────────────────────┘
```

### AddTaskDialog

**Modifications**:

1. Add toggle for "Fixed Time" option
2. Show time picker when "Fixed Time" is enabled
3. Hide start time picker for flexible tasks (auto-calculated)

```
┌─────────────────────────────────────────────────────┐
│ Add Task                                            │
│                                                     │
│ Name: [________________________]                    │
│                                                     │
│ Duration: [ 1 ] hours [ 30 ] minutes               │
│                                                     │
│ ☐ Fixed Time                                        │
│   [Hidden when unchecked]                           │
│   Start at: [ 09 ] : [ 30 ] [ AM ▼ ]               │
└─────────────────────────────────────────────────────┘
```

### SchedulePreview

**Modifications**:

1. Add `ScheduleStartPicker` at top
2. Display calculated start times for all tasks
3. Show `ScheduleOverflowWarning` when applicable
4. Show `ConflictWarning` for any fixed task conflicts

---

## Component Hierarchy

```
+page.svelte
├── ScheduleStartPicker
├── SchedulePreview
│   ├── FixedTaskIndicator (per fixed task)
│   ├── ConflictWarning (if conflicts)
│   └── ScheduleOverflowWarning (if overflow)
├── ImpactPanel
│   └── ImpactTaskRow
│       ├── FixedTaskIndicator (per fixed task)
│       └── InterruptionBadge (if interrupted)
└── AddTaskDialog
    └── TimePickerInput (for fixed tasks)
```

---

## Shared Subcomponents

### TimePickerInput

Reusable time input component for selecting hours/minutes.

```typescript
interface Props {
  /** The time value */
  value: Date;

  /** Minimum selectable time */
  min?: Date;

  /** Maximum selectable time */
  max?: Date;

  /** Whether the input is disabled */
  disabled?: boolean;
}

interface Events {
  change: { value: Date };
}
```

### InterruptionBadge

Small badge showing interruption status.

```typescript
interface Props {
  /** Duration worked before pause (seconds) */
  beforePauseSec: number;

  /** Duration remaining after pause (seconds) */
  remainingSec: number;
}
```

Visual: `⏸️ 30m done, 1h 30m left`
