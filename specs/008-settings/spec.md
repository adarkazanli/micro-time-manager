# Feature Specification: Settings Panel

**Feature Branch**: `008-settings`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Settings for theme, alerts, and user preferences"

## Clarifications

### Session 2025-12-20

- Q: What UI pattern should the settings panel use? → A: Slide-out panel (anchored to screen edge, semi-blocking)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Access Settings Panel (Priority: P1)

A user needs to access the settings panel from the main interface to view and modify their preferences. They click the settings icon and the settings panel opens, displaying all configurable options organized by category.

**Why this priority**: Foundation for all other settings functionality - users must be able to access settings first before any other preference can be changed.

**Independent Test**: From main screen, click settings icon, verify settings panel opens with all options visible and organized.

**Acceptance Scenarios**:

1. **Given** I am on any screen in the application, **When** I click the settings icon, **Then** the settings panel opens
2. **Given** the settings panel is open, **When** I click close or outside the panel, **Then** the settings panel closes and my changes are preserved
3. **Given** the settings panel is open, **When** I view it, **Then** I see all configurable options organized into Theme and Alerts sections

---

### User Story 2 - Change Application Theme (Priority: P1)

A user wants to switch between light and dark themes to reduce eye strain or match their system preferences. They open settings, select their preferred theme option, and the application immediately updates its appearance.

**Why this priority**: Theme preference is a fundamental accessibility feature that affects every interaction with the application. Users may find the default theme uncomfortable.

**Independent Test**: Navigate to settings, select "Dark" theme, verify all UI elements update to dark colors immediately.

**Acceptance Scenarios**:

1. **Given** I am in settings, **When** I select "Light" theme, **Then** the application displays with a light background and dark text throughout all screens
2. **Given** I am in settings, **When** I select "Dark" theme, **Then** the application displays with a dark background and light text throughout all screens
3. **Given** I am in settings, **When** I select "System" theme, **Then** the application matches my device's current theme preference
4. **Given** I have set a theme preference, **When** I close and reopen the application, **Then** my theme preference is preserved

---

### User Story 3 - Configure Task Warning Time (Priority: P1)

A user wants to customize when they receive warnings about tasks ending soon. They open settings, adjust the warning threshold, and receive alerts at their preferred time before task completion.

**Why this priority**: Core functionality that directly impacts the user's ability to manage their time effectively. Different users have different working styles and need different lead times for warnings.

**Independent Test**: Set task warning to 3 minutes, start a task, verify warning indicator appears exactly 3 minutes before task duration expires.

**Acceptance Scenarios**:

1. **Given** I am in settings, **When** I set task warning to 3 minutes, **Then** I receive visual warnings 3 minutes before each task ends
2. **Given** I am in settings, **When** I set task warning to 10 minutes, **Then** I receive visual warnings 10 minutes before each task ends
3. **Given** I have set a custom warning threshold, **When** I close and reopen the application, **Then** my warning threshold preference is preserved

---

### User Story 4 - Configure Fixed Task Alert Time (Priority: P2)

A user wants to control how far in advance they're alerted about upcoming fixed tasks (meetings, calls). They open settings, adjust the alert timing, and receive alerts at their preferred lead time.

**Why this priority**: Fixed tasks have external dependencies (other people, scheduled calls), so users need advance warning. However, this is secondary to task warnings which affect every task.

**Independent Test**: Set fixed task alert to 15 minutes, create a schedule with a fixed task, verify alert appears 15 minutes before the fixed task's start time.

**Acceptance Scenarios**:

1. **Given** I am in settings, **When** I set fixed task alert to 5 minutes, **Then** I receive alerts 5 minutes before each fixed task starts
2. **Given** I am in settings, **When** I set fixed task alert to 15 minutes, **Then** I receive alerts 15 minutes before each fixed task starts
3. **Given** I have set a custom fixed task alert, **When** I close and reopen the application, **Then** my alert preference is preserved

---

### User Story 5 - Toggle Sound Notifications (Priority: P2)

A user in a quiet environment wants to disable sound alerts to avoid disturbing others. They open settings, toggle sound off, and continue receiving visual alerts without audio.

**Why this priority**: Important for workplace etiquette and user preference, but visual alerts still provide the core functionality.

**Independent Test**: Disable sounds, trigger a warning, verify no audio plays but visual indicator appears.

**Acceptance Scenarios**:

1. **Given** sounds are enabled, **When** a task warning triggers, **Then** an audio alert plays along with the visual indicator
2. **Given** I disable sounds in settings, **When** a task warning triggers, **Then** only the visual indicator appears (no audio)
3. **Given** I have disabled sounds, **When** I close and reopen the application, **Then** sound remains disabled

---

### User Story 6 - Toggle Vibration Notifications (Priority: P3)

A mobile user wants to enable vibration alerts for notifications when in meetings or when audio isn't appropriate. They open settings, enable vibration, and receive haptic feedback for alerts.

**Why this priority**: Mobile-specific feature that enhances the experience but is not essential for desktop users or core functionality.

**Independent Test**: Enable vibration on a mobile device, trigger a warning, verify device vibrates.

**Acceptance Scenarios**:

1. **Given** vibration is enabled on a mobile device, **When** a task warning triggers, **Then** the device vibrates
2. **Given** I disable vibration in settings, **When** a task warning triggers, **Then** the device does not vibrate
3. **Given** the application is on a device without vibration support, **When** I view settings, **Then** the vibration option is hidden or shown as unavailable

---

### Edge Cases

- What happens when the user's system theme changes while "System" is selected? The application should update automatically to match.
- What happens if a warning threshold is set to 0 minutes? Warnings are effectively disabled (no warning before task end).
- What happens if localStorage is full when saving preferences? User should see an error message and current settings should not be lost.
- What happens on devices that don't support vibration? The vibration option should be hidden or disabled gracefully.
- What happens if browser doesn't support Web Audio API for sounds? Sound option should be hidden or disabled gracefully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a settings panel accessible via a settings icon in the main interface
- **FR-002**: System MUST organize settings into logical sections (Theme, Alerts)
- **FR-003**: System MUST allow users to select between Light, Dark, and System theme options
- **FR-004**: System MUST apply the selected theme immediately upon selection without page refresh
- **FR-005**: System MUST match the device's theme preference when "System" option is selected
- **FR-006**: System MUST allow users to configure task warning threshold between 0-30 minutes
- **FR-007**: System MUST allow users to configure fixed task alert threshold between 0-30 minutes
- **FR-008**: System MUST apply custom warning/alert thresholds to timer and alert behavior
- **FR-009**: System MUST allow users to enable/disable sound notifications via toggle
- **FR-010**: System MUST allow users to enable/disable vibration notifications via toggle (on supported devices)
- **FR-011**: System MUST detect and gracefully handle missing device capabilities (vibration, audio)
- **FR-012**: System MUST persist all settings preferences to local storage
- **FR-013**: System MUST restore saved preferences on application load
- **FR-014**: System MUST provide default values: System theme, 5-minute task warning, 10-minute fixed alert, sound on, vibration on
- **FR-015**: System MUST handle storage errors gracefully with user feedback

### Key Entities

- **Settings**: User preferences object containing theme, warningThresholdSec, fixedTaskAlertMin, soundEnabled, vibrationEnabled
- **Theme**: Enumeration of 'light', 'dark', or 'system'

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access settings and change any preference in under 5 seconds
- **SC-002**: Settings persist correctly across 100% of browser sessions (no data loss)
- **SC-003**: Theme changes apply to all UI elements instantly without page refresh
- **SC-004**: Alert timing matches user-configured thresholds within 1 second accuracy
- **SC-005**: Settings panel is accessible within 1 click from the main screen
- **SC-006**: All settings have visible current values when the panel opens

## Assumptions

- Default theme is "System" (matches device preference)
- Default task warning threshold is 5 minutes (300 seconds)
- Default fixed task alert threshold is 10 minutes
- Default sound is enabled (true)
- Default vibration is enabled (true) on supported devices
- Vibration support is detected via the Navigator.vibrate API availability
- Sound support is detected via Web Audio API or HTML5 Audio availability
- Settings are stored in localStorage under the key `tm_settings`
- The settings panel is a slide-out panel anchored to the right edge of the screen
- Users can close settings by clicking outside the panel or clicking a close button
- The slide-out panel allows users to see their current work context while adjusting preferences
