# Implementation Plan: Stabilize PWA Mobile Header

**Branch**: `011-stabilize-pwa-header` | **Date**: 2026-03-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-stabilize-pwa-header/spec.md`

## Summary

Stabilize the mobile PWA top header so device safe areas no longer block touch interactions, and ensure notification-related entry points remain reachable and state-aware across installable PWA contexts. The implementation will centralize top safe-area handling in shared app shell/header surfaces, align visible and tappable hit areas for mobile header actions, and harden notification entry flows so permission state and unsupported-device states are communicated without breaking the mobile experience.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16.2.0 (App Router), React 19.2.4, Supabase, next-pwa, lucide-react, sonner  
**Storage**: Supabase PostgreSQL for notification preferences and push subscriptions; browser/PWA runtime state for viewport and permission status  
**Testing**: Vitest 4.1.0, Testing Library, targeted manual mobile PWA verification  
**Target Platform**: Installable web application/PWA for modern mobile browsers and iOS/Android home-screen launches  
**Project Type**: web-app  
**Performance Goals**: Top header actions remain tappable on first interaction; visual response for header taps within 100ms; no additional perceptible layout shift after initial render  
**Constraints**: Must preserve installable PWA behavior, must not regress desktop layouts, must request notification permission only from explicit user action, must respect existing feature-based structure  
**Scale/Scope**: 4-6 mobile-critical screens and 3-5 shared surfaces/components touching app layout, mobile headers, and notification entry points

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Evaluation

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Project-First | ✅ PASS | Work affects shared shell and project-facing screens without changing project boundaries or permissions. |
| II. Issue-Centric Design | ✅ PASS | Mobile issue board and issue-related top actions are primary beneficiaries of the header stabilization. |
| III. Domain-Driven Design | ✅ PASS | Changes stay within existing app shell, component, and notification boundaries rather than introducing cross-cutting shortcuts. |
| IV. Incremental Completeness | ✅ PASS | P1 safe-area stabilization delivers standalone value before notification-flow hardening and broader mobile regression coverage. |
| V. Test-Driven Development | ✅ PASS | Shared header and notification states can be covered with component tests plus manual mobile PWA validation for runtime-specific behavior. |
| VI. Security & Data Integrity | ✅ PASS | Notification state handling reuses current permission/subscription flows and does not weaken auth or data boundaries. |
| VII. Installable PWA | ✅ PASS | The feature directly improves installable PWA usability while preserving user-action-based permission prompts. |
| VIII. Simplicity (YAGNI) | ✅ PASS | Focus stays on shared safe-area/layout fixes and notification entry reliability, not a full navigation redesign. |

**Gate Result**: ✅ **PASS** - No constitutional violations identified before research.

### Post-Design Re-Check

*Completed after Phase 1 design - all artifacts reviewed*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Project-First | ✅ PASS | Design targets shared project-facing mobile shells without altering project or membership data contracts. |
| II. Issue-Centric Design | ✅ PASS | Contracts and quickstart explicitly prioritize issue board and issue-adjacent mobile surfaces. |
| III. Domain-Driven Design | ✅ PASS | Layout, shared molecules/organisms, and notification feature components retain clear ownership boundaries. |
| IV. Incremental Completeness | ✅ PASS | Safe-area shell fix, notification entry hardening, and regression verification can ship in slices without blocking one another. |
| V. Test-Driven Development | ✅ PASS | Plan defines focused component/integration tests and a manual PWA verification matrix before rollout. |
| VI. Security & Data Integrity | ✅ PASS | Permission guidance changes do not bypass existing subscription APIs or session-aware flows. |
| VII. Installable PWA | ✅ PASS | Research and contracts keep safe-area handling and permission UX aligned with installable PWA constraints. |
| VIII. Simplicity (YAGNI) | ✅ PASS | No new routing, state container, or custom runtime introduced; only existing shared surfaces are adjusted. |

**Gate Result**: ✅ **PASS** - No violations introduced during design.

## Project Structure

### Documentation (this feature)

```text
specs/011-stabilize-pwa-header/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── mobile-header-behavior.md
│   └── notification-entry-points.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                        # Global viewport/PWA metadata and shell entry
│   ├── globals.css                       # Global CSS tokens and safe-area capable layout primitives
│   ├── projects/
│   │   ├── overview/                     # Mobile overview surface
│   │   ├── [projectId]/                  # Project board/detail layouts that host mobile headers
│   │   └── profile/                      # Profile settings route that hosts notification entry points
│   └── settings/                         # Potential secondary settings surfaces
├── components/
│   ├── molecules/
│   │   ├── MobileIssueListAppBar/        # Mobile top app bar for issue lists
│   │   └── HeaderAction/                 # Shared actionable header controls
│   └── organisms/
│       └── LinearDashboardHeader/        # Shared dashboard header with mobile/compact states
├── features/
│   ├── auth/components/
│   │   └── profile-settings-screen.tsx   # Hosts notification settings entry on mobile
│   └── notifications/components/
│       ├── NotificationPermissionButton.tsx
│       └── NotificationSettingsCard.tsx
└── worker/
    └── index.js                          # Existing service worker / notification runtime

tests/
├── integration/                          # Existing or new mobile interaction coverage
└── unit/                                 # Shared component behavior tests
```

**Structure Decision**: Use the existing single-project Next.js web-app layout. Shared safe-area behavior belongs at the app shell and shared header component level; notification entry reliability belongs in the existing `features/notifications` and mobile profile/settings surfaces. The current notification scope is the existing profile/settings entry flow rather than a new top-header notification icon. No new package or app boundary is needed.

## Complexity Tracking

No constitutional violations. This section intentionally remains empty.

---

## Phase 0: Research

**Status**: ✅ Complete

### Research Tasks

1. **Mobile PWA safe-area handling**
   - Task: Determine how to apply top safe-area offsets without scattering device-specific logic across screens.
   - Deliverable: Shared safe-area strategy for global shell and mobile header surfaces.

2. **Header touch-target stability**
   - Task: Determine how to keep visible controls aligned with actual tappable regions in compact mobile headers.
   - Deliverable: Header action sizing/layering rules for shared components.

3. **Notification entry state handling**
   - Task: Determine how notification entry points should behave across granted, denied, default, and unsupported states in mobile PWA contexts.
   - Deliverable: State model and user feedback rules for notification entry points.

4. **Verification strategy**
   - Task: Determine the minimum automated and manual checks needed to prevent regressions across mobile PWA launch contexts.
   - Deliverable: Test matrix covering component behavior and device/runtime validation.

**Output**: ✅ [research.md](research.md) - All initial unknowns resolved with explicit decisions.

### Decisions Made

- Apply top safe-area compensation through shared shell/header layout surfaces with CSS environment variables and a fallback path rather than per-screen device checks.
- Normalize mobile header controls to minimum touch-target and stacking rules so visible buttons remain tappable after safe-area offsets.
- Treat notification entry as a stateful UI contract that stays reachable in all permission states and explains next steps without relying on blocking alerts alone.
- Validate with focused component tests plus manual installable PWA checks on iOS/Android launch, resume, and rotation scenarios.

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### 1.1 Data Model

**Status**: ✅ Complete

**Output**: ✅ [data-model.md](data-model.md) - UI state entities and validation rules for top safe-zone layout, header actions, and notification entry points.

### 1.2 Interface Contracts

**Status**: ✅ Complete

**Output**: ✅ `contracts/` directory with:
- ✅ [mobile-header-behavior.md](contracts/mobile-header-behavior.md)
- ✅ [notification-entry-points.md](contracts/notification-entry-points.md)

### 1.3 Quickstart Guide

**Status**: ✅ Complete

**Output**: ✅ [quickstart.md](quickstart.md) - Implementation and verification flow for safe-area and notification-entry stabilization.

### 1.4 Agent Context Update

**Status**: ✅ Complete

**Action**: ✅ Ran `.specify/scripts/bash/update-agent-context.sh codex` - updated `AGENTS.md` with the feature's TypeScript/Next.js/PWA context.

---

## Phase 2: Task Breakdown

**Status**: ✅ Complete via `/speckit.tasks`

**Note**: Task generation is executed by `/speckit.tasks`; the resulting task list is now available for implementation.

**Output**: ✅ [tasks.md](tasks.md) - Dependency-ordered implementation tasks grouped by user story

---

## Execution Notes

- Phase 0 and Phase 1 artifacts are complete and ready for implementation task generation.
- Manual mobile PWA verification remains essential because install context, browser chrome behavior, and rotation/resume flows are runtime-sensitive.
