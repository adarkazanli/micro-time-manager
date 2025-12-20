# Data Model: Settings Panel

**Feature**: 008-settings
**Date**: 2025-12-20

## Entities

### Settings

Primary entity storing all user preferences.

```typescript
/**
 * User preference settings.
 * Persisted to localStorage under 'tm_settings'.
 */
interface Settings {
  /** UI theme preference */
  theme: Theme;

  /** Seconds before task end to show warning (0 = disabled, max 1800) */
  warningThresholdSec: number;

  /** Minutes before fixed task to show alert (0 = disabled, max 30) */
  fixedTaskAlertMin: number;

  /** Whether to play audio alerts */
  soundEnabled: boolean;

  /** Whether to vibrate on alerts (mobile only) */
  vibrationEnabled: boolean;
}

/** Theme options */
type Theme = 'light' | 'dark' | 'system';
```

### SettingsStorage

Wrapper for localStorage with version for migrations.

```typescript
/**
 * Versioned storage wrapper for settings.
 * Enables future schema migrations.
 */
interface SettingsStorage {
  /** Schema version for migrations */
  version: 1;

  /** Settings data */
  data: Settings;
}
```

## Validation Rules

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| theme | Theme | One of: 'light', 'dark', 'system' | 'system' |
| warningThresholdSec | number | Integer, 0-1800 (0-30 min) | 300 (5 min) |
| fixedTaskAlertMin | number | Integer, 0-30 | 10 |
| soundEnabled | boolean | true/false | true |
| vibrationEnabled | boolean | true/false | true |

## State Transitions

### Theme

```
┌─────────┐     select 'light'     ┌─────────┐
│ system  │ ────────────────────── │  light  │
└────┬────┘                        └────┬────┘
     │                                  │
     │ select 'dark'                    │ select 'dark'
     ▼                                  ▼
┌─────────┐                        ┌─────────┐
│  dark   │ ◄───────────────────── │  dark   │
└─────────┘     select 'system'    └─────────┘
```

Theme transitions are immediate and bidirectional. Any theme can transition to any other theme.

### Settings Panel

```
┌──────────┐     click settings    ┌──────────┐
│  closed  │ ───────────────────── │   open   │
└────┬─────┘                       └────┬─────┘
     │                                  │
     │ click outside / Escape / close   │
     └──────────────────────────────────┘
```

## Relationships

```
┌──────────────┐
│   Settings   │
└──────┬───────┘
       │
       │ warningThresholdSec
       ▼
┌──────────────┐
│  TimerStore  │ (consumes threshold for color logic)
└──────────────┘

┌──────────────┐
│   Settings   │
└──────┬───────┘
       │
       │ fixedTaskAlertMin
       ▼
┌──────────────┐
│ SessionStore │ (consumes for fixed task alerts)
└──────────────┘

┌──────────────┐
│   Settings   │
└──────┬───────┘
       │
       │ theme
       ▼
┌──────────────┐
│  ThemeService│ (applies to DOM)
└──────────────┘
```

## localStorage Schema

**Key**: `tm_settings`

**Example Value**:
```json
{
  "version": 1,
  "data": {
    "theme": "dark",
    "warningThresholdSec": 180,
    "fixedTaskAlertMin": 15,
    "soundEnabled": true,
    "vibrationEnabled": false
  }
}
```

**Size Estimate**: ~150 bytes

## Defaults

```typescript
const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  warningThresholdSec: 300,    // 5 minutes
  fixedTaskAlertMin: 10,       // 10 minutes
  soundEnabled: true,
  vibrationEnabled: true
};
```

## Migration Path

### v1 (Current)
Initial schema. No migrations needed.

### Future Migrations
When schema changes:
1. Increment version
2. Add migration function to `src/lib/services/migrations.ts`
3. Storage service runs migrations on load
