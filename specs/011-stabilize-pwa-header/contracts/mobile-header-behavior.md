# UI Contract: Mobile Header Behavior

## Purpose

Define the shared behavior expected from all in-scope mobile top headers after PWA stabilization work.

## In-Scope Surfaces

- Mobile issue list / board headers
- Shared dashboard header in compact mobile presentation
- Mobile profile/settings top sections that expose actionable controls

## Scope Notes

- The current implementation slice covers the existing project workspace, project overview, and profile/settings mobile surfaces.
- New navigation patterns or new top-header notification icons are out of scope for this stabilization pass.

## Contract

### CH-001 Safe Placement

- Mobile top headers MUST render below the effective top safe zone in installed PWA and mobile browser contexts.
- Safe placement MUST be provided by shared layout behavior rather than one-off per-device exceptions.

### CH-002 Tappable Controls

- Any visible and enabled top-header action MUST have a reachable touch target that aligns with its visible location.
- A user’s first tap on a visible enabled control MUST trigger the intended action or a clear disabled explanation.

### CH-003 Stable Reflow

- Header layout MUST remain usable after:
  - initial mobile load,
  - home-screen PWA launch,
  - app resume from background,
  - orientation change.

### CH-004 No Hidden Dead Zones

- The area above or around the visible header MUST NOT capture pointer/touch events in a way that blocks access to header controls.
- Sticky/overlay behavior MUST NOT introduce invisible layers that prevent interaction.

### CH-005 Content Preservation

- Applying safe-area spacing MUST NOT hide the header title, primary navigation meaning, or critical top actions.

## Acceptance Signals

- Header controls are fully visible and tappable on the first try in all in-scope runtime contexts.
- No clipped titles or unreachable icons remain at the top edge.
- Shared mobile header components can document the same spacing and hit-target assumptions.
