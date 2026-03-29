# Research: Stabilize PWA Mobile Header

## Decision 1: Centralize top safe-area handling in shared layout surfaces

**Decision**: Apply top inset compensation through shared app-shell and header layout primitives using mobile-safe CSS environment values with a fallback baseline, instead of screen-by-screen device branching.

**Rationale**: The failure mode is cross-cutting: multiple mobile surfaces can render under the device status area or home-screen launch chrome. A shared layout strategy keeps behavior consistent and prevents future screens from reintroducing the same overlap bug. It also lets shared header components inherit the same top offset behavior rather than each feature inventing its own spacing.

**Alternatives considered**:

- Add hard-coded top padding per affected page.
  Rejected because it would drift across screens and fail on devices with different inset sizes.
- Detect specific mobile devices or browsers and branch layout logic.
  Rejected because device heuristics are brittle and hard to maintain for PWA launch contexts.
- Only increase button hit areas without moving the visual header.
  Rejected because overlap with system UI would still block user input in some launch states.

## Decision 2: Treat mobile header tappability as a shared interaction contract

**Decision**: Standardize mobile header controls around a minimum tappable area, consistent stacking order, and alignment between visible icon/button position and actual touch region.

**Rationale**: The reported problem is not only visual overlap but also “visible yet not tappable” behavior. Shared header primitives such as compact app bars and reusable header action buttons need a single contract for spacing, z-index, and target size so that safe-area offsets do not create dead zones or hidden touch targets.

**Alternatives considered**:

- Fix only the current notification button location.
  Rejected because the same interaction bug can recur on any compact top action.
- Move all actions into a separate drawer.
  Rejected because it changes product behavior and scope beyond stabilization.
- Add larger icons only.
  Rejected because icon size alone does not guarantee the real touch target is reachable.

## Decision 3: Keep notification entry points reachable in every permission state

**Decision**: Model notification entry points as always-reachable controls that present state-appropriate outcomes for `default`, `granted`, `denied`, and unsupported environments, while preserving user-initiated permission requests.

**Rationale**: In mobile PWA flows, notification controls are part of product trust. A user must be able to tap the control even when the environment cannot complete subscription or permission immediately. The outcome should explain what happened and what the user can do next, instead of appearing broken or disappearing behind the system header.

**Alternatives considered**:

- Hide notification controls until permission can be granted.
  Rejected because discoverability and troubleshooting become worse for users.
- Keep existing alert-only fallback behavior.
  Rejected because modal browser alerts do not adequately communicate state and feel broken in installed-app contexts.
- Retry permission requests automatically on load or resume.
  Rejected because it violates the constitution rule that permission prompts follow explicit user action.

## Decision 4: Verify with a hybrid automated + runtime matrix

**Decision**: Use focused component/integration tests for shared header and notification-state behavior, and supplement them with manual runtime checks on installable PWA launch, resume, and rotation scenarios.

**Rationale**: Automated tests can reliably cover rendered structure, disabled/enabled transitions, and state messaging, but safe-area overlap depends on runtime viewport behavior that is difficult to fully simulate in unit tests. A small manual matrix gives confidence without expanding scope into full end-to-end infrastructure.

**Alternatives considered**:

- Rely exclusively on unit tests.
  Rejected because they cannot fully represent installed mobile browser chrome and status-area behavior.
- Add a new end-to-end mobile test framework immediately.
  Rejected because it is disproportionate to the stabilization scope and would delay the fix.
- Validate only on one device type.
  Rejected because the bug is tied to device/browser-specific top inset differences.

## Decision 5: Scope the change to shared shell/header and notification-entry surfaces

**Decision**: Limit implementation to shared shell/layout surfaces, mobile header components, and notification entry points on mobile-critical screens; avoid redesigning navigation or unrelated desktop presentation.

**Rationale**: The reported issue is a usability regression, not a product-structure problem. Focusing on shared surfaces gives broad coverage while staying within the stability goal. This also aligns with the simplicity principle and reduces review risk.

**Alternatives considered**:

- Redesign the full mobile navigation hierarchy.
  Rejected because it expands scope well beyond stabilization.
- Rework notification delivery infrastructure.
  Rejected because the feature concerns entry-point reachability, not backend delivery.
- Restrict the fix to a single page.
  Rejected because shared mobile headers would continue to regress elsewhere.
