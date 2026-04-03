# Service-Role 클라이언트 제거 계획

## Context

현재 `createServiceRoleSupabaseClient()`가 사용자 요청 경로에서 사용되고 있어 RLS가 우회되고 있다. 대부분의 리포지토리는 이미 session-aware로 전환되었고 `HINEAR_ACTOR_ID`도 제거된 상태. 남은 파일들을 정리해서 **사용자 요청 경로에서 service-role을 완전히 제거**하는 것이 목표.

## 전체 서비스-역할 사용처 (12개 파일)

### 사용자 요청 경로 → 반드시 전환 (4개)

| 파일 | 설명 | 조치 |
|---|---|---|
| `src/features/issues/lib/issue-detail-loader.ts` | 이슈 상세 페이지 로더 | session-aware 전환 |
| `src/features/issues/lib/issue-drawer-loader.ts` | 이슈 드로어 로더 | session-aware 전환 |
| `src/features/performance/repositories/performance-metrics-repository.ts` | 성능 모니터링 리포지토리 | 생성자 주입 + 팩토리 패턴 |
| `src/app/invite/[token]/page.tsx` | 초대 페이지 | 비인증 경로, 별도 검토 |

### 시스템 경로 → service-role 유지 (6개)

| 파일 | 설명 | 이유 |
|---|---|---|
| `src/app/api/notifications/send/route.ts` | 푸시 알림 전송 | cross-user 구독 조회 필요 |
| `src/lib/notifications/triggers.ts` | 알림 트리거 | cross-user 구독 조회 필요 |
| `src/lib/notifications/find-user-id-by-email.ts` | 이메일→사용자ID 조회 | cross-user 조회 |
| `src/app/api/mcp/oauth/token/route.ts` | MCP OAuth 토큰 교환 | machine-to-machine, 세션 없음 |
| `src/app/internal/issues/[issueId]/github/branch/route.ts` | GitHub 브랜치 API | 내부 API |
| `src/app/api/dev/e2e-login/route.ts` | 개발용 테스트 로그인 | dev-only 인프라 |

### 정의/테스트 (2개)

- `src/lib/supabase/server-client.ts` — 함수 정의 (유지)
- `src/lib/supabase/rls-verification.test.ts` — RLS 검증 테스트 (유지)

---

## Step 1: issue-detail-loader.ts 전환

**파일**: `src/features/issues/lib/issue-detail-loader.ts`

**현재 코드**:
```typescript
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";
// ...
const supabase = createServiceRoleSupabaseClient();
```

**변경 후**:
```typescript
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";
// ...
const supabase = await createRequestSupabaseServerClient();
```

**전제조건**: `labels` 테이블에 프로젝트 멤버 SELECT RLS 정책이 있어야 함. 없으면 빈 결과 반환 → 에러 발생. RLS 정책 확인 필요.

## Step 2: issue-drawer-loader.ts 전환

**파일**: `src/features/issues/lib/issue-drawer-loader.ts`

issue-detail-loader와 동일한 패턴:

```typescript
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";
// ...
const supabase = await createRequestSupabaseServerClient();
```

## Step 3: performance-metrics-repository.ts 리팩토링

**파일**: `src/features/performance/repositories/performance-metrics-repository.ts`

### A. 클래스를 생성자 주입으로 변경

```typescript
// Before:
export class PerformanceMetricsRepository {
  private supabase = createServiceRoleSupabaseClient();
  // ...
}
export const performanceMetricsRepository = new PerformanceMetricsRepository();

// After:
export class PerformanceMetricsRepository {
  constructor(private supabase: AppSupabaseServerClient) {}
  // ...
}
```

### B. `(this.supabase as any)` → `this.supabase` 타입 캐스팅 제거

### C. 팩토리 함수 추가

**신규 파일**: `src/features/performance/repositories/server-performance-metrics-repository.ts`

```typescript
import "server-only";
import { PerformanceMetricsRepository } from "./performance-metrics-repository";
import { createServiceRoleSupabaseClient, type AppSupabaseServerClient } from "@/lib/supabase/server-client";

// Performance monitoring requires system-wide visibility.
// Admin/system-level feature using service-role access.
export function getServerPerformanceMetricsRepository(): PerformanceMetricsRepository {
  return new PerformanceMetricsRepository(createServiceRoleSupabaseClient());
}
```

### D. 소비자 업데이트 (8개 파일)

기존:
```typescript
import { performanceMetricsRepository } from "../repositories/performance-metrics-repository";
const metrics = await performanceMetricsRepository.getMetricsByTimeRange(...);
```

변경:
```typescript
import { getServerPerformanceMetricsRepository } from "../repositories/server-performance-metrics-repository";
const repository = getServerPerformanceMetricsRepository();
const metrics = await repository.getMetricsByTimeRange(...);
```

소비자 파일 목록:
- `src/features/performance/actions/generate-performance-report-action.ts`
- `src/features/performance/actions/record-optimization-action.ts`
- `src/features/performance/actions/set-baseline-action.ts`
- `src/features/performance/actions/get-performance-report-action.ts`
- `src/features/performance/actions/identify-bottlenecks-action.ts`
- `src/features/performance/lib/bottleneck-tracker.ts`
- `src/features/performance/lib/baseline-manager.ts`
- `src/features/performance/lib/regression-detector.ts`

## Step 4: invite/[token]/page.tsx 검토

**파일**: `src/app/invite/[token]/page.tsx`

비인증 사용자가 접근하는 페이지. 세션이 없으므로 session-aware 전환이 불가능.
초대 토큰 자체가 인증 수단이므로 service-role 유지가 합리적.
**주석만 추가**하여 의도를 명시:

```typescript
// Service-role required: invite page is accessed by unauthenticated users.
// The invite token itself serves as the access control mechanism.
const supabase = createServiceRoleSupabaseClient();
```

## Step 5: CLAUDE.md 보안 경고 업데이트

`CLAUDE.md`의 "Current Security Warning" 섹션을 업데이트:

```markdown
### Security Status
사용자 요청 경로에서 service-role 클라이언트 사용이 제거되었습니다.
service-role은 다음 시스템 경로에서만 사용됩니다:
- 알림 전송 (cross-user 구독 조회)
- MCP OAuth 토큰 교환 (machine-to-machine)
- 초대 페이지 (비인증 경로, 토큰 기반 접근 제어)
- 개발용 테스트 로그인
- 내부 GitHub API
```

## Step 6: 검증

```bash
pnpm typecheck
pnpm lint
pnpm test
```

수동 확인:
- `/projects/{id}/issues/{id}` — 라벨, 댓글, 활동 로그 로드 확인
- `/projects/{id}` — 이슈 드로어 열기 확인
- `/invite/{token}` — 초대 페이지 정상 동작 확인
- `grep -rn "createServiceRoleSupabaseClient" src/features/` — loader 2개 파일에서 결과 없어야 함

---

## 순서 및 의존성

```
RLS 정책 확인 (labels, issues, comments, activity_logs)
    ↓
Step 1 (issue-detail-loader) ──┐
Step 2 (issue-drawer-loader) ──┤  병렬 가능
Step 3 (performance repo)    ──┘
    ↓
Step 4 (invite 주석)
Step 5 (CLAUDE.md)
Step 6 (검증)
```

## 참조 파일

- `src/lib/supabase/server-client.ts` — 클라이언트 팩토리 정의
- `src/lib/supabase/server-auth.ts` — 인증 헬퍼 (getAuthenticatedActorIdOrNull)
- `src/features/projects/repositories/server-projects-repository.ts` — 기존 팩토리 패턴 참조
- `src/features/issues/repositories/supabase-issues-repository.ts` — 생성자 주입 패턴 참조
