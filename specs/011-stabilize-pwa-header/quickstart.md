# Quickstart: Stabilize PWA Mobile Header

## Goal

Implement and verify a mobile PWA header stabilization pass that:

- keeps top header content outside device control areas,
- preserves tappable mobile header actions,
- keeps notification entry points reachable and state-aware.

## Recommended Implementation Order

1. Update shared top-level layout primitives so mobile surfaces can consume a common top safe-area rule.
2. Adjust shared mobile header surfaces and reusable header actions to keep visible position and touch region aligned.
3. Harden notification entry points so supported, denied, and unsupported states all produce reachable, understandable outcomes.
4. Add focused test coverage for shared components and feature-level notification state behavior.
5. Run manual mobile PWA verification across launch, resume, and rotation scenarios.

## In-Scope Mobile Surfaces

- Project workspace board surface in `src/features/projects/workspace/screens/project-workspace-screen.tsx`
- Project overview surface in `src/features/projects/overview/screens/project-overview-screen.tsx`
- Mobile issue board app bar in `src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.tsx`
- Mobile profile/settings surface in `src/features/auth/components/profile-settings-screen.tsx`

## Likely Code Touchpoints

```text
src/app/layout.tsx
src/app/globals.css
src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.tsx
src/components/molecules/HeaderAction/HeaderAction.tsx
src/components/organisms/LinearDashboardHeader/LinearDashboardHeader.tsx
src/features/auth/components/profile-settings-screen.tsx
src/features/notifications/components/NotificationPermissionButton.tsx
src/features/notifications/components/NotificationSettingsCard.tsx
```

## Implementation Checklist

### 1. Shared Safe-Area Behavior

- Confirm the root viewport configuration still supports edge-to-edge PWA rendering.
- Introduce or refine shared CSS variables/utilities for top safe-area spacing.
- Apply the safe-area rule at shared container/header boundaries rather than per-screen ad hoc padding.

### 2. Header Interaction Reliability

- Verify compact mobile app bars and shared header actions keep a minimum tappable target size.
- Ensure sticky or top-aligned containers do not create hidden dead zones above visible buttons.
- Check that visual alignment, z-index, and pointer interaction match after safe-area spacing is applied.

### 3. Notification Entry Reliability

- Keep notification controls visible and tappable regardless of permission state.
- Replace silent failure patterns with explicit inline/toast guidance where needed.
- Preserve explicit-user-action gating for any permission request.

### 4. Automated Verification

- Add/adjust component tests for shared mobile app bar and header action behavior.
- Add/adjust notification component tests covering `default`, `granted`, `denied`, and unsupported states.
- Run project checks:

```bash
npm test
npm run lint
```

## Manual Mobile PWA Verification Matrix

### Scenario A: Fresh installed launch

1. Install the app to the home screen on a mobile device or simulator.
2. Launch directly from the home screen.
3. Open each in-scope mobile screen with a top header.
4. Confirm the title and top controls sit below the device control area and all header actions tap successfully on the first attempt.

### Scenario B: App resume

1. Open an in-scope screen.
2. Background the app and return after several seconds.
3. Confirm the top header does not shift upward into the blocked area and controls remain tappable.

### Scenario C: Rotation

1. Open an in-scope screen with top actions.
2. Rotate the device to landscape, then back to portrait.
3. Confirm header layout reflows without overlap, clipping, or blocked taps.

### Surface-by-Surface Checks

1. `workspace`
   Confirm the compact app bar stays below the safe area after fresh launch, resume, and rotation.
2. `overview`
   Confirm the top profile/settings action and overview title stay tappable on first tap after fresh launch, resume, and rotation.
3. `profile/settings`
   Confirm the profile heading block and notification controls stay above the fold and tappable after fresh launch, resume, and rotation.

## Verification Results

- Date: 2026-03-30
- Automated checks:
  - `npm test`: pass (`90` files passed, `344` tests passed, `2` files skipped, `3` tests skipped)
  - `npm run lint`: pass
- Focused mobile regression coverage:
  - shared header action tap target coverage
  - compact mobile app bar safe-area coverage
  - overview, workspace, and profile/settings mobile integration-style safe-area coverage
  - notification permission-state and settings-card reachability coverage

### Scenario D: Notification states

1. Visit the notification entry surface on mobile.
2. Validate behavior in each state:
   - `default`: reachable enable/manage control with explicit next action
   - `granted`: reachable management/confirmation state
   - `denied`: reachable explanation and recovery guidance
   - unsupported: reachable explanation without broken interaction

## Exit Criteria

- No in-scope mobile header control is blocked by the top device area.
- Notification entry points remain tappable and understandable in all supported states.
- Automated checks pass and manual PWA matrix shows no overlap regression.
