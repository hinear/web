# Hinear

Project-first issue management app.

Current direction:

- `Next.js` App Router
- `Supabase` for data and auth
- `Firebase Cloud Messaging` for web push only
- `PWA` installability
- `Vitest + Testing Library` for TDD

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
```

## Environment

Copy `.env.example` to `.env.local` and fill in the values you need.

Current app request flow expects Supabase auth cookies for authenticated writes.

Primary app requests no longer use `HINEAR_ACTOR_ID` as a server-action fallback.

Auth bootstrap routes are now present:

- `/auth`
- `/auth/confirm`

## CI/CD

GitHub Actions is configured for:

- `CI`
  - runs on every push and pull request
  - `Verify` is the required merge baseline check
  - installs dependencies, then runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
  - includes `Workflow Governance` and `Dependency Risk` guardrail jobs for workflow/dependency changes
  - includes `MCP Smoke` as an optional secrets-gated check (skips when required secrets are missing)
- `Performance Diagnostics (Optional)`
  - runs on manual dispatch and weekly schedule
  - runs real performance suite + bundle analysis and uploads artifacts
  - intentionally non-required for merge

Deployment is expected to use Vercel Git Integration:

- pull requests create Vercel preview deployments
- pushes to `main` trigger Vercel production deployments

No GitHub Actions Vercel deploy workflow is checked in right now to avoid duplicating Vercel's default deployment pipeline.

### Failure Response (Maintainers)

- `Verify` failure: treat as merge-blocking, fix code or tests before merge
- `Workflow Governance` failure: remove placeholder logic or restore required workflow/job naming stability
- `Dependency Risk` failure: update lockfile with manifest changes and avoid wildcard/latest dependency pins
- `MCP Smoke` skipped: expected in repositories/forks without secrets
- `MCP Smoke` failure (when secrets exist): investigate MCP env resolution and rerun after fix
- `Performance Diagnostics (Optional)` failure: investigate as tech-debt/perf signal, not as a branch-protection blocker

## Docs

- `docs/issue-detail/overview.md`
- `docs/issue-detail/roadmap.md`
- `docs/issue-detail/project-model.md`
- `docs/issue-detail/pwa-firebase-notifications.md`

## First Focus

- **이슈 보드 (칸반)** - Linear 스타일의 칸반 보드로 이슈 관리
- personal/team project model
- project-scoped issue identifiers
- **이슈 생성** - Create Issue Modal/Page
- issue detail page
- activity log with before/after tracking
- invitation flow

## Current App Flow

- `/projects/new`
- `/projects/[projectId]` (Kanban board)
- Create issue → opens in **drawer**
- `/projects/[projectId]/issues/[issueId]` (full page detail, accessible from drawer)

## Implementation TODO

### Critical (보안)

- [ ] **service-role 클라이언트 제거**: 모든 Repository를 session-aware 서버 클라이언트로 교체 (현재 RLS 우회 중)
- [ ] **HINEAR_ACTOR_ID 제거**: 임시 actor fallback 환경변수 삭제
- [ ] **GitHub webhook 시크릿 검증**: 웹훅 엔드포인트 보안 강화
- [ ] **파일 첨부 접근 제어**: 이슈 첨부파일 RLS 정책 구현

### High Priority (핵심 기능)

- [ ] **알림 시스템 완성**: 푸시/이메일 알림 라우팅, 타겟 필터링, 환경설정 API
- [ ] **GitHub 웹훅 구현**: `/api/github/webhooks` 라우트 + 양방향 동기화
- [ ] **GitHub OAuth 플로우 완료**: 리포지토리 선택 후 연결 완료 처리
- [ ] **Mention 시스템**: `@username` 멘션 (댓글, 이슈 설명)
- [ ] **이슈 구독**: 특정 이슈 구독 및 알림 수신
- [ ] **낙관적 잠금(Optimistic Locking)**: 동시 편집 충돌 해결

### Medium Priority (기능 확장)

- [ ] **이슈 템플릿**: 프로젝트별 이슈 생성 템플릿
- [ ] **고급 필터링**: 상태 + 담당자 + 라벨 + 우선순위 복합 필터
- [ ] **이슈 관계**: 하위 태스크, 의존성, 순환 참조 감지
- [ ] **프로젝트 보관**: 아카이브 기능 (현재 에러만 반환)
- [ ] **댓글 스레드**: 마이그레이션 존재, UI 구현 필요
- [ ] **이슈 클론/복제**: 이슈 복제 기능
- [ ] **이슈 핀/즐겨찾기**: 중요 이슈 고정

### Low Priority (UX / Polish)

- [ ] **로딩/에러 상태 개선**: 제네릭 상태 → 구체적 UI 교체
- [ ] **반응형 드로어**: 태블릿 드로어 / 모바일 풀페이지 분기
- [ ] **빈 상태 UI**: 빈 목록/보드 개선
- [ ] **PWA 설치 UX**: 설치 유도 플로우
- [ ] **다크 모드**
- [ ] **대시보드/리포트**: 프로젝트 통계 및 차트
- [ ] **이슈 내보내기/가져오기**: CSV/JSON
- [ ] **주간 요약**: 변경사항 요약 리포트

### Performance

- [ ] **LCP 스파이크 원인 파악**: 간헐적 2.3s LCP 원인 조사
- [ ] **성능 메트릭 기록**: `recordMetric()` / `recordMetrics()` 구현
- [ ] **번들 사이즈 최적화**: webpack asset size warning 해결
