# Research: GitHub CI/CD Audit and Rationalization

## Decision 1: Keep `ci.yml` as the required baseline verification workflow

**Decision**: Retain `.github/workflows/ci.yml` as the repository's primary required check and treat its `verify` job as the branch-protection baseline for pull requests.

**Rationale**:
- It already runs the repository's real validation commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- These commands align with the current application stack and developer guidance in `AGENTS.md`.
- A single high-signal required workflow is simpler to reason about than multiple overlapping workflows.

**Alternatives considered**:
- Split lint/typecheck/test/build into multiple required workflows: rejected because it increases coordination and required-check drift without clear value for this repository size.
- Keep `ci.yml` but narrow it to only lint/test: rejected because build failures would move later in the lifecycle and reduce confidence in PR readiness.

## Decision 2: Keep secret-dependent MCP smoke coverage conditional and explicitly optional

**Decision**: Preserve the existing MCP smoke path as a conditional job, but design it as a non-required, secrets-gated workflow signal that skips predictably when secrets are absent.

**Rationale**:
- The current `mcp-smoke` job depends on Supabase and account secrets that are not guaranteed for every fork or contributor context.
- CI should not emit misleading failures in secretless environments.
- The job still provides value in protected repository contexts where secrets are configured.

**Alternatives considered**:
- Make MCP smoke mandatory for all pull requests: rejected because forks and external contributors would experience unavoidable failures.
- Remove MCP smoke entirely: rejected because the repository already contains MCP-specific commands and smoke coverage is still valuable in trusted environments.

## Decision 3: Remove or fully replace placeholder performance automation

**Decision**: Treat `.github/workflows/performance.yml` as a cleanup target. It should be removed or replaced with a materially real workflow; placeholder steps that always report success are not acceptable as ongoing repository guardrails.

**Rationale**:
- The current workflow contains explicit placeholder bundle, Lighthouse, monitoring, and PR-comment logic.
- Several performance tests in `tests/performance/` are skipped, which means the workflow currently overstates its protective value.
- Placeholder success erodes trust in CI and conflicts with the repository's simplicity and test-driven principles.

**Alternatives considered**:
- Keep the workflow unchanged until a future milestone: rejected because it continues to present synthetic confidence.
- Mark the workflow optional but leave placeholders in place: rejected because even optional workflows should still provide truthful signal.

## Decision 4: Add lightweight workflow-governance guardrails instead of a broad security suite

**Decision**: Add missing guardrails around GitHub workflow integrity and dependency-risk review with lightweight PR-focused automation, rather than introducing a large multi-tool security program in one step.

**Rationale**:
- The repository currently lacks a dedicated guardrail for workflow definition quality and dependency-change scrutiny.
- Lightweight governance checks fit the simplicity principle and can be required without large runtime cost.
- This feature is about rationalizing CI/CD, so narrow, actionable guardrails are a better fit than an expansive platform-security rollout.

**Alternatives considered**:
- Add CodeQL, container scanning, and full security suites immediately: rejected because the current repo does not yet justify that operational overhead in this feature.
- Add no new guardrails beyond current CI: rejected because the audit goal includes identifying missing automation, not just deleting workflows.

## Decision 5: Document required vs optional checks as a repository contract

**Decision**: Define a repository-local governance contract that records which workflows are required, which are conditional, what secrets they depend on, and when a workflow must be retired or replaced.

**Rationale**:
- Without a written contract, required-check names and optional-job expectations can drift from actual branch protection rules.
- The spec explicitly requires that contributors understand workflow intent and failure handling quickly.
- Documentation reduces future reintroduction of placeholder or duplicate automation.

**Alternatives considered**:
- Rely only on inline YAML comments: rejected because required-check policy spans multiple workflows and branch-protection intent is easier to review in a single artifact.
- Store the policy only in a pull request description: rejected because it would not persist as repository knowledge.

## Baseline Inventory (Recorded 2026-03-27)

### Workflows Under Audit

| Subject | File | Trigger | Classification | Branch Protection Position |
|---|---|---|---|---|
| CI / Verify | `.github/workflows/ci.yml` | `pull_request`, `push` | Keep (required baseline) | Required |
| CI / Workflow Governance | `.github/workflows/ci.yml` | `pull_request`, `push` | Add (guardrail) | Recommended required |
| CI / Dependency Risk | `.github/workflows/ci.yml` | `pull_request`, `push` | Add (guardrail) | Recommended required |
| CI / MCP Smoke | `.github/workflows/ci.yml` | `pull_request`, `push` + secrets gate | Keep (conditional) | Optional |
| Performance Diagnostics | `.github/workflows/performance.yml` | `workflow_dispatch`, weekly schedule | Replace prior placeholder workflow | Optional |

### Baseline Validation Commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Final Decision Records (Implemented)

### `.github/workflows/ci.yml`

- **Decision**: Keep and refine
- **Reason**: Maintains canonical verification path and now includes lightweight governance/dependency guardrails.
- **Impact on branch protection**: `Verify` remains stable required baseline. `Workflow Governance` and `Dependency Risk` can be promoted to required checks safely.
- **Status**: Implemented

### `.github/workflows/performance.yml`

- **Decision**: Replace
- **Reason**: Placeholder logic removed; replaced with truthful optional diagnostics.
- **Impact on branch protection**: No required check dependency. Safe for optional/manual and scheduled monitoring use.
- **Status**: Implemented

## Branch-Protection Implications (Reviewed 2026-03-27)

- Stable required-check candidate names: `Verify`, `Workflow Governance`, `Dependency Risk`
- Optional checks: `MCP Smoke`, `Performance Diagnostics`
- Secret-dependent behavior:
  - `MCP Smoke` skips when required secrets are absent
  - no secret dependency for `Performance Diagnostics`

## Follow-up Notes

- If branch protection currently requires only `Verify`, maintainers may optionally add `Workflow Governance` and `Dependency Risk` as required after one green cycle.
- Keep `MCP Smoke` non-required to avoid blocking forks and secretless contributor contexts.
