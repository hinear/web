# Quickstart: Rebuild 003 Build Stability

## Goal

003 및 주변 빌드 적색 구간을 다시 정리해, 안정적인 복구 기준선을 만들고 동일한 검증 루프로 끝까지 유지한다.

## 1. Reproduce the current red state

```bash
cd /home/choiho/zerone/hinear
pnpm typecheck
pnpm build
```

현재 확인된 대표 실패 축:

- `next.config.ts`에서 `@next/bundle-analyzer` 모듈 해석 실패
- Next generated validator가 존재하지 않는 MCP token route를 참조
- `src/features/performance/*` 내부 타입/계약 불일치
- `src/features/projects/hooks/use-projects.ts`의 오래된 타입/훅 참조
- `src/lib/react-query/query-provider.tsx`의 devtools 옵션 타입 불일치

실제 추적 결과:

- `src/app/api/mcp/tokens/*` 소스는 현재 저장소에 존재하지 않는다.
- stale MCP token route 참조는 실제 소스가 아니라 `.next/dev/types/*`의 오래된 개발 산출물에 남아 있었다.
- `pnpm exec next typegen`은 현재 소스 기준 route type을 다시 생성하지만, standalone `tsc`는 `.next/dev/types`를 그대로 읽기 때문에 typecheck 전용 tsconfig 분리가 필요했다.

## 2. Recover in checkpoint order

### Checkpoint A: Environment and config

목표:

- root config import resolution 복구
- 설치/의존성/환경 수준 오류를 먼저 제거

검증:

```bash
pnpm typecheck
pnpm build
```

실행 결과:

- `pnpm install`로 `@next/bundle-analyzer`, `web-vitals`를 설치해 설정/클라이언트 import 해석 문제를 제거했다.
- `pnpm typecheck` 통과
- `pnpm build` 통과

### Checkpoint B: Source graph and generated type alignment

목표:

- Next generated validator가 기대하는 소스 경로와 실제 앱 구조 정렬
- 사라진 route 참조 또는 stale build graph 정리

검증:

```bash
pnpm typecheck
pnpm build
```

실행 결과:

- `pnpm exec next typegen` 통과
- `tsconfig.typecheck.json`을 추가해 `.next/dev/types` stale route validator를 `typecheck` 경로에서 제외했다.
- `package.json`의 `typecheck`는 `next typegen && tsc --noEmit -p tsconfig.typecheck.json` 기준으로 고정했다.
- 현재 소스 그래프에는 `/api/mcp/tokens/*` route가 없고, generated type 기대값은 production type graph 기준으로 정렬됐다.
- `pnpm typecheck` 통과
- `pnpm build` 통과

### Checkpoint C: 003 performance module repair

목표:

- `src/features/performance/lib/*`
- `src/features/performance/repositories/*`
- React Query/provider integration
- 오래된 project hook/query surface 정리

검증:

```bash
pnpm typecheck
pnpm test src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run
pnpm build
```

실행 결과:

- `src/features/performance/repositories/performance-metrics-repository.ts`
- `src/features/performance/lib/bottleneck-tracker.ts`
- `src/features/performance/lib/regression-detector.ts`
- `src/features/projects/hooks/use-projects.ts`
- `src/lib/react-query/query-provider.tsx`
- `src/lib/supabase/use-supabase-client.ts`
- `tests/performance/bottleneck-tracker.test.ts`
- `tests/performance/regression.test.ts`
- `src/lib/react-query/query-provider.test.tsx`
- `src/lib/supabase/use-supabase-client.test.tsx`

위 경로를 중심으로 타입/계약을 복구했다.

- `pnpm typecheck` 통과
- `pnpm test src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run` 통과
  - 4 files passed
  - 11 tests passed
- `pnpm test tests/performance/bottleneck-tracker.test.ts tests/performance/regression.test.ts src/lib/react-query/query-provider.test.tsx src/lib/supabase/use-supabase-client.test.tsx src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run` 통과
  - 8 files passed
  - 19 tests passed
- `pnpm build` 통과

### Checkpoint D: Final recovered baseline

목표:

- 직접 수정 영역 + 인접 핵심 플로우 테스트 통과
- recovered scope / deferred scope 문서 반영

검증:

```bash
pnpm typecheck
pnpm test src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run
pnpm build
```

최종 복구 기준선 결과:

- `pnpm typecheck` 통과
- `pnpm build` 통과
- 핵심 사용자 흐름 테스트 통과
  - `/projects/new`
  - `/projects/[projectId]`
  - `/projects/[projectId]/issues/[issueId]`
- 남은 경고는 webpack asset size warning이며, 현재 턴의 빌드 실패 원인은 아니다.

## 3. Handoff checklist

- 복구 범위와 제외 범위를 문서에 남겼는가?
- 각 의미 있는 변경 묶음마다 검증 결과를 남겼는가?
- `build`, `typecheck`, 영향받은 핵심 테스트가 최종 기준을 만족하는가?
- “임시 삭제” 대신 실제 복구인지 설명할 수 있는가?

## 4. Handoff prompts

- 다음 작업자가 10분 안에 recovered scope와 deferred scope를 구분할 수 있는가?
- 다음 체크포인트에서 반드시 다시 돌려야 하는 명령을 이 문서만 보고 실행할 수 있는가?
- 남은 위험이 build blocker인지, warning인지, follow-up인지 명확히 적혀 있는가?
