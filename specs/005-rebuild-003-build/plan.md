# Implementation Plan: Rebuild 003 Build Stability

**Branch**: `005-rebuild-003-build` | **Date**: 2026-03-27 | **Spec**: [/home/choiho/zerone/hinear/specs/005-rebuild-003-build/spec.md](/home/choiho/zerone/hinear/specs/005-rebuild-003-build/spec.md)
**Input**: Feature specification from `/specs/005-rebuild-003-build/spec.md`

## Summary

003 성능 감사 작업과 그 주변 적색 구간을 다시 정리해, 앱이 `build`, `typecheck`, 그리고 직접 수정 영역과 인접 핵심 플로우 테스트까지 통과하는 안정 기준선을 회복한다. 작업은 의미 있는 사용자 흐름/모듈 단위로 끊어서 검증하며, 환경·의존성 문제를 먼저 제거한 뒤 003 performance 코드와 남은 타입 불일치를 정리하고, 마지막에 문서화된 복구 기준선과 후속 작업 경계를 남긴다.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js runtime, React 19.2.4  
**Primary Dependencies**: Next.js 16.2.0 (App Router), Supabase, @tanstack/react-query 5.95.2, next-pwa, Vitest, Testing Library, Biome  
**Storage**: Supabase PostgreSQL, browser caches/service worker assets, spec artifacts in repository files  
**Testing**: `next typegen && tsc --noEmit -p tsconfig.typecheck.json`, `vitest run`, targeted browser/integration tests, `next build --webpack`  
**Target Platform**: Web application/PWA for modern desktop and mobile browsers, Next.js server runtime  
**Project Type**: Web application  
**Performance Goals**: Preserve existing performance work without regressing the project baseline; keep buildable startup path available and retain documented targets such as initial bundle budget and fast project/issue flows  
**Constraints**: Must preserve project-first and issue-centric behavior, must not expand service-role usage, must validate each meaningful recovery checkpoint, must fix dependency/config failures before deeper feature repairs  
**Scale/Scope**: Single Next.js application with App Router, API routes, Supabase-backed features, and a 003 performance area spanning config, monitoring utilities, React Query integration, and related tests/docs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Project-First**: PASS. Recovery is scoped to restore shared application stability without changing `project` as the top-level boundary.
- **Issue-Centric Design**: PASS. Recovery completion requires affected primary user flows to remain available, preventing “fix build by removing issue value” shortcuts.
- **Domain-Driven Design**: PASS. Planned fixes stay within existing feature boundaries (`lib/`, `repositories/`, `hooks/`, `components/`, config) instead of introducing a new architecture.
- **Incremental Completeness**: PASS. Recovery is organized by meaningful checkpoints so each stage can return the app to a usable, verifiable state.
- **Test-Driven Development**: PASS WITH ENFORCEMENT. Modified domain/performance paths and impacted flows must end with targeted validation before the next checkpoint proceeds.
- **Security & Data Integrity**: PASS. No new service-role-first paths are introduced; recovery should prefer existing session-aware patterns.
- **Installable PWA**: PASS. Config fixes must preserve PWA behavior rather than disable it as a shortcut.
- **Simplicity**: PASS. Plan prioritizes removing broken or stale integration points before adding any new abstraction.

## Project Structure

### Documentation (this feature)

```text
specs/005-rebuild-003-build/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── recovery-validation.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   ├── auth/
│   ├── internal/
│   └── projects/
├── components/
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
├── features/
│   ├── issues/
│   ├── performance/
│   └── projects/
├── lib/
│   ├── react-query/
│   └── supabase/
├── test/
├── worker/
└── mocks/

tests/
├── contract/
├── integration/
└── unit/

docs/
├── performance-optimizations.md
├── performance-runbook.md
├── session-handoff.md
└── todo.md

specs/003-performance-audit/
└── ...
```

**Structure Decision**: Keep the existing single Next.js web application structure. Recovery work will primarily touch root config (`next.config.ts`, TypeScript/Next generated types expectations), `src/features/performance/*`, `src/features/projects/hooks/*`, `src/lib/react-query/*`, and selective docs/spec files that define the recovered baseline.

## Phase 0: Research

- Confirm the recovery order for the current red state: dependency/config breakages first, then stale route/type references, then 003 performance feature typing mismatches, then targeted validation and documentation.
- Confirm the best strategy for handling generated `.next` type references that point to missing MCP token routes without widening scope unnecessarily.
- Confirm whether broken React Query/project hooks should be repaired, deprecated, or removed from the active build surface.
- Confirm a practical validation contract for this recovery branch so “meaningful checkpoint” and “affected critical tests” remain testable.

## Phase 1: Design & Contracts

- Model recovery-specific planning entities: recovery scope, validation checkpoint, affected critical test set, deferred follow-up item.
- Define a recovery validation contract that names entry criteria, checkpoint validation, and completion validation.
- Produce a quickstart that developers can follow to reproduce failures, repair them in order, and verify the recovered baseline consistently.
- Update agent context so future implementation turns see this branch as a build-stability recovery effort rather than a net-new feature.

## Phase 2: Implementation Planning Approach

- Stage 1: Repair environment and root configuration blockers that prevent `build`/`typecheck` from starting cleanly.
- Stage 2: Remove or reconcile stale route/type references and unsupported imports introduced around 003 and adjacent work.
- Stage 3: Restore type-safe behavior in performance monitoring/repository code and any project hook/query artifacts still in the active graph.
- Stage 4: Run checkpoint validation after each meaningful module/user-flow batch.
- Stage 5: Finalize documentation of recovered scope, deferred work, and validation evidence.

## Recovery Scope Snapshot

### Recovered Scope

- `@next/bundle-analyzer` / `web-vitals` dependency resolution
- standalone `typecheck` reliability via `next typegen` + `tsconfig.typecheck.json`
- stale MCP token route references isolated to old `.next/dev/types` output
- performance repository / baseline / optimization record contract alignment
- React Query provider typing and project hook imports
- `/projects/new`
- `/projects/[projectId]`
- `/projects/[projectId]/issues/[issueId]`

### Deferred Scope

- webpack asset size warning reduction
- non-blocking documentation cleanup across older 003 artifacts
- issue detail privileged read-path simplification

## Enforced Checkpoint Workflow

1. 의미 있는 변경 묶음을 정한다.
2. 변경한 영역과 연결된 핵심 흐름 테스트를 적는다.
3. 아래 명령을 실행한다.

```bash
pnpm typecheck
pnpm build
pnpm test tests/performance/bottleneck-tracker.test.ts tests/performance/regression.test.ts src/lib/react-query/query-provider.test.tsx src/lib/supabase/use-supabase-client.test.tsx src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run
```

4. 셋 중 하나라도 실패하면 다음 묶음으로 진행하지 않는다.
5. 실패를 직접 수정 영역, 인접 흐름, 범위 밖 이슈로 분류한다.
6. 범위 밖 이슈만 follow-up으로 남기고, release-blocking 이슈는 바로 해결한다.

## Current Validation Evidence

- `pnpm typecheck`: passed
- `pnpm build`: passed
- targeted affected tests: passed
  - 8 files
  - 19 tests
- residual risk:
  - asset size warnings remain, but they are not build blockers

## Post-Design Constitution Check

- **Project-First**: PASS. Data boundaries remain unchanged.
- **Issue-Centric Design**: PASS. Recovery requires affected user flows to stay available.
- **Domain-Driven Design**: PASS. The design uses existing feature boundaries and avoids bypass layers.
- **Incremental Completeness**: PASS. Checkpoint-based recovery supports independently verifiable slices.
- **Test-Driven Development**: PASS WITH ENFORCEMENT. Quickstart and recovery contract define when `build`, `typecheck`, and targeted tests must run.
- **Security & Data Integrity**: PASS. No design step requires relaxing RLS/session-aware expectations.
- **Installable PWA**: PASS. PWA integration remains part of the supported config surface.
- **Simplicity**: PASS. The design favors removing stale edges and aligning types/contracts over adding new systems.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
