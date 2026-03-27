# Data Model: Rebuild 003 Build Stability

## Overview

이 기능은 제품 도메인 엔티티를 추가하는 작업이 아니라, 복구 작업을 안정적으로 수행하기 위한 운영 엔티티를 정의하는 계획 산출물이다.

## Entities

### Recovery Scope

- **Purpose**: 이번 복구에서 반드시 되살릴 변경과 의도적으로 제외할 변경을 구분한다.
- **Fields**:
  - `name`: 복구 묶음 이름
  - `includedAreas`: 직접 복구 대상이 되는 모듈, 사용자 흐름, 설정
  - `adjacentBuildBreakers`: 함께 정리할 기존 빌드 적색 구간
  - `deferredAreas`: 이번 기준선 밖으로 남기는 항목
  - `preservedUserValue`: 제거하면 안 되는 사용자 가치 설명
- **Validation Rules**:
  - `includedAreas`는 최소 하나 이상의 의미 있는 변경 묶음을 포함해야 한다.
  - `deferredAreas`는 왜 제외했는지 이유를 남겨야 한다.
  - `preservedUserValue`는 “삭제 대신 복구” 기준을 설명할 수 있어야 한다.

**Current Instance**:

- `name`: `US1 recovered baseline`
- `includedAreas`:
  - `next.config.ts` 의존성 해석 복구
  - `package.json` / `tsconfig.typecheck.json` 기반 typecheck 루프 고정
  - `src/features/performance/*` 저장소/트래커/회귀 감지 계약 복구
  - `src/features/projects/hooks/use-projects.ts` / `src/lib/react-query/query-provider.tsx` 활성 그래프 복구
  - `/projects/new`
  - `/projects/[projectId]`
  - `/projects/[projectId]/issues/[issueId]`
- `adjacentBuildBreakers`:
  - stale `.next/dev/types` MCP token route 참조
  - `web-vitals` / `@next/bundle-analyzer` 의존성 누락
- `deferredAreas`:
  - webpack asset size warning 해소
  - `loadIssueDetail()` 예외 경로 단순화
  - 003 문서 전반의 장기적인 성능 결과 재측정
- `preservedUserValue`:
  - 003 성능 표면을 삭제하지 않고 build/typecheck/test 가능 상태로 되돌리는 것

### Build Verification Checkpoint

- **Purpose**: 의미 있는 변경 묶음이 끝날 때마다 현재 기준선이 여전히 안전한지 기록한다.
- **Fields**:
  - `checkpointName`: 검증 이름
  - `changedAreas`: 이번 묶음에서 손댄 경로/흐름
  - `buildStatus`: build 통과 여부
  - `typecheckStatus`: typecheck 통과 여부
  - `criticalTestSet`: 함께 확인해야 하는 테스트 묶음
  - `criticalTestStatus`: 테스트 통과 여부
  - `notes`: 실패 원인 또는 후속 조치
- **Validation Rules**:
  - `changedAreas` 없이 체크포인트를 기록할 수 없다.
  - `buildStatus`와 `typecheckStatus`는 항상 함께 기록한다.
  - 실패한 체크포인트는 다음 묶음으로 넘어가기 전에 처리 방향이 정리되어야 한다.

**Current Instances**:

1. `Checkpoint A`
   - `changedAreas`: `package.json`, dependency install, root config import resolution
   - `buildStatus`: passed
   - `typecheckStatus`: passed
   - `criticalTestSet`: deferred until app graph stabilized
   - `criticalTestStatus`: not_run_yet
   - `notes`: missing `@next/bundle-analyzer`, `web-vitals` 제거
2. `Checkpoint B`
   - `changedAreas`: `src/app/api`, `.next` generated graph handling, `tsconfig.typecheck.json`
   - `buildStatus`: passed
   - `typecheckStatus`: passed
   - `criticalTestSet`: command set fixed
   - `criticalTestStatus`: ready
   - `notes`: `.next/dev/types` stale validator를 standalone typecheck 경로에서 제외
3. `Checkpoint C`
   - `changedAreas`: `src/features/performance/*`, `src/features/projects/hooks/use-projects.ts`, `src/lib/react-query/*`, `src/lib/supabase/use-supabase-client.ts`
   - `buildStatus`: passed
   - `typecheckStatus`: passed
   - `criticalTestSet`: direct + adjacent flow tests
   - `criticalTestStatus`: passed
   - `notes`: optimization record / baseline / provider typing 정렬

### Affected Critical Test Set

- **Purpose**: 직접 수정 영역과 인접 핵심 플로우 검증 범위를 명확히 한다.
- **Fields**:
  - `directTests`: 직접 수정한 영역의 테스트
  - `adjacentFlowTests`: 연결된 핵심 사용자 흐름 테스트
  - `selectionReason`: 왜 이 테스트들이 핵심인지 설명
- **Validation Rules**:
  - `directTests` 또는 `adjacentFlowTests` 중 하나 이상은 반드시 존재해야 한다.
  - 선택 이유는 사용자 흐름 또는 모듈 의존성과 연결되어야 한다.

**Current Instance**:

- `directTests`:
  - `tests/performance/bottleneck-tracker.test.ts`
  - `tests/performance/regression.test.ts`
  - `src/lib/react-query/query-provider.test.tsx`
  - `src/lib/supabase/use-supabase-client.test.tsx`
- `adjacentFlowTests`:
  - `src/features/projects/actions/create-project-action.test.ts`
  - `src/features/projects/components/project-overview-screen.test.tsx`
  - `src/features/issues/components/issue-detail-screen.test.tsx`
  - `src/app/api/issues/[issueId]/route.test.ts`
- `selectionReason`:
  - 직접 수정한 성능/쿼리/클라이언트 경계와 `/projects/new` → `/projects/[projectId]` → `/projects/[projectId]/issues/[issueId]` 흐름이 함께 살아 있어야 recovered baseline이라 판단할 수 있기 때문

### Outstanding Follow-up Item

- **Purpose**: 복구 도중 발견했지만 이번 안정 기준선에 필수는 아닌 후속 작업을 기록한다.
- **Fields**:
  - `title`: 후속 작업 이름
  - `discoveredIn`: 발견된 체크포인트 또는 영역
  - `reasonDeferred`: 왜 미뤘는지
  - `riskIfDeferred`: 미룰 때의 영향
  - `ownerHint`: 다음 작업자가 참고할 담당 영역
- **Validation Rules**:
  - `reasonDeferred`와 `riskIfDeferred`는 둘 다 비어 있을 수 없다.
  - 이번 복구 완료를 막는 항목은 follow-up으로만 남길 수 없다.

**Current Instances**:

1. `Bundle size warning follow-up`
   - `discoveredIn`: final build validation
   - `reasonDeferred`: 현재는 warning이며 build failure가 아님
   - `riskIfDeferred`: 초기 로드 성능 목표를 다시 넘길 수 있음
   - `ownerHint`: `next.config.ts`, route-level code splitting, editor-heavy screens
2. `Issue detail privileged read-path review`
   - `discoveredIn`: handoff review
   - `reasonDeferred`: 003 build recovery의 직접 실패 원인은 아니었음
   - `riskIfDeferred`: auth/data-access 단순화가 늦어질 수 있음
   - `ownerHint`: `src/features/issues/lib/issue-detail-loader`, session-aware repository wiring

## Relationships

- 하나의 **Recovery Scope**는 여러 **Build Verification Checkpoint**를 가진다.
- 하나의 **Build Verification Checkpoint**는 하나의 **Affected Critical Test Set**을 참조한다.
- 하나의 **Build Verification Checkpoint**는 0개 이상의 **Outstanding Follow-up Item**을 남길 수 있다.

## State Transitions

### Recovery Scope

`Defined` → `In Repair` → `Validated` → `Handed Off`

- `Defined`: 범위와 보존 가치가 정리된 상태
- `In Repair`: 실제 복구 변경이 진행 중인 상태
- `Validated`: 최종 검증 기준을 만족한 상태
- `Handed Off`: 문서화와 후속 경계가 정리된 상태

### Build Verification Checkpoint

`Planned` → `Running` → `Passed` | `Failed`

- `Failed` 상태에서는 원인 수정 또는 범위 조정 없이 다음 체크포인트로 진행할 수 없다.
