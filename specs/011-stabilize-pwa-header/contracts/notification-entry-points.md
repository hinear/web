# UI Contract: Notification Entry Points

## Purpose

Define how notification-related entry points must behave on mobile PWA surfaces after stabilization.

## In-Scope Entry Points

- The notification permission control inside the mobile profile/settings surface
- The preference toggles and helper copy inside the mobile notification settings card
- Any mobile-visible control in that profile/settings flow that starts or explains the push-notification setup state

## Contract

### CN-001 Always Reachable

- Notification entry points MUST remain visible and tappable regardless of current permission state.
- Layout overlap with the mobile top safe zone MUST NOT make notification controls partially or fully unreachable.

### CN-002 State-Aware Outcome

- Tapping a notification entry point MUST produce a result consistent with the current state:
  - `default`: offer or begin the explicit permission/subscription flow
  - `granted`: confirm enabled status on the current device
  - `denied`: explain that permission is blocked and how the user can recover from browser or device settings
  - unsupported notification API: explain that the current environment does not support browser notifications
  - unsupported service worker: explain that notification setup cannot finish in the current environment

### CN-003 Explicit User Action

- Any permission prompt MUST originate from a direct user action.
- Resume, page load, or layout recalculation MUST NOT trigger a notification permission prompt automatically.

### CN-004 Clear Feedback

- Failed subscription attempts or unsupported conditions MUST not end silently.
- Users MUST receive inline helper copy and/or transient toast guidance that explains the current result and next step.

### CN-005 Mobile Consistency

- Notification entry behavior MUST remain understandable and reachable in:
  - installed PWA launch,
  - resumed app sessions,
  - orientation changes,
  - standard mobile browser mode.

## Acceptance Signals

- Users can always tap the notification control in mobile contexts.
- Each permission/support state maps to a consistent visible result.
- No notification-related control appears broken because of top-header overlap.
- The current implementation scope does not add a new top-header notification icon or navigation surface.
