# Quickstart: Settings Panel

**Feature**: 008-settings
**Date**: 2025-12-20

## Prerequisites

- Node.js 18+
- npm 9+
- Repository cloned and dependencies installed (`npm install`)
- On branch `008-settings`

## Development Setup

```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Type checking
npm run check
```

## Implementation Order

### Phase 1: Types & Store (Foundation)

1. **Add Settings type** to `src/lib/types/index.ts`
2. **Create settingsStore** at `src/lib/stores/settingsStore.svelte.ts`
3. **Add storage functions** to `src/lib/services/storage.ts`
4. **Write store tests** in `tests/unit/settingsStore.test.ts`

### Phase 2: Theme Service

1. **Create theme service** at `src/lib/services/theme.ts`
2. **Add dark mode CSS** to `src/app.css`
3. **Write theme tests** in `tests/unit/theme.test.ts`

### Phase 3: Settings Panel Component

1. **Create SettingsPanel** at `src/lib/components/SettingsPanel.svelte`
2. **Add settings icon** to `src/routes/+page.svelte`
3. **Wire up panel toggle** and settings interactions

### Phase 4: Integration & Polish

1. **Connect to timerStore** for warning thresholds
2. **Add sound/vibration** alert integration
3. **Write e2e tests** in `tests/e2e/settings.spec.ts`
4. **Update documentation** (USER_GUIDE.md, API.md, DATA_SCHEMA.md)

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/types/index.ts` | Settings and Theme types |
| `src/lib/stores/settingsStore.svelte.ts` | Settings state management |
| `src/lib/services/storage.ts` | localStorage persistence |
| `src/lib/services/theme.ts` | Theme application logic |
| `src/lib/components/SettingsPanel.svelte` | Slide-out settings UI |
| `src/app.css` | Dark mode CSS variables |

## Validation Checklist

### Store Tests Pass
```bash
npm run test:unit -- settingsStore
```

### Theme Tests Pass
```bash
npm run test:unit -- theme
```

### Full Test Suite
```bash
npm test
```

### Lint & Type Check
```bash
npm run lint && npm run check
```

### Build Succeeds
```bash
npm run build
```

## Manual Testing Checklist

- [ ] Settings icon visible in main interface
- [ ] Click icon opens slide-out panel from right
- [ ] Panel shows Theme section with Light/Dark/System options
- [ ] Selecting theme immediately changes UI colors
- [ ] Panel shows Alerts section with warning/fixed task inputs
- [ ] Adjusting thresholds updates values
- [ ] Sound toggle works (test with actual warning trigger)
- [ ] Vibration toggle works on mobile device
- [ ] Click outside panel closes it
- [ ] Escape key closes panel
- [ ] Refresh page - settings persist
- [ ] Close browser, reopen - settings persist
- [ ] System theme changes reflected when "System" selected

## Common Issues

### Theme not applying
- Check that `dark` class is being added to `<html>` element
- Verify CSS variables are defined in `app.css`
- Ensure Tailwind `dark:` variants are used in components

### Settings not persisting
- Check localStorage in DevTools > Application > Local Storage
- Verify `tm_settings` key exists with correct structure
- Check for storage quota errors in console

### Vibration not working
- Only works on mobile devices with vibration hardware
- Check `navigator.vibrate` availability in console
- Ensure toggle is enabled in settings

## Dependencies

No new npm dependencies required. Uses:
- Svelte 5 runes (existing)
- Tailwind CSS 4.x dark mode (existing)
- localStorage (browser built-in)
- Navigator.vibrate API (browser built-in)
- HTML5 Audio (browser built-in)
