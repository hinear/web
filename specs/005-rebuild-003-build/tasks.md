# Tasks: 003 빌드 안정성 재구성

**Input**: `/specs/005-rebuild-003-build/`의 설계 문서
**Prerequisites**: `plan.md`(필수), `spec.md`(유저 스토리용 필수), `research.md`, `data-model.md`, `contracts/`

**Tests**: 이 기능은 `build`, `typecheck`, 영향받은 핵심 테스트를 통한 검증이 명시되어 있으므로 대상 테스트 작업을 포함한다. 헌법에 따라 핵심 도메인/핵심 플로우 관련 테스트는 구현 전에 먼저 작성하거나 갱신하고 실패 상태를 확인해야 한다.

**Organization**: 각 작업은 유저 스토리별로 묶어서, 독립 구현과 독립 검증이 가능하도록 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(서로 다른 파일, 미완료 선행 작업 없음)
- **[Story]**: 어떤 유저 스토리에 속한 작업인지 표시(예: `US1`, `US2`, `US3`)
- 설명에는 정확한 파일 경로를 포함한다

## Path Conventions

- 웹 애플리케이션 경로는 `src/`, `tests/`, `docs/`, 저장소 루트 설정 파일 기준으로 적는다
- feature 계획 산출물은 `specs/005-rebuild-003-build/` 아래에 있다

## Phase 1: Setup (공유 준비 작업)

**Purpose**: 코드 수정 전에 현재 적색 상태와 복구 산출물을 정렬한다

- [X] T001 현재 실패 상태 인벤토리를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 최신화한다
- [X] T002 체크포인트 기준과 완료 기준을 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/contracts/recovery-validation.md 에 맞춘다
- [X] T003 [P] 현재 복구 범위와 defer 후보를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/plan.md 에 기록한다

---

## Phase 2: Foundational (모든 스토리를 막는 선행 조건)

**Purpose**: 어떤 유저 스토리 복구 작업도 검증할 수 없게 만드는 공통 차단 요소를 제거한다

**⚠️ CRITICAL**: 이 단계가 끝나기 전에는 어떤 유저 스토리 작업도 시작하면 안 된다

- [X] T004 루트 설정 의존성 해석 문제를 /home/choiho/zerone/hinear/next.config.ts 에서 복구한다
- [X] T005 [P] 사라진 MCP token route 기대값의 참조 원인을 /home/choiho/zerone/hinear/src/app/api/ 와 /home/choiho/zerone/hinear/specs/002-mcp-phase2-features/ 에서 추적하고 정리한다
- [X] T006 소스 라우트와 tsconfig 관련 그래프를 /home/choiho/zerone/hinear/src/app/api/ 및 /home/choiho/zerone/hinear/tsconfig.json 에 맞게 정렬해 generated route/type 기대값을 맞춘다
- [X] T007 [P] web vitals 및 관련 클라이언트 import 타입 가용성을 /home/choiho/zerone/hinear/src/components/WebVitals.tsx 와 /home/choiho/zerone/hinear/package.json 에서 복구한다
- [X] T008 Foundational 검증을 실행하고 결과를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 기록한다

**Checkpoint**: 이 단계가 끝나면 유저 스토리 구현을 시작할 수 있다

---

## Phase 3: User Story 1 - 배포 가능한 003 결과 복구 (Priority: P1) 🎯 MVP

**Goal**: 의도된 사용자 가치를 삭제하지 않고 003과 주변 적색 구간을 실제로 빌드 가능한 기준선으로 복구한다

**Independent Test**: `pnpm typecheck`와 `pnpm build`가 통과하고, `/projects/new`, `/projects/[projectId]`, `/projects/[projectId]/issues/[issueId]` 유지 검증과 직접 수정한 performance/query 경로의 대상 테스트가 통과해야 하며, 003의 핵심 동작이 계속 남아 있어야 한다

### Tests for User Story 1 ⚠️

> **NOTE: 이 테스트는 구현 전에 먼저 추가하거나 갱신하고, 실패 상태를 확인한 뒤 구현을 진행한다**

- [X] T009 [P] [US1] performance repository 타이핑 회귀 커버리지를 /home/choiho/zerone/hinear/tests/performance/bottleneck-tracker.test.ts.skip 에 추가한다
- [X] T010 [P] [US1] regression detector 동작 회귀 커버리지를 /home/choiho/zerone/hinear/tests/performance/regression.test.ts.skip 에 추가한다
- [X] T011 [P] [US1] `/projects/new` 및 `/projects/[projectId]` 핵심 흐름 유지 검증을 /home/choiho/zerone/hinear/src/features/projects/actions/create-project-action.test.ts 와 /home/choiho/zerone/hinear/src/features/projects/components/project-overview-screen.test.tsx 에 추가하거나 갱신한다
- [X] T012 [P] [US1] `/projects/[projectId]/issues/[issueId]` 핵심 흐름 유지 검증을 /home/choiho/zerone/hinear/src/features/issues/components/issue-detail-screen.test.tsx 와 /home/choiho/zerone/hinear/src/app/api/issues/[issueId]/route.test.ts 에 추가하거나 갱신한다
- [X] T013 [P] [US1] React Query provider 및 performance wiring 회귀 커버리지를 /home/choiho/zerone/hinear/src/test/setup.ts 와 /home/choiho/zerone/hinear/src/test/browser-setup.ts 에 추가한다

### Implementation for User Story 1

- [X] T014 [P] [US1] performance repository 타입 계약을 /home/choiho/zerone/hinear/src/features/performance/repositories/performance-metrics-repository.ts 에서 복구한다
- [X] T015 [P] [US1] bottleneck tracker 타입 및 통계 매핑을 /home/choiho/zerone/hinear/src/features/performance/lib/bottleneck-tracker.ts 에서 복구한다
- [X] T016 [P] [US1] regression detector의 time-range 및 query 사용을 /home/choiho/zerone/hinear/src/features/performance/lib/regression-detector.ts 에서 복구한다
- [X] T017 [US1] performance 도메인 타입과 계약을 /home/choiho/zerone/hinear/src/features/performance/types.ts 와 /home/choiho/zerone/hinear/src/features/performance/contracts.ts 에서 정합화한다
- [X] T018 [US1] project query hook import와 query key 사용을 /home/choiho/zerone/hinear/src/features/projects/hooks/use-projects.ts 와 /home/choiho/zerone/hinear/src/lib/react-query/query-client.ts 에서 복구한다
- [X] T019 [US1] React Query devtools/provider 타이핑을 /home/choiho/zerone/hinear/src/lib/react-query/query-provider.tsx 에서 수정한다
- [X] T020 [US1] `pnpm typecheck`, `pnpm build`, `pnpm test src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run` 를 실행하고 근거를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 기록한다

**Checkpoint**: 이 시점에서 US1은 빌드 가능한 003 기준선을 제공해야 한다

---

## Phase 4: User Story 2 - 빌드 건강성을 작업 루프에 포함 (Priority: P2)

**Goal**: 의미 있는 모듈/플로우 단위 변경마다 검증이 강제되는 체크포인트 기반 작업 방식으로 바꾼다

**Independent Test**: 다른 기여자가 recovery 문서만 보고도 각 체크포인트에서 언제 `typecheck`, `build`, 영향받은 핵심 테스트를 돌려야 하는지 알 수 있어야 한다

### Tests for User Story 2 ⚠️

- [X] T021 [P] [US2] 체크포인트 실행 예시를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/contracts/recovery-validation.md 에 추가한다
- [X] T022 [P] [US2] 체크포인트별 명령과 실패 처리 예시를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 추가한다
- [X] T023 [P] [US2] `/projects/new`, `/projects/[projectId]`, `/projects/[projectId]/issues/[issueId]` 유지 검증 명령을 체크포인트별 예시에 반영한다 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md

### Implementation for User Story 2

- [X] T024 [US2] 체크포인트 정의와 changed-area 추적을 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/data-model.md 에 확장한다
- [X] T025 [US2] recovery 단계별 검증 루프와 중단 조건을 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/plan.md 에 명시한다
- [X] T026 [US2] 연구 결정사항을 실제 체크포인트 워크플로우에 맞게 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/research.md 에 정렬한다
- [X] T027 [US2] 체크포인트 시퀀스를 따라 문서 검증을 수행하고 결과를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 남긴다

**Checkpoint**: 이 시점에서 US1과 US2는 복구 기준선과 반복 가능한 검증 루프를 함께 제공해야 한다

---

## Phase 5: User Story 3 - 미래 작업을 위한 복구 경계 명확화 (Priority: P3)

**Goal**: 실패했던 003 시도를 다시 파헤치지 않아도 recovered scope, deferred scope, 남은 위험을 이해할 수 있게 만든다

**Independent Test**: 새 기여자가 feature 문서를 읽고 무엇이 복구되었고 무엇이 defer 되었으며 어떤 검증이 accepted baseline인지 빠르게 판단할 수 있어야 한다

### Tests for User Story 3 ⚠️

- [X] T028 [P] [US3] recovered/deferred scope 추적 점검 항목을 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/spec.md 에 추가한다
- [X] T029 [P] [US3] handoff 검토 프롬프트를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 추가한다

### Implementation for User Story 3

- [X] T030 [US3] recovered scope, deferred 항목, owner hint를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/data-model.md 와 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/plan.md 에 문서화한다
- [X] T031 [US3] recovered baseline을 더 명확히 드러내도록 feature specification 문구를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/spec.md 에 반영한다
- [X] T032 [US3] 최종 복구 상태와 남은 위험을 /home/choiho/zerone/hinear/docs/todo.md 와 /home/choiho/zerone/hinear/docs/session-handoff.md 에 반영한다
- [X] T033 [US3] US3 문서 검토를 수행하고 최종 handoff 메모를 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 기록한다

**Checkpoint**: 이 시점에서 모든 유저 스토리는 독립적으로 이해 가능하고 추적 가능해야 한다

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 코드와 문서 전반에서 복구된 기준선을 마감한다

- [X] T034 [P] 남아 있는 오래된 performance 참조를 /home/choiho/zerone/hinear/docs/performance-optimizations.md 와 /home/choiho/zerone/hinear/specs/003-performance-audit/ 에서 정리한다
- [X] T035 `pnpm typecheck`, `pnpm build`, `pnpm test src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run` 를 포함한 최종 recovery 검증 명령을 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 기준으로 실행한다
- [X] T036 최종 recovered baseline 근거와 deferred follow-up을 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/plan.md 와 /home/choiho/zerone/hinear/specs/005-rebuild-003-build/quickstart.md 에 기록한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음, 바로 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작, 모든 유저 스토리를 막는 선행 단계
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작
- **User Story 2 (Phase 4)**: 검증 루프를 복구된 기준선 위에 올리므로 US1 이후 시작
- **User Story 3 (Phase 5)**: 검증된 상태를 문서화해야 하므로 US1, US2 이후 시작
- **Polish (Phase 6)**: 원하는 유저 스토리가 모두 끝난 뒤 진행

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 이후 시작, MVP 복구 기준선 확립
- **User Story 2 (P2)**: US1 이후 시작, 복구 기준선의 검증 루프 정착
- **User Story 3 (P3)**: US1, US2 이후 시작, recovered/deferred 경계 문서화

### Within Each User Story

- 테스트 및 추적성 업데이트 먼저
- 핵심 코드/문서 구현 다음
- 검증 및 근거 기록 마지막

### Parallel Opportunities

- **Setup**: T001-T002 작업 중 T003 병렬 가능
- **Foundational**: T004 시작 후 T005, T007 병렬 가능
- **US1**: T009-T013 병렬 가능, T014-T016 병렬 가능, 이후 T018-T019 진행 가능
- **US2**: T021-T023 병렬 가능
- **US3**: T028와 T029 병렬 가능
- **Polish**: T034 후 T035 진행 가능

---

## Parallel Example: User Story 1

```bash
# US1 회귀 테스트 작업 병렬 실행 예시
Task: "performance repository 타이핑 회귀 커버리지를 tests/performance/bottleneck-tracker.test.ts.skip 에 추가"
Task: "regression detector 동작 회귀 커버리지를 tests/performance/regression.test.ts.skip 에 추가"
Task: "`/projects/new` 및 `/projects/[projectId]` 핵심 흐름 유지 검증을 src/features/projects/actions/create-project-action.test.ts 와 src/features/projects/components/project-overview-screen.test.tsx 에 추가 또는 갱신"
Task: "`/projects/[projectId]/issues/[issueId]` 핵심 흐름 유지 검증을 src/features/issues/components/issue-detail-screen.test.tsx 와 src/app/api/issues/[issueId]/route.test.ts 에 추가 또는 갱신"
Task: "React Query provider 및 performance wiring 회귀 커버리지를 src/test/setup.ts 와 src/test/browser-setup.ts 에 추가"

# US1 코드 복구 작업 병렬 실행 예시
Task: "performance repository 타입 계약을 src/features/performance/repositories/performance-metrics-repository.ts 에서 복구"
Task: "bottleneck tracker 타입 및 통계 매핑을 src/features/performance/lib/bottleneck-tracker.ts 에서 복구"
Task: "regression detector의 time-range 및 query 사용을 src/features/performance/lib/regression-detector.ts 에서 복구"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup 완료
2. Phase 2 Foundational 완료
3. Phase 3 User Story 1 완료
4. **STOP and VALIDATE**: `pnpm typecheck`, `pnpm build`, `pnpm test src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run` 통과 확인
5. 이 상태를 최소 복구 기준선으로 고정한 뒤 검증 루프와 문서를 강화한다

### Incremental Delivery

1. Setup + Foundational로 검증 가능 상태 복구
2. US1로 실제 빌드 가능 기준선 복구
3. US2로 검증 루프 반복 가능하게 정리
4. US3로 handoff 및 deferred 경계 문서화
5. Polish로 근거와 오래된 참조 정리

### Parallel Team Strategy

여러 명이 작업한다면:

1. 한 명은 루트 설정과 route graph 차단 요소 담당
2. 한 명은 performance 도메인 타입 복구 담당
3. 한 명은 US1 안정화 이후 recovery 문서와 계약 담당

---

## Notes

- `[P]` 작업은 서로 다른 파일 또는 분리된 산출물을 건드린다
- Story label은 clarify된 세 개의 유저 스토리에 직접 매핑된다
- 모든 유저 스토리에는 독립 검증 기준이 있다
- 최종 명령 근거는 터미널 히스토리가 아니라 feature 문서에 남겨야 한다
- “기능 삭제로 빌드 통과” 대신 active integration 복구를 우선한다
