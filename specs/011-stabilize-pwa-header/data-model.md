# Data Model: Stabilize PWA Mobile Header

## 1. TopSafeZone

Represents the protected top region of the mobile viewport where app content must not collide with device UI.

### Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `context` | enum | Launch/render context such as browser tab, installed PWA, resumed app, rotated view | Required |
| `topInset` | number | Effective top spacing reserved before rendering interactive header content | Must be `>= 0` |
| `fallbackInset` | number | Minimum baseline spacing used when the runtime does not provide device-specific inset data | Must be `>= 0` |
| `applied` | boolean | Whether the current surface successfully applied safe-zone compensation | Required |
| `surfaceId` | string | Identifier for the screen or shared header surface using the safe zone | Required |

### Rules

- `topInset` must never be negative.
- `fallbackInset` must exist so the layout remains usable when device inset data is unavailable.
- A surface is considered valid only when `applied = true` before exposing top header actions for interaction.

## 2. HeaderActionTarget

Represents a top-header interaction element that must stay visually aligned and tappable on mobile.

### Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Stable identifier for a header action | Required |
| `surfaceId` | string | Owning header surface | Required |
| `label` | string | User-facing action label or accessible name | Required |
| `isVisible` | boolean | Whether the action is currently rendered | Required |
| `isEnabled` | boolean | Whether the action is intended to be interactive | Required |
| `hitAreaWidth` | number | Effective tappable width | Must meet mobile minimum target size |
| `hitAreaHeight` | number | Effective tappable height | Must meet mobile minimum target size |
| `isObscured` | boolean | Whether another layer or device UI blocks the touch target | Required |
| `actionResult` | enum | Expected result such as navigate, open, submit, or explain-state | Required |

### Rules

- Visible and enabled actions must not be obscured.
- Hit area dimensions must satisfy the shared mobile minimum touch target.
- `actionResult` must map to a real next state; no visible enabled header action may be a no-op.

## 3. NotificationEntryPoint

Represents a notification-related UI control or route entry that users rely on to manage push updates.

### Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Stable identifier for the notification entry point | Required |
| `location` | enum | Header, settings card, or other mobile-visible location | Required |
| `permissionState` | enum | `default`, `granted`, `denied`, `unsupported` | Required |
| `subscriptionState` | enum | `unknown`, `not-subscribed`, `subscribed`, `failed` | Required |
| `isReachable` | boolean | Whether the control is tappable and not blocked by layout overlap | Required |
| `nextAction` | enum | Prompt, explain, manage, or retry flow shown to the user | Required |
| `feedbackMode` | enum | Inline message, toast, disabled explanation, or settings guidance | Required |

### Rules

- Notification entry points must remain reachable in every permission state.
- `nextAction` must be compatible with `permissionState`; for example, a fresh permission prompt can only follow explicit user action.
- Unsupported or denied states must still yield explanatory feedback rather than silent failure.

## 4. MobileHeaderSurface

Represents a mobile screen section that owns a top header and composes safe-zone and action-target behavior.

### Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Stable identifier for the surface | Required |
| `screenType` | enum | Overview, board, issue detail, profile/settings, or similar | Required |
| `usesSafeZone` | boolean | Whether the surface consumes the shared top safe-zone contract | Required |
| `primaryActions` | HeaderActionTarget[] | Actions exposed in the top header | Required |
| `notificationEntryPoints` | NotificationEntryPoint[] | Notification-related controls owned by the surface | Optional |
| `supportsRotation` | boolean | Whether the surface must remain stable across orientation changes | Required |
| `resumeStable` | boolean | Whether the surface preserves alignment after app resume | Required |

### Rules

- Any `MobileHeaderSurface` with `primaryActions` must also declare `usesSafeZone = true`.
- A surface that includes notification controls must expose at least one reachable `NotificationEntryPoint`.
- Rotation and resume stability must be verified for every mobile-critical surface in scope.

## State Transitions

### NotificationEntryPoint

| From | Event | To |
|------|-------|----|
| `default` | User taps enable/manage control | `default` while prompt is shown, then `granted` or `denied` |
| `granted` | Subscription succeeds | `subscribed` |
| `granted` | Subscription fails | `failed` |
| `denied` | User revisits entry point | `denied` with explanation/guidance |
| `unsupported` | User taps entry point | `unsupported` with explanation/guidance |

### MobileHeaderSurface

| From | Event | To |
|------|-------|----|
| `initial render` | Safe-zone applied successfully | `interactive` |
| `interactive` | Rotation/resume changes viewport | `reflowing` |
| `reflowing` | Safe-zone and hit areas revalidated | `interactive` |

## Relationship Summary

- `MobileHeaderSurface` owns one `TopSafeZone`.
- `MobileHeaderSurface` exposes many `HeaderActionTarget`.
- `MobileHeaderSurface` may expose many `NotificationEntryPoint`.
- `NotificationEntryPoint` depends on notification permission/subscription runtime state, but remains a UI-level contract in this feature.
