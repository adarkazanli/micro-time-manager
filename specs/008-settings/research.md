# Research: Settings Panel

**Feature**: 008-settings
**Date**: 2025-12-20

## Theme Implementation

### Decision: CSS Custom Properties with Tailwind Dark Mode

**Rationale**: Tailwind CSS 4.x supports dark mode via the `dark:` variant. Combined with CSS custom properties, this allows instant theme switching without page refresh. The `prefers-color-scheme` media query handles the "System" option automatically.

**Alternatives Considered**:
- CSS-in-JS (rejected: constitution prohibits, adds bundle size)
- Multiple CSS files (rejected: requires page refresh to switch)
- JavaScript-only styling (rejected: flash of unstyled content)

### Implementation Approach

1. Add `dark` class to `<html>` element for explicit light/dark selection
2. Use `prefers-color-scheme` media query when "System" is selected (remove `dark` class)
3. Define color variables in `app.css` with light/dark variants
4. Tailwind's `dark:` prefix handles component-level styling

### System Theme Detection

```typescript
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Listen for system changes
prefersDark.addEventListener('change', (e) => {
  if (settings.theme === 'system') {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
```

## Settings Persistence

### Decision: Single localStorage Key with JSON Object

**Rationale**: Consistent with existing storage patterns (`tm_session`, `tm_tasks`, etc.). Single key reduces storage operations and simplifies migration.

**Alternatives Considered**:
- Multiple keys per setting (rejected: more storage operations, harder to manage)
- IndexedDB (rejected: overkill for 5 simple settings, constitution favors localStorage)

### Storage Key

```typescript
const SETTINGS_KEY = 'tm_settings';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  warningThresholdSec: number;      // 0-1800 (0-30 min)
  fixedTaskAlertMin: number;        // 0-30
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
```

### Default Values

```typescript
const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  warningThresholdSec: 300,    // 5 minutes
  fixedTaskAlertMin: 10,
  soundEnabled: true,
  vibrationEnabled: true
};
```

## Sound Notifications

### Decision: HTML5 Audio with Web Audio API Fallback

**Rationale**: HTML5 Audio is widely supported and simple. Web Audio API provides fallback for edge cases. No external dependencies needed.

**Alternatives Considered**:
- Howler.js (rejected: adds ~10KB, constitution prefers built-ins)
- Web Audio API only (rejected: more complex for simple beep sounds)

### Capability Detection

```typescript
function canPlayAudio(): boolean {
  return typeof Audio !== 'undefined';
}
```

### Audio Asset

Use a short beep sound (~1KB) embedded as base64 or loaded from `/static/sounds/alert.mp3`.

## Vibration Notifications

### Decision: Navigator.vibrate API with Graceful Fallback

**Rationale**: Standard API available on mobile browsers. Silently fails on unsupported devices.

**Alternatives Considered**:
- None - this is the only standard approach

### Capability Detection

```typescript
function canVibrate(): boolean {
  return 'vibrate' in navigator;
}
```

### Usage

```typescript
if (settings.vibrationEnabled && canVibrate()) {
  navigator.vibrate(200); // 200ms vibration
}
```

## Slide-Out Panel Pattern

### Decision: Right-Anchored Panel with Overlay

**Rationale**: Matches clarification decision. Allows users to see main content while adjusting settings. Common UX pattern in productivity apps.

**Implementation Details**:
- Panel width: 320px (responsive: full width on mobile <640px)
- Animation: slide-in from right, 200ms ease-out
- Overlay: semi-transparent backdrop, click to close
- Focus trap: keyboard navigation stays within panel

### Accessibility

- Panel receives focus when opened
- Escape key closes panel
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

## Integration with Timer Store

### Decision: Settings Store Provides Thresholds, Timer Reads

**Rationale**: Loose coupling - settingsStore exposes reactive values, timerStore consumes them. No direct dependency between stores.

**Integration Points**:
- `warningThresholdSec`: Used by timerStore to determine when to show yellow/red colors
- `fixedTaskAlertMin`: Used by sessionStore to trigger fixed task alerts

### No Breaking Changes

Existing timer behavior remains default. Settings only override when explicitly configured.

## Schema Migration

### Decision: Version Field for Future Migrations

**Rationale**: Constitution requires explicit schema versioning. Settings schema is v1.

```typescript
interface SettingsStorage {
  version: 1;
  data: Settings;
}
```

### Migration Strategy

On load, check version and apply migrations if needed. For v1, just use defaults if no data exists.
