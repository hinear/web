# Recovery Validation Contract

## Purpose

이 계약은 `005-rebuild-003-build` 브랜치에서 어떤 검증이 “체크포인트 통과”와 “복구 완료”를 의미하는지 고정한다.

## Entry Conditions

- 복구 대상 의미 있는 변경 묶음이 식별되어 있어야 한다.
- 직접 수정 영역과 인접 핵심 플로우 테스트 범위가 정리되어 있어야 한다.
- 이전 체크포인트의 실패가 미해결 상태라면 다음 체크포인트를 시작할 수 없다.
- `pnpm typecheck`는 항상 `next typegen && tsc --noEmit -p tsconfig.typecheck.json` 기준으로 실행한다.

## Affected Critical Test Set

이번 복구 브랜치의 핵심 테스트 세트는 아래로 고정한다.

### Directly Modified Area Tests

- `tests/performance/bottleneck-tracker.test.ts`
- `tests/performance/regression.test.ts`
- `src/lib/react-query/query-provider.test.tsx`
- `src/lib/supabase/use-supabase-client.test.tsx`

### Adjacent Critical Flow Tests

- `src/features/projects/actions/create-project-action.test.ts`
- `src/features/projects/components/project-overview-screen.test.tsx`
- `src/features/issues/components/issue-detail-screen.test.tsx`
- `src/app/api/issues/[issueId]/route.test.ts`

### Standard Checkpoint Commands

```bash
pnpm typecheck
pnpm build
pnpm test tests/performance/bottleneck-tracker.test.ts tests/performance/regression.test.ts src/lib/react-query/query-provider.test.tsx src/lib/supabase/use-supabase-client.test.tsx src/features/projects/actions/create-project-action.test.ts src/features/projects/components/project-overview-screen.test.tsx src/features/issues/components/issue-detail-screen.test.tsx 'src/app/api/issues/[issueId]/route.test.ts' --run
```

## Checkpoint Validation

각 체크포인트는 아래를 기록해야 한다.

1. 변경한 영역 또는 사용자 흐름
2. `pnpm typecheck` 결과
3. `pnpm build` 결과
4. 직접 수정 영역 테스트 결과
5. 인접 핵심 플로우 테스트 결과 또는 생략 사유

## Completion Validation

복구 완료로 인정되려면 아래 조건을 모두 만족해야 한다.

1. `pnpm build` 통과
2. `pnpm typecheck` 통과
3. 직접 수정 영역과 인접 핵심 플로우 테스트가 통과하거나, 남은 실패가 이번 복구 범위 밖임이 명시됨
4. 003 의도와 사용자 가치가 임시 삭제 없이 유지됨
5. deferred work와 recovered baseline이 문서에 기록됨

## Failure Handling

- 체크포인트에서 `build` 또는 `typecheck`가 실패하면 다음 단계로 진행하지 않는다.
- 테스트 실패는 직접 수정 영역인지, 인접 핵심 플로우인지, 범위 밖 기존 이슈인지를 분류해야 한다.
- 범위 밖 이슈는 follow-up으로 남길 수 있지만, 이번 복구 완료 기준을 깨는 이슈는 defer할 수 없다.

## Current Result

- Checkpoint A: dependency/config repair 완료
- Checkpoint B: source graph / generated type alignment 완료
- Checkpoint C: 003 performance module and provider repair 완료
- Final baseline: `pnpm typecheck`, `pnpm build`, 핵심 테스트 세트 통과

현재 문서 기준 deferred 항목은 release-blocking build failure가 아니라, 번들 크기 경고와 후속 구조 개선 메모다.
