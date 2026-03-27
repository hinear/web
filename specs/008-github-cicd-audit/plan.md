# Implementation Plan: GitHub CI/CD Audit and Rationalization

**Branch**: `008-github-cicd-audit` | **Date**: 2026-03-27 | **Spec**: [spec.md](/home/choiho/zerone/hinear/specs/008-github-cicd-audit/spec.md)
**Input**: Feature specification from `/specs/008-github-cicd-audit/spec.md`

## Summary

Audit the repository's GitHub Actions workflows, remove or replace low-signal placeholder automation, preserve the current high-value verification path, and add missing repository guardrails around workflow governance and dependency-risk review. The implementation will center on `.github/workflows/`, workflow documentation, and validation that required checks still map cleanly to the repository's real `pnpm` verification commands.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 for repository tooling and GitHub Actions workflow execution  
**Primary Dependencies**: Next.js 16.2.0, React 19.2.4, pnpm 10.x, Biome, Vitest, Supabase, GitHub Actions  
**Storage**: Repository files (`.github/workflows/`, `specs/`, `AGENTS.md`)  
**Testing**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, workflow validation for changed GitHub Actions definitions  
**Target Platform**: GitHub-hosted Ubuntu runners for CI, Next.js web application repository  
**Project Type**: Web application with repository-managed CI/CD automation  
**Performance Goals**: Required PR feedback remains high-signal and completes within a single CI pass without placeholder jobs reporting false confidence  
**Constraints**: Preserve branch-protection-safe required checks, avoid secret leakage, secret-dependent jobs must skip predictably, keep automation simple and maintainable  
**Scale/Scope**: Two existing repository workflows (`ci.yml`, `performance.yml`) plus supporting CI/CD documentation and governance artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Project-First / Issue-Centric Design**: Pass. This feature changes repository automation only and does not alter product domain boundaries or issue workflows.
- **Domain-Driven Design**: Pass. No domain-layer code contract is being changed; workflow governance remains isolated to repository tooling and documentation.
- **Incremental Completeness**: Pass. The plan is structured so workflow cleanup, required-guardrail additions, and documentation can ship in independent slices.
- **Test-Driven Development**: Pass with enforcement. Workflow edits must be backed by explicit verification steps using the repository's standard commands and workflow-specific validation.
- **Security & Data Integrity**: Pass with enforcement. Secret-dependent jobs must remain conditionally gated and must not expose credentials in logs or force failing runs when secrets are unavailable.
- **Simplicity**: Pass. The design explicitly removes placeholder or duplicate automation instead of layering more speculative workflows on top.

## Project Structure

### Documentation (this feature)

```text
specs/008-github-cicd-audit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── github-workflow-governance.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml
    └── performance.yml

src/
├── app/
├── features/
├── lib/
└── test/

tests/
└── performance/
```

**Structure Decision**: This is a single Next.js repository. Implementation work will primarily touch `.github/workflows/` and supporting repository documentation, while validation continues to use the existing `src/` and `tests/` application structure.

## Phase 0: Research Summary

Research findings are captured in [research.md](/home/choiho/zerone/hinear/specs/008-github-cicd-audit/research.md). Key decisions:

1. Retain `ci.yml` as the primary required verification workflow and standardize its role as the branch-protection baseline.
2. Keep secret-gated MCP smoke coverage optional and explicitly non-required when secrets are unavailable.
3. Retire or materially replace placeholder-only performance automation instead of continuing to report synthetic success.
4. Add lightweight workflow-governance guardrails that validate workflow integrity and dependency-risk without bloating required CI time.

## Phase 1: Design Artifacts

- [data-model.md](/home/choiho/zerone/hinear/specs/008-github-cicd-audit/data-model.md) defines workflow inventory, guardrail policy, and decision records.
- [github-workflow-governance.md](/home/choiho/zerone/hinear/specs/008-github-cicd-audit/contracts/github-workflow-governance.md) defines the repository-level CI/CD contract.
- [quickstart.md](/home/choiho/zerone/hinear/specs/008-github-cicd-audit/quickstart.md) outlines the implementation and validation flow for this feature.

## Post-Design Constitution Check

- **Project-First / Issue-Centric Design**: Still passes. No product behavior or project/issue boundaries are affected.
- **Domain-Driven Design**: Still passes. Repository automation remains outside domain-layer ownership and does not introduce new domain abstractions.
- **Incremental Completeness**: Still passes. Cleanup, guardrail additions, and documentation can be merged independently if needed.
- **Test-Driven Development**: Still passes. The design requires validation of each workflow change against real repository commands and workflow rules.
- **Security & Data Integrity**: Still passes. The plan preserves conditional secrets handling and adds governance around required vs optional checks.
- **Simplicity**: Still passes. Placeholder performance steps are treated as removal-or-replacement candidates rather than carried forward.

## Complexity Tracking

No constitutional violations or exceptional complexity justifications are required at planning time.
