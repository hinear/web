# Tasks: GitHub CI/CD Audit and Rationalization

**Input**: Design documents from `/specs/008-github-cicd-audit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/github-workflow-governance.md, quickstart.md

**Tests**: Validation is required through existing repository commands and workflow checks. No new automated test suite is mandated by the spec.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Capture the current repository CI/CD baseline and prepare feature artifacts for implementation

- [ ] T001 Record the current GitHub Actions inventory and baseline commands in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/research.md`
- [ ] T002 [P] Review the current required/optional workflow descriptions in `/home/choiho/zerone/hinear/README.md`
- [ ] T003 [P] Review MCP smoke job setup notes in `/home/choiho/zerone/hinear/docs/hinear-mcp-implementation.md`
- [ ] T004 [P] Review performance workflow documentation references in `/home/choiho/zerone/hinear/docs/performance-optimizations.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the audit contract and branch-protection-safe decision framework that all user stories depend on

**⚠️ CRITICAL**: No user story work should begin until this phase is complete

- [ ] T005 Consolidate the workflow inventory, guardrail policy, and decision record definitions in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/data-model.md`
- [ ] T006 Define required-vs-optional workflow governance and retirement rules in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/contracts/github-workflow-governance.md`
- [ ] T007 Map branch-protection expectations, validation commands, and rollout checkpoints in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/quickstart.md`

**Checkpoint**: Governance baseline is fixed and user story work can proceed safely

---

## Phase 3: User Story 1 - Remove or replace low-value workflows safely (Priority: P1) 🎯 MVP

**Goal**: Audit existing workflows and remove or replace low-signal placeholder automation without losing required CI coverage

**Independent Test**: From the final workflow files and audit notes alone, a maintainer can identify which workflows were kept, removed, merged, or replaced, and required PR verification still maps to real checks.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Audit `.github/workflows/ci.yml` and capture its keep/adjust decision in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/research.md`
- [ ] T009 [P] [US1] Audit `.github/workflows/performance.yml` and capture its remove/replace decision in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/research.md`
- [ ] T010 [US1] Refine the required baseline verification workflow in `/home/choiho/zerone/hinear/.github/workflows/ci.yml` so it remains the canonical PR guardrail
- [ ] T011 [US1] Remove placeholder-only steps or retire the obsolete workflow in `/home/choiho/zerone/hinear/.github/workflows/performance.yml`
- [ ] T012 [US1] Align CI/CD overview text with the final kept workflow set in `/home/choiho/zerone/hinear/README.md`
- [ ] T013 [US1] Update the implementation and rationale notes for the retired or replaced performance automation in `/home/choiho/zerone/hinear/docs/performance-optimizations.md`

**Checkpoint**: Low-value workflow logic is gone or replaced, and the repository keeps a truthful MVP CI baseline

---

## Phase 4: User Story 2 - Add missing repository guardrails (Priority: P2)

**Goal**: Add missing lightweight guardrails so PRs and protected branches have explicit, maintainable repository safety checks

**Independent Test**: Reading the workflow definitions and governance contract is enough to identify the required merge checks, optional secret-gated checks, and any newly added guardrail jobs.

### Implementation for User Story 2

- [ ] T014 [P] [US2] Add or refine workflow-governance validation for GitHub Actions definitions in `/home/choiho/zerone/hinear/.github/workflows/ci.yml`
- [ ] T015 [P] [US2] Add or refine dependency-risk review coverage in `/home/choiho/zerone/hinear/.github/workflows/ci.yml`
- [ ] T016 [US2] Normalize Node.js and pnpm setup, cache behavior, and check naming across `/home/choiho/zerone/hinear/.github/workflows/ci.yml` and `/home/choiho/zerone/hinear/.github/workflows/performance.yml`
- [ ] T017 [US2] Preserve predictable skip behavior and non-required positioning for secret-gated MCP smoke checks in `/home/choiho/zerone/hinear/.github/workflows/ci.yml`
- [ ] T018 [US2] Record the final required and optional guardrail policy in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/contracts/github-workflow-governance.md`
- [ ] T019 [US2] Update quick verification steps for the added guardrails in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/quickstart.md`

**Checkpoint**: Required and optional guardrails are explicit, lightweight, and branch-protection safe

---

## Phase 5: User Story 3 - Make CI/CD ownership and intent understandable (Priority: P3)

**Goal**: Make workflow purpose, ownership, trigger intent, and failure response easy to understand from repository documentation

**Independent Test**: A contributor can read the repository docs and understand which workflows are required, which are optional, what secrets they need, and what to do on failure without extra maintainer context.

### Implementation for User Story 3

- [ ] T020 [P] [US3] Update the main CI/CD explanation and workflow intent in `/home/choiho/zerone/hinear/README.md`
- [ ] T021 [P] [US3] Update MCP CI documentation to reflect final secret-gated behavior in `/home/choiho/zerone/hinear/docs/hinear-mcp-implementation.md`
- [ ] T022 [P] [US3] Update performance documentation to reflect the final monitoring workflow state in `/home/choiho/zerone/hinear/docs/performance-optimizations.md`
- [ ] T023 [US3] Add maintainer-facing ownership, required-check, and failure-response notes to `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/contracts/github-workflow-governance.md`
- [ ] T024 [US3] Capture final workflow decisions, branch-protection implications, and follow-up notes in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/research.md`

**Checkpoint**: CI/CD intent and operating guidance are understandable from repository artifacts alone

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across all stories

- [ ] T025 [P] Run repository validation commands and capture outcomes for this feature in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/quickstart.md`
- [ ] T026 [P] Review `.github/workflows/ci.yml` and `.github/workflows/performance.yml` for stable required-check names and branch-protection-safe triggers in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/research.md`
- [ ] T027 Finalize the implementation summary, decision trace, and next-step notes in `/home/choiho/zerone/hinear/specs/008-github-cicd-audit/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories
- **User Story 1 (Phase 3)**: Starts after Foundational and delivers the MVP
- **User Story 2 (Phase 4)**: Starts after Foundational and depends on the kept/removed workflow baseline from US1
- **User Story 3 (Phase 5)**: Starts after US1 and US2 decisions stabilize so documentation reflects final behavior
- **Polish (Phase 6)**: Runs after all desired user stories are complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories
- **US2 (P2)**: Depends on US1 decisions for which workflows remain and what baseline must be protected
- **US3 (P3)**: Depends on US1 and US2 so docs describe the final workflow set and guardrails accurately

### Within Each User Story

- Audit or decision-capture tasks come before workflow edits
- Workflow edits come before repository documentation updates
- Documentation updates come before final validation capture

### Parallel Opportunities

- `T002`, `T003`, and `T004` can run in parallel during setup
- `T008` and `T009` can run in parallel while auditing current workflows
- `T014` and `T015` can run in parallel if they touch different CI concerns within `/home/choiho/zerone/hinear/.github/workflows/ci.yml`
- `T020`, `T021`, and `T022` can run in parallel once workflow behavior is finalized
- `T025` and `T026` can run in parallel during final verification

---

## Parallel Example: User Story 1

```bash
Task: "Audit .github/workflows/ci.yml and capture its keep/adjust decision in specs/008-github-cicd-audit/research.md"
Task: "Audit .github/workflows/performance.yml and capture its remove/replace decision in specs/008-github-cicd-audit/research.md"
```

---

## Parallel Example: User Story 3

```bash
Task: "Update the main CI/CD explanation and workflow intent in README.md"
Task: "Update MCP CI documentation to reflect final secret-gated behavior in docs/hinear-mcp-implementation.md"
Task: "Update performance documentation to reflect the final monitoring workflow state in docs/performance-optimizations.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate that required CI coverage remains truthful and branch-protection safe

### Incremental Delivery

1. Finish Setup + Foundational governance artifacts
2. Deliver US1 to clean up low-value workflows
3. Deliver US2 to add missing lightweight guardrails
4. Deliver US3 to document final ownership and operating intent
5. Finish with cross-cutting verification and plan summary updates

### Parallel Team Strategy

1. One person audits existing workflows and branch-protection implications
2. One person prepares governance and quickstart artifacts
3. After US1 stabilizes, documentation updates can proceed in parallel with final validation

---

## Notes

- All tasks follow the required checklist format `- [ ] T### [P?] [US?] Description with file path`
- Parallel tasks are marked only where file ownership can be split safely
- MVP scope is **Phase 3 / User Story 1**
- No `.specify/extensions.yml` hooks were present during task generation
