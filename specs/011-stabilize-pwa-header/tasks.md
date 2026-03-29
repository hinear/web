# Tasks: Stabilize PWA Mobile Header

**Input**: Design documents from `/specs/011-stabilize-pwa-header/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Include focused Vitest + Testing Library coverage because the constitution and implementation plan require test-first validation for shared header and notification behavior.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared verification and test scaffolding before touching product code

- [X] T001 Refresh the mobile PWA verification matrix with explicit in-scope screens in /Users/choiho/zerone/hinear/specs/011-stabilize-pwa-header/quickstart.md
- [X] T002 [P] Extend shared Notification, Service Worker, and viewport test stubs in /Users/choiho/zerone/hinear/src/test/setup.ts
- [X] T003 [P] Align safe-area acceptance notes with current implementation scope in /Users/choiho/zerone/hinear/specs/011-stabilize-pwa-header/contracts/mobile-header-behavior.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared safe-area and hit-target behavior that every user story depends on

**⚠️ CRITICAL**: No user story work should start before this phase is complete

- [X] T004 Implement shared top safe-area CSS variables, fallback spacing, and utility classes in /Users/choiho/zerone/hinear/src/app/globals.css
- [X] T005 [P] Hook the root app shell into shared safe-area layout behavior in /Users/choiho/zerone/hinear/src/app/layout.tsx
- [X] T006 [P] Harden shared mobile hit-target sizing and pointer behavior in /Users/choiho/zerone/hinear/src/components/molecules/HeaderAction/HeaderAction.tsx
- [X] T007 Add regression coverage for shared header action tappable areas in /Users/choiho/zerone/hinear/src/components/molecules/HeaderAction/HeaderAction.test.tsx

**Checkpoint**: Shared safe-area primitives and reusable header action behavior are ready for story work

---

## Phase 3: User Story 1 - Reach Top Header Actions Reliably (Priority: P1) 🎯 MVP

**Goal**: Make mobile top header actions visible, reachable, and tappable on first interaction across the primary project surfaces

**Independent Test**: Run the US1 screen-level integration tests for the mobile overview and workspace surfaces, then launch those surfaces in a PWA-like viewport and confirm the top header controls render below the blocked device area and respond on the first tap without dead zones.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Add safe-area and tap regression tests for the compact app bar in /Users/choiho/zerone/hinear/src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.test.tsx
- [X] T009 [P] [US1] Add mobile overview integration-style reachability tests for the overview surface in /Users/choiho/zerone/hinear/src/features/projects/overview/screens/project-overview-screen.test.tsx
- [X] T010 [P] [US1] Add mobile workspace integration-style reachability tests for the workspace surface in /Users/choiho/zerone/hinear/src/features/projects/workspace/screens/project-workspace-screen.test.tsx

### Implementation for User Story 1

- [X] T011 [US1] Apply safe-area-aware spacing and minimum tap targets in /Users/choiho/zerone/hinear/src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.tsx
- [X] T012 [US1] Apply compact mobile overlap fixes and top-action spacing in /Users/choiho/zerone/hinear/src/components/organisms/LinearDashboardHeader/LinearDashboardHeader.tsx
- [X] T013 [US1] Wire the project overview mobile header to shared top safe-area behavior in /Users/choiho/zerone/hinear/src/features/projects/overview/screens/project-overview-screen.tsx
- [X] T014 [US1] Wire the project workspace mobile container to shared top safe-area behavior in /Users/choiho/zerone/hinear/src/features/projects/workspace/screens/project-workspace-screen.tsx

**Checkpoint**: User Story 1 is complete when primary mobile project headers sit below the top safe zone and remain tappable on first interaction

---

## Phase 4: User Story 2 - Use Notification Entry Points Without Blocked Touch Targets (Priority: P2)

**Goal**: Keep notification entry points reachable and state-aware on mobile profile/settings flows

**Independent Test**: Run the US2 profile/settings integration test and then open the mobile profile/settings surface, interact with the notification entry point under `default`, `granted`, `denied`, and unsupported states, and confirm each state remains tappable and explains the next step without relying on broken top-header placement.

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] Add permission-state interaction coverage for the notification entry button in /Users/choiho/zerone/hinear/src/features/notifications/components/NotificationPermissionButton.test.tsx
- [X] T016 [P] [US2] Add mobile notification reachability coverage for the settings card in /Users/choiho/zerone/hinear/src/features/notifications/components/NotificationSettingsCard.test.tsx
- [X] T017 [P] [US2] Add profile/settings integration-style notification reachability coverage in /Users/choiho/zerone/hinear/src/features/auth/components/profile-settings-screen.test.tsx

### Implementation for User Story 2

- [X] T018 [US2] Replace alert-only permission handling with state-aware inline or toast feedback in /Users/choiho/zerone/hinear/src/features/notifications/components/NotificationPermissionButton.tsx
- [X] T019 [US2] Surface notification permission and subscription guidance inside the settings card in /Users/choiho/zerone/hinear/src/features/notifications/components/NotificationSettingsCard.tsx
- [X] T020 [US2] Keep the mobile profile notification entry visible and tappable above the fold in /Users/choiho/zerone/hinear/src/features/auth/components/profile-settings-screen.tsx

**Checkpoint**: User Story 2 is complete when notification entry points remain reachable and communicate the correct next step in every permission/support state

---

## Phase 5: User Story 3 - Keep the Top Layout Stable Across Mobile PWA Contexts (Priority: P3)

**Goal**: Prevent top-layout regressions when the mobile PWA is launched from the home screen, resumed, or rotated

**Independent Test**: Run the US3 regression tests for overview, workspace, and profile surfaces, then reopen and rotate the mobile PWA on those same surfaces and confirm top spacing, header alignment, and touch targets stay stable without clipping or overlap.

### Tests for User Story 3 ⚠️

- [X] T021 [P] [US3] Add resumed and rotated layout regression coverage for the overview surface in /Users/choiho/zerone/hinear/src/features/projects/overview/screens/project-overview-screen.test.tsx
- [X] T022 [P] [US3] Add resumed and rotated layout regression coverage for the workspace surface in /Users/choiho/zerone/hinear/src/features/projects/workspace/screens/project-workspace-screen.test.tsx
- [X] T023 [P] [US3] Add profile-route resume and rotation regression coverage in /Users/choiho/zerone/hinear/src/features/auth/components/profile-settings-screen.test.tsx

### Implementation for User Story 3

- [X] T024 [US3] Apply resume- and rotation-safe project shell spacing in /Users/choiho/zerone/hinear/src/app/projects/[projectId]/layout.tsx
- [X] T025 [US3] Normalize profile route top spacing for installed-mobile contexts in /Users/choiho/zerone/hinear/src/app/projects/profile/page.tsx
- [X] T026 [US3] Record launch, resume, and rotation validation steps for stabilized surfaces in /Users/choiho/zerone/hinear/specs/011-stabilize-pwa-header/quickstart.md

**Checkpoint**: User Story 3 is complete when launch/resume/rotation flows preserve the same safe top-header layout on all in-scope mobile surfaces

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize shared documentation and run full feature validation across all stories

- [X] T027 [P] Update the notification entry contract with final implemented state behavior in /Users/choiho/zerone/hinear/specs/011-stabilize-pwa-header/contracts/notification-entry-points.md
- [X] T028 Run `npm test` and `npm run lint`, then capture the verification results in /Users/choiho/zerone/hinear/specs/011-stabilize-pwa-header/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: No dependencies
- **Phase 2: Foundational**: Depends on Phase 1 and blocks all story work
- **Phase 3: US1**: Depends on Phase 2 and is the MVP slice
- **Phase 4: US2**: Depends on Phase 2; can follow US1 or run in parallel after the foundation is stable
- **Phase 5: US3**: Depends on Phase 2 and should land after shared safe-area behavior is proven on US1 surfaces
- **Phase 6: Polish**: Depends on all targeted stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories after foundational work
- **US2 (P2)**: No dependency on US1 business logic, but benefits from shared safe-area primitives completed in Phase 2
- **US3 (P3)**: Builds on the same shared safe-area primitives and validates runtime stability after US1/US2 surface changes

### Within Each User Story

- Write tests first and confirm they fail before changing implementation files
- Update shared components before screen-level wiring
- Complete screen integration before moving to runtime verification/documentation

## Parallel Opportunities

- **Setup**: T002 and T003 can run in parallel
- **Foundational**: T005 and T006 can run in parallel once T004 is defined
- **US1**: T008, T009, and T010 can run in parallel; T013 and T014 can run in parallel after T011 and T012
- **US2**: T015, T016, and T017 can run in parallel; T018 and T019 can proceed independently before T020
- **US3**: T021, T022, and T023 can run in parallel; T024 and T025 can run in parallel before T026
- **Polish**: T027 can run before or alongside T028

## Parallel Example: User Story 1

```bash
# Write the US1 regression tests together:
Task: "Add safe-area and tap regression tests for the compact app bar in /Users/choiho/zerone/hinear/src/components/molecules/MobileIssueListAppBar/MobileIssueListAppBar.test.tsx"
Task: "Add mobile header reachability tests for the overview surface in /Users/choiho/zerone/hinear/src/features/projects/overview/screens/project-overview-screen.test.tsx"
Task: "Add mobile header reachability tests for the workspace surface in /Users/choiho/zerone/hinear/src/features/projects/workspace/screens/project-workspace-screen.test.tsx"

# Then wire the two project screens in parallel:
Task: "Wire the project overview mobile header to shared top safe-area behavior in /Users/choiho/zerone/hinear/src/features/projects/overview/screens/project-overview-screen.tsx"
Task: "Wire the project workspace mobile container to shared top safe-area behavior in /Users/choiho/zerone/hinear/src/features/projects/workspace/screens/project-workspace-screen.tsx"
```

## Parallel Example: User Story 2

```bash
# Write notification state tests together:
Task: "Add permission-state interaction coverage for the notification entry button in /Users/choiho/zerone/hinear/src/features/notifications/components/NotificationPermissionButton.test.tsx"
Task: "Add mobile notification reachability coverage for the settings card in /Users/choiho/zerone/hinear/src/features/notifications/components/NotificationSettingsCard.test.tsx"
Task: "Add profile-level notification reachability coverage in /Users/choiho/zerone/hinear/src/features/auth/components/profile-settings-screen.test.tsx"
```

## Parallel Example: User Story 3

```bash
# Validate runtime-stability regressions together:
Task: "Add resumed and rotated layout regression coverage for the overview surface in /Users/choiho/zerone/hinear/src/features/projects/overview/screens/project-overview-screen.test.tsx"
Task: "Add resumed and rotated layout regression coverage for the workspace surface in /Users/choiho/zerone/hinear/src/features/projects/workspace/screens/project-workspace-screen.test.tsx"
Task: "Add profile-route resume and rotation regression coverage in /Users/choiho/zerone/hinear/src/features/auth/components/profile-settings-screen.test.tsx"

# Apply final route-level stabilization in parallel:
Task: "Apply resume- and rotation-safe project shell spacing in /Users/choiho/zerone/hinear/src/app/projects/[projectId]/layout.tsx"
Task: "Normalize profile route top spacing for installed-mobile contexts in /Users/choiho/zerone/hinear/src/app/projects/profile/page.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (US1)
3. Validate mobile overview/workspace header accessibility independently
4. Stop and review before adding notification-state work

### Incremental Delivery

1. Deliver shared safe-area foundation
2. Deliver US1 mobile top-header tappability
3. Deliver US2 notification-entry reliability
4. Deliver US3 launch/resume/rotation stability
5. Finish with full verification and contract/document updates

### Suggested MVP Scope

- **MVP**: Phase 1, Phase 2, and Phase 3 (US1) only
- **Next Increment**: Add Phase 4 (US2) for notification-state reliability
- **Final Increment**: Add Phase 5 and Phase 6 for runtime hardening and release validation

## Notes

- Total tasks: 28
- User story task counts: **US1 = 7**, **US2 = 6**, **US3 = 6**
- All tasks follow the required checklist format with Task ID, optional `[P]`, required story label for story phases, and exact file paths
- Prefer landing foundational safe-area primitives before editing multiple mobile surfaces
