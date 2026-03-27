# Session Handoff

## 2026-03-27 Update

`005-rebuild-003-build` 브랜치의 003 복구 baseline은 현재 실제로 통과하는 상태다.

- `pnpm typecheck` 통과
  - 현재 기준 명령은 `next typegen && tsc --noEmit -p tsconfig.typecheck.json`
- `pnpm build` 통과
- affected critical tests 통과
  - `tests/performance/bottleneck-tracker.test.ts`
  - `tests/performance/regression.test.ts`
  - `src/lib/react-query/query-provider.test.tsx`
  - `src/lib/supabase/use-supabase-client.test.tsx`
  - `src/features/projects/actions/create-project-action.test.ts`
  - `src/features/projects/components/project-overview-screen.test.tsx`
  - `src/features/issues/components/issue-detail-screen.test.tsx`
  - `src/app/api/issues/[issueId]/route.test.ts`
  - 결과: 8 files, 19 tests passed

이번 복구에서 핵심으로 정리된 내용:

- `@next/bundle-analyzer`, `web-vitals` 의존성 누락 복구
- stale `.next/dev/types`에만 남아 있던 MCP token route 참조 분리
- performance repository / bottleneck tracker / regression detector 계약 정렬
- React Query provider typing 및 Supabase browser client hook 추가
- `/projects/new` → `/projects/[projectId]` → `/projects/[projectId]/issues/[issueId]` 핵심 흐름 유지 확인

현재 deferred:

- webpack asset size warnings
- issue detail privileged read-path 단순화
- 오래된 003 문서와 recovered baseline의 전면 동기화

## 2026-03-26 Update

이 문서의 오래된 GitHub integration / Supabase MCP 메모는 아래 최신 사실로 덮어쓴다.

- Supabase MCP는 이 세션에서 정상 동작했고, 원격 스키마 조회와 마이그레이션 적용이 가능했다.
- 원격 Supabase에는 GitHub 연동용 컬럼이 반영되었다.
  - `projects.github_repo_owner`
  - `projects.github_repo_name`
  - `projects.github_integration_enabled`
  - `issues.github_issue_id`
  - `issues.github_issue_number`
  - `issues.github_synced_at`
  - `issues.github_sync_status`
- `projects.github_access_token`, `projects.github_webhook_secret` 같은 평문 비밀 저장 컬럼은 추가하지 않았다.
- 현재 GitHub issue sync는 GitHub App installation token 기반이다.
- 서버에는 `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` 환경변수가 필요하다.
- 프로젝트 설정 페이지의 GitHub 연결은 "repo 메타데이터 저장 + one-way issue sync 준비" 수준까지 구현되었다.
- `/api/github/repositories` 와 `/api/projects/[projectId]/github` 라우트는 존재한다.
- GitHub OAuth 완료 후 `/projects/[projectId]/settings?github=select-repo` 로 복귀하면 저장소 선택 UI가 자동으로 열린다.
- 이미 GitHub issue가 연결된 Hinear 이슈는 update path에서도 GitHub issue update를 백그라운드로 시도한다.
- `/api/github/webhooks` 는 아직 구현되지 않았다.
- 따라서 GitHub integration은 "초기 연결 + Hinear → GitHub one-way sync 기반" 까지가 최신 범위다.

## 2026-03-25 Update

이 문서의 초기 내용은 2026-03-21~2026-03-23 기준 메모가 많아서, 아래 항목을 현재 기준 최신 사실로 우선 본다.

- 이슈 상세 풀페이지/드로어의 라벨 편집이 동작한다.
- 이슈 상세 초기 로드에서 activity log와 project label 목록이 함께 내려온다.
- 이슈 상세 날짜/상대시간 포맷은 공통 유틸로 정리되었고 hydration mismatch 방어가 들어가 있다.
- 데스크톱/모바일 이슈 생성 화면 모두 `LabelSelector` 기반 라벨 선택/생성을 지원한다.
- `CreateIssueTabletModal`의 라벨 조회 무한 호출 버그는 수정되었다.
- `BatchActionBar`는 서버 액션 테스트와 UI 테스트가 모두 추가되었다.
- 칸반 보드 검색/필터는 URL 쿼리와 동기화되며, `POST /api/issues/search`를 통해 서버 검색 + 서버 필터링까지 연결된다.
- 외부 API 라우트가 확장되었다.
  - `/api/issues/search`
  - `/api/issues/[issueId]`
  - `/api/issues/[issueId]/comments`
  - `/api/projects/[projectId]/members`
  - `/api/users/[userId]/projects`
  - `/api/members/check-access`
  - `/api/notifications/preferences`
  - `/api/notifications/subscribe`
  - `/api/notifications/unsubscribe`
- 알림 설정 카드는 실제 API(`/api/notifications/preferences`)와 연결되어 저장된다.
- primary request path는 대부분 세션 인식 Supabase client를 쓰지만, 이슈 상세 읽기 경로 `loadIssueDetail()`만 `service-role + 명시적 멤버십 체크` 예외 경로를 사용한다.
- 따라서 아래의 오래된 “service-role 완전 제거” 표현은 현재 기준으로는 예외가 하나 남아 있다고 이해해야 한다.

## Current Branch

- `005-rebuild-003-build`

## What Was Completed

- Next.js app scaffolded and verified
- PWA metadata added
- TDD tooling added with Vitest and Testing Library
- `project -> issue` domain direction documented
- `owner/member` permission model documented
- activity log `from/to` tracking documented
- initial Supabase schema draft added
- project key validation and issue identifier utilities added
- project creation and issue creation input contracts added
- Supabase MCP connection verified in this session
- remote Supabase migrations applied
  - `initial_project_issue_schema`
  - `schema_lint_fixes`
  - `add_issue_labels`
- Supabase env/client helpers added under `src/lib/supabase/`
- Supabase-backed repository implementations added for projects/issues
- `@supabase/supabase-js` dependency added
- `Biome` replaced the previous `eslint` setup
- `husky + lint-staged` now run `biome check --write` on pre-commit
- minimal app flow is now wired end-to-end
  - `/projects/new`
  - `/projects/[projectId]`
  - `/projects/[projectId]/issues/[issueId]`
- flow tests were added for:
  - project creation flow
  - issue creation flow
  - project create screen
  - project workspace screen
  - issue detail screen
- GitHub Actions CI is enabled
- Vercel deployment is expected to use Git Integration instead of GitHub CLI deploy workflows
- **MSW mocking infrastructure added** (2025-03-20)
  - MSW 패키지 설치 및 설정 완료
  - Mock 데이터와 API 핸들러 구현 (`src/mocks/`)
  - 테스트 환경과 브라우저 환경 모두 지원
- **Kanban Board UI implemented** (2025-03-20)
  - 6개 컬럼 (Triage, Backlog, Todo, In Progress, Done, Canceled)
  - 드래그앤드롭으로 상태 변경 (dnd-kit)
  - Issue Card 컴포넌트 (identifier, 제목, 우선순위, 라벨, 담당자)
  - 프로젝트 페이지에 통합 완료
  - 현재는 internal route handler + Supabase issue source로 동작
- **Pen-based UI primitives and Storybook added** (2026-03-20)
  - `pen/components.pen`, `pen/Hinear.pen` 토큰을 `src/app/globals.css`의 `@theme`에 정리
  - 전역 수기 CSS 클래스와 `:root` 별칭 제거, 토큰 중심 구조로 정리
  - Storybook 설정 추가 및 primitive별 스토리 작성
  - 구현 완료 primitive:
    - `Button`
    - `Chip`
    - `Field`
    - `Select`
    - `SidebarItem`
    - `ProjectSelect`
    - `HeaderAction`
    - `HeaderSearchField`
    - `BoardAddCard`
    - `Avatar`
  - 구현 기준 및 사용 규칙은 `docs/ui-primitives.md`에 정리
- **Atomic component restructure and pen section rollout** (2026-03-20)
  - `src/components/primitives/*`를 `src/components/atoms`, `src/components/molecules`, `src/components/organisms`로 재구성
  - `CountBadge`, `BoardColumnHeader`, `MobileIssueListAppBar` 추가
  - `LinearDashboardHeader`, `MobileIssueSections`를 실제 board 화면에 연결
  - board drag/drop 상태를 `8BMOL` 기준으로 overlay / hover lane / placeholder까지 보강
  - organism 추가:
    - `DrawerIssueDetailPanel`
    - `CreateIssueTabletModal`
    - `AuthForm`
    - `IssueDetailStateVariations`
    - `CreateProjectSection`
    - `ProjectOperationsSection`
  - 실제 route 연결 완료:
    - `CreateProjectSection`
    - `ProjectOperationsSection`
    - `CreateIssueTabletModal` via `project-issue-create-panel`
    - issue detail route `loading / error / not-found`
  - auth-bound server wiring 추가:
    - request-bound Supabase SSR client
    - authenticated actor lookup
    - user-facing action path에서 `HINEAR_ACTOR_ID` 제거
  - auth bootstrap 추가:
    - `/auth` magic-link entry
    - `/auth/confirm` callback route
    - `proxy.ts` session refresh path
    - unauthenticated action redirect to `/auth?next=...`
    - unauthenticated route protection for project / issue pages
    - auth notice messaging for required login / expired session states
  - labels persistence 추가:
    - `labels`, `issue_labels` schema + RLS
    - create issue action parses comma-separated labels
    - issue detail route now renders persisted labels
- **테스트 hang 문제 해결 및 Conflict UX 개선** (2026-03-21)
  - `issue-detail-screen.test.tsx` hang 문제 분석 및 해결
    - 원인: `useTransition` + jsdom 환경 호환성 문제
    - 초기 해결: Problematic async 테스트 2개를 `.skip` 처리
    - MSW handler cleanup 패턴 추가 (`afterEach(() => server.resetHandlers())`)
  - MSW handlers에 `/internal/issues/*` 경로 추가
    - `PATCH /internal/issues/:issueId/detail` - Issue detail update with optimistic locking
    - `POST /internal/issues/:issueId/comments` - Comment creation
  - **ConflictDialog molecule 컴포넌트 추가**
    - 기존 Button atom 활용한 conflict dialog UI
    - 버전 정보 비교 표시 (요청한 버전 vs 현재 버전)
    - `src/components/molecules/ConflictDialog/` 구조
    - Storybook stories 추가 (Default, LargeVersionGap 시나리오)
  - **타입 안전성 개선**
    - MSW handlers에서 `status`, `priority` 타입 캐스팅 추가
    - `as Issue["status"]`, `as Issue["priority"]` 사용
- **Mutation failure message 정리 및 browser test 전환** (2026-03-21)
  - issue detail / comment / board update route에 `code + status` 기반 에러 응답 추가
  - 공통 사용자 메시지 매퍼 추가
    - `src/features/issues/lib/mutation-error-messages.ts`
  - issue detail 화면이 raw server message 대신 사용자용 에러 문구를 사용하도록 정리
  - board update route도 detail/comments와 같은 에러 코드 체계로 통일
  - skipped 되어 있던 `issue-detail-screen` async mutation 테스트 2개를 browser Playwright 기반 Vitest 테스트로 이동
    - `src/features/issues/components/issue-detail-screen.browser.test.tsx`
  - browser 테스트 도중 드러난 `IssueDetailScreen` 기본 배열 prop 무한 업데이트 버그 수정
    - `comments = []`, `activityLog = []` 기본값을 공유 상수로 전환
- **Project workspace / settings flow 마감** (2026-03-21)
  - `/projects/[projectId]`는 실제 project/issues/members/invitations read model을 사용한다
  - workspace summary는 issue/member/invitation count를 실제 데이터로 표시한다
  - invitation send / resend / revoke / accept, member remove가 실제 server action과 repository 경로를 탄다
  - `/projects/[projectId]/settings` 전용 route가 추가되어 access 관리 UI를 workspace에서 분리했다
  - settings 화면에서 project metadata (`name`, `key`, `type`) 수정이 가능하다
  - `team -> personal` 전환은 추가 멤버 또는 pending invitation이 남아 있으면 danger zone 정책으로 차단된다
- **PWA 알림 시스템 구현** (2026-03-23)
  - Service Worker for push notification handling (`public/sw.js`)
  - PWA manifest configuration for standalone app support
  - Service Worker auto-registration in root layout
  - VAPID key configuration for web push authentication
  - 4가지 알림 타입 구현:
    - Issue assignment notifications
    - Issue status change notifications
    - Comment added notifications
    - Project invitation notifications
  - 알림 컴포넌트:
    - `NotificationPermissionButton`: 알림 권한 요청 및 푸시 구독
    - `NotificationSettingsCard`: 설정 UI (프로젝트 설정 페이지에 통합)
  - API 라우트:
    - `/api/notifications/subscribe`: 푸시 구독 처리
    - `/api/notifications/send`: 알림 전송 (타입별 페이로드 생성)
  - 알림 트리거 함수 (`src/lib/notifications/triggers.ts`):
    - `triggerIssueAssignedNotification`
    - `triggerIssueStatusChangedNotification`
    - `triggerCommentAddedNotification`
    - `triggerProjectInvitedNotification`
  - 이슈 업데이트 API와 통합:
    - 상태 변경 시 자동 알림 전송
    - 담당자 할당 변경 시 자동 알림 전송
    - 비동기 non-blocking 전송으로 UX 저하 방지
  - 기술 구현:
    - `web-push` library for VAPID authentication
    - Base64 URL-safe encoding for applicationServerKey
    - Proper BufferSource typing for TypeScript
    - 환경 변수로 VAPID 키 관리
- **Supabase DB 마이그레이션 추가** (2026-03-23)
  - `0007_add_push_notification_subscriptions.sql`: 푸시 알림 구독 저장 테이블
    - `push_subscriptions` 테이블 (user_id, endpoint, p256dh_key, auth_key)
    - RLS 정책: 사용자는 자신의 구독만 관리 가능
    - 인덱스: user_id, endpoint
  - `0008_add_notification_preferences.sql`: 사용자별 알림 설정 테이블
    - `notification_preferences` 테이블 (issue_assigned, issue_status_changed, comment_added, project_invited)
    - `get_or_create_notification_preferences` RPC 함수
    - RLS 정책: 사용자는 자신의 설정만 관리 가능
- **Supabase MCP 서버 설정** (2026-03-23)
  - `.mcp.json`에 Supabase MCP 서버 추가
  - 프로젝트 ref: `pmyrrckkiomjwjqntymr`
  - 2026-03-26 기준 현재 Codex 세션에서 MCP 호출이 정상 응답한다

## Key Files

- [docs/todo.md](/Users/choiho/zerone/hinear/docs/todo.md)
- [docs/ui-primitives.md](/Users/choiho/zerone/hinear/docs/ui-primitives.md)
- [docs/logs/2026-03-20.md](/Users/choiho/zerone/hinear/docs/logs/2026-03-20.md)
- [docs/issue-detail/project-model.md](/Users/choiho/zerone/hinear/docs/issue-detail/project-model.md)
- [docs/issue-detail/contracts.md](/Users/choiho/zerone/hinear/docs/issue-detail/contracts.md)
- [docs/issue-detail/supabase-schema.md](/Users/choiho/zerone/hinear/docs/issue-detail/supabase-schema.md)
- [supabase/migrations/0001_initial_project_issue_schema.sql](/Users/choiho/zerone/hinear/supabase/migrations/0001_initial_project_issue_schema.sql)
- [supabase/migrations/0002_schema_lint_fixes.sql](/Users/choiho/zerone/hinear/supabase/migrations/0002_schema_lint_fixes.sql)
- [src/features/projects/contracts.ts](/Users/choiho/zerone/hinear/src/features/projects/contracts.ts)
- [src/features/projects/lib/create-project.ts](/Users/choiho/zerone/hinear/src/features/projects/lib/create-project.ts)
- [src/features/issues/contracts.ts](/Users/choiho/zerone/hinear/src/features/issues/contracts.ts)
- [src/features/issues/lib/create-issue.ts](/Users/choiho/zerone/hinear/src/features/issues/lib/create-issue.ts)
- [src/lib/supabase/env.ts](/Users/choiho/zerone/hinear/src/lib/supabase/env.ts)
- [src/lib/supabase/server-client.ts](/Users/choiho/zerone/hinear/src/lib/supabase/server-client.ts)
- [src/features/projects/repositories/supabase-projects-repository.ts](/Users/choiho/zerone/hinear/src/features/projects/repositories/supabase-projects-repository.ts)
- [src/features/issues/repositories/supabase-issues-repository.ts](/Users/choiho/zerone/hinear/src/features/issues/repositories/supabase-issues-repository.ts)
- [src/features/projects/lib/create-project-flow.ts](/Users/choiho/zerone/hinear/src/features/projects/lib/create-project-flow.ts)
- [src/features/issues/lib/create-issue-flow.ts](/Users/choiho/zerone/hinear/src/features/issues/lib/create-issue-flow.ts)
- [src/features/projects/actions/create-project-action.ts](/Users/choiho/zerone/hinear/src/features/projects/actions/create-project-action.ts)
- [src/features/issues/actions/create-issue-action.ts](/Users/choiho/zerone/hinear/src/features/issues/actions/create-issue-action.ts)
- [src/features/issues/lib/mutation-error-messages.ts](/Users/choiho/zerone/hinear/src/features/issues/lib/mutation-error-messages.ts)
- [src/features/issues/components/issue-detail-screen.browser.test.tsx](/Users/choiho/zerone/hinear/src/features/issues/components/issue-detail-screen.browser.test.tsx)
- [src/app/projects/new/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/new/page.tsx)
- [src/app/projects/[projectId]/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/page.tsx)
- [src/app/projects/[projectId]/issues/[issueId]/page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/issues/[issueId]/page.tsx)
- PWA Notification System:
  - [public/sw.js](/Users/choiho/zerone/hinear/public/sw.js) - Service Worker for push notifications
  - [public/manifest.webmanifest](/Users/choiho/zerone/hinear/public/manifest.webmanifest) - PWA manifest
  - [src/features/notifications/types.ts](/Users/choiho/zerone/hinear/src/features/notifications/types.ts) - Notification type definitions
  - [src/features/notifications/components/NotificationPermissionButton.tsx](/Users/choiho/zerone/hinear/src/features/notifications/components/NotificationPermissionButton.tsx) - Permission request UI
  - [src/features/notifications/components/NotificationSettingsCard.tsx](/Users/choiho/zerone/hinear/src/features/notifications/components/NotificationSettingsCard.tsx) - Settings UI with toggles
  - [src/features/notifications/repositories/supabase-push-subscriptions-repository.ts](/Users/choiho/zerone/hinear/src/features/notifications/repositories/supabase-push-subscriptions-repository.ts) - Push subscriptions repository
  - [src/features/notifications/repositories/supabase-notification-preferences-repository.ts](/Users/choiho/zerone/hinear/src/features/notifications/repositories/supabase-notification-preferences-repository.ts) - Notification preferences repository
  - [src/app/api/notifications/subscribe/route.ts](/Users/choiho/zerone/hinear/src/app/api/notifications/subscribe/route.ts) - Subscription endpoint (now uses DB)
  - [src/app/api/notifications/send/route.ts](/Users/choiho/zerone/hinear/src/app/api/notifications/send/route.ts) - Send notification endpoint (with target filtering)
  - [src/lib/notifications/triggers.ts](/Users/choiho/zerone/hinear/src/lib/notifications/triggers.ts) - Notification trigger functions
  - [src/lib/notifications/push.ts](/Users/choiho/zerone/hinear/src/lib/notifications/push.ts) - Push notification utilities
  - [src/components/organisms/ServiceWorkerRegister.tsx](/Users/choiho/zerone/hinear/src/components/organisms/ServiceWorkerRegister.tsx) - SW registration
- Database Migrations (Applied 2026-03-23):
  - [supabase/migrations/0007_add_push_notification_subscriptions.sql](/Users/choiho/zerone/hinear/supabase/migrations/0007_add_push_notification_subscriptions.sql) ✅ Applied
  - [supabase/migrations/0008_add_notification_preferences.sql](/Users/choiho/zerone/hinear/supabase/migrations/0008_add_notification_preferences.sql) ✅ Applied
- MCP Configuration:
  - [.mcp.json](/Users/choiho/zerone/hinear/.mcp.json) - Supabase MCP server configuration ✅ Authenticated

## Checks Last Run

These passed before handoff:

- `biome check .`
- `tsc --noEmit`
- `vitest run`
- `next build`

In this environment, `pnpm` was not on PATH in the later session, so checks were run via:

- `/opt/homebrew/bin/npm exec pnpm lint`
- `/opt/homebrew/bin/node ./node_modules/typescript/bin/tsc --noEmit`
- `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run`

Additional UI check run in this session:

- `npm run build-storybook`
- later UI refactor/implementation turns were verified with:
  - `git diff --check`
- mutation failure / route/browser coverage turn was verified with:
  - `npm exec pnpm typecheck`
  - `npm exec pnpm test 'src/app/internal/issues/[issueId]/route.test.ts' 'src/app/internal/issues/[issueId]/detail/route.test.ts' 'src/app/internal/issues/[issueId]/comments/route.test.ts' 'src/features/issues/lib/mutation-error-messages.test.ts' --run`
  - `node ./node_modules/vitest/vitest.mjs run --project browser src/features/issues/components/issue-detail-screen.browser.test.tsx`

## Current State

- Historical note: an older session temporarily saw `Auth required` from MCP tool calls, but that is no longer the current state.
- remote project URL: `https://pmyrrckkiomjwjqntymr.supabase.co`
- remote migrations currently present:
  - `initial_project_issue_schema`
  - `schema_lint_fixes`
  - `add_issue_labels`
  - `add_version_for_optimistic_locking`
- `0004_add_version_for_optimistic_locking.sql` is now applied remotely after Supabase MCP auth was verified with live read calls in a fresh session
- security advisor warnings are cleared
- performance advisor currently shows only `unused_index` information
- main app flow currently works as:
  - create project
  - land on project workspace
  - create issue from desktop modal / mobile page
  - open issue detail full page / drawer
  - edit labels in detail full page and drawer
  - use board search + filter via server-backed API

## Current Priorities

- 알림 실제 전달(푸시/이메일) 경로를 프로덕션 기준으로 끝까지 연결
- `loadIssueDetail()`의 `service-role` 예외 경로를 다시 세션 인식 읽기 모델로 단순화할지 검토
- 검색/필터 저장 프리셋, 정렬 같은 UX 고도화 검토

## Additional Current Notes

- Storybook is now part of the UI workflow for primitive verification
- current primitive source of truth is `pen/components.pen`
- token source of truth is `pen/components.pen` + `pen/Hinear.pen`
- desktop project workspace now uses the pen-based dashboard header
- mobile board has dedicated app bar + section list rendering
- `/auth` route now uses the pen-based `AuthForm`
- unauthenticated create/write paths redirect to auth with `next`
- project create / workspace / issue detail routes are also guarded with auth redirect
- create issue -> issue detail path now persists and renders labels
- board issue list/update path now uses request-bound internal route handlers backed by Supabase issues + labels
- issue detail now loads persisted comments/activity and supports title, description, status, priority, assignee, and comment mutations
- issue detail mutations now send `version` and surface stale-write conflict notice when optimistic locking fails
- issue detail / comment / board update mutation failures now return structured error codes and render mapped user-facing messages
- board fetch / useIssues failures now also map structured error payloads into user-facing board messages
- board screen now renders a dedicated load-failure panel and inline update-failure alert
- project workspace now focuses on issue work; access management moved to `/projects/[projectId]/settings`
- settings screen now includes:
  - project metadata form
  - invite/member/invitation management section
  - danger zone guidance for restricted type conversion
- browser-based automated coverage now exists for the previously skipped conflict / session-expired detail-screen mutation flows
- repository integration-style tests now cover:
  - issues repository label creation/linking + list mapping
  - optimistic locking success/conflict
  - typed repository forbidden errors
  - projects repository create/load/member/invitation flows
- optimistic locking real-browser validation was completed against the remote database
  - two isolated auth sessions opened the same issue detail page
  - first save succeeded, second stale save returned conflict
  - conflict notice rendered and latest issue state reloaded in the stale session
- issue detail read strategy is now explicitly:
  - `getIssueById` returns issue + labels only
  - comments and activity remain separate repository reads
  - page layer composes them with `Promise.all` for the detail screen
  - do not widen `getIssueById` into a heavy aggregate while board/update paths still depend on the lean issue shape
- PWA 알림 시스템 완성 (2026-03-23):
  - ✅ Service Worker가 푸시 알림 수신 및 표시 처리
  - ✅ 알림 권한 요청 및 구독 UI 완료
  - ✅ 4가지 알림 타입의 페이로드 생성 로직 완료
  - ✅ 이슈 업데이트 시 자동 알림 트리거 통합 완료
  - ✅ **DB 마이그레이션 적용 완료**: `push_subscriptions`, `notification_preferences` 테이블 생성
  - ✅ **Repository 구현 완료**:
    - `SupabasePushSubscriptionsRepository` (subscribe, unsubscribe, getByUser, getActiveSubscriptions)
    - `SupabaseNotificationPreferencesRepository` (getPreferences, updatePreferences)
  - ✅ **API 라우트 업데이트 완료**:
    - `/api/notifications/subscribe`: 메모리 Map → Supabase DB 저장
    - `/api/notifications/send`: 대상 필터링 구조 추가
  - ✅ **알림 설정 UI 완성**: `NotificationSettingsCard`에 토글 스위치 4개 추가
  - 🔄 **다음 단계**: 실제 테스트 및 대상 필터링 로직 완성
- **Due Date 기능 추가** (2026-03-23):
  - ✅ DB 마이그레이션 적용: `issues.due_date` 컬럼 추가 (timestamptz, nullable)
  - ✅ TypeScript 타입 업데이트:
    - `Issue` 인터페이스에 `dueDate: string | null` 추가
    - `CreateIssueInput`, `UpdateIssueInput`에 `dueDate` 추가
    - Supabase 타입 정의 업데이트
  - ✅ Repository 업데이트:
    - `mapIssue()` 함수에서 `due_date` 매핑
    - `createIssue()`에서 due date 저장
    - `updateIssue()`에서 due date 업데이트 및 activity log 기록
  - ✅ UI 업데이트:
    - Issue Detail 화면에 date input 추가 (HTML5 date picker)
    - BoardIssueCard에 due date 표시 (월일 형식)
    - IssueCard에서 dueDate prop 전달
  - 🔄 **다음 단계**: 테스트 파일에 dueDate: null 추가, due date 알림 트리거 고려

## Current Risk

The primary app request path no longer defaults to a server-side `service role` client.

Current writes and issue-detail reads now use a request-bound Supabase SSR client and authenticated actor lookup. That removes the biggest RLS bypass risk from user-facing flows.

The remaining risk is narrower now:

- service-role helpers still exist and should stay narrow and explicit
- auth callback happy path is wired, but expired-session and auth-error UX still needs polish
- board drag/drop now uses sortable lane ordering; the remaining gap is persistence/conflict handling rather than insertion fidelity
- optimistic locking is implemented in app code, the remote schema is aligned, and true concurrent edit validation passed against the real database
- the previous client-side detail-screen automated coverage gap is closed for conflict/session-expired flows
- the previous UX gap on not-found / empty / loading and repository error typing is closed
- remaining work is mostly final verification and cleanup, not core feature implementation

## Next Session Priority

### 0. PWA 알림 시스템 실제 테스트 및 대상 필터링 완성 (2026-03-23)

**완료된 작업**:
- ✅ Supabase MCP 인증 완료
- ✅ DB 마이그레이션 적용 완료 (0007, 0008)
- ✅ Repository 구현 완료
- ✅ API 라우트 업데이트 완료 (메모리 → DB)
- ✅ 알림 설정 UI 완성 (토글 스위치)

**다음 단계**:

1. **대상 필터링 로직 완성**:
   - `extractTargetUserIds()` 함수 실제 구현
   - 이슈 담당자, 프로젝트 멤버 등 관련 사용자 ID 추출
   - `filterSubscriptionsByPreferences()` 함수 완성
   - 사용자별 알림 설정 확인 및 필터링

2. **알림 설정 API 구현**:
   - `/api/notifications/preferences` GET/DELETE 라우트
   - 현재 mock 데이터를 실제 DB 조회로 대체

3. **실제 테스트**:
   - 개발 서버 실행 (`pnpm dev`)
   - 알림 권한 요청 및 구독 테스트
   - 이슈 상태/담당자 변경 시 알림 확인
   - 알림 설정 on/off 테스트

**관련 파일**:
- `src/app/api/notifications/send/route.ts` - 대상 필터링 로직 완성 필요
- `src/features/notifications/components/NotificationSettingsCard.tsx` - API 호출 연동 필요
- `src/lib/notifications/triggers.ts` - 사용자 ID 전달 로직 확인

### 1. Polish route states and verification

Goal:

- replace the remaining generic not-found / empty / loading states
- verify new invitation + profiles flows against the real database
- tighten any residual rough edges around route-level UX

First targets:

- project workspace not-found / loading polish
- invitation accept page loading / not-found polish
- remote verification for `0005_add_profiles`
- end-to-end check for resend / revoke / accept with real auth

### 2. Deepen board and issue-detail behavior

Goal:

- keep the new auth-bound request path
- keep refining board interactions on top of the new sortable reorder/insertion baseline
- keep building on the shared Supabase-backed issue source across create / detail / board

### 3. Harden the existing flow

- keep the current project -> issue -> issue detail flow
- add user-visible handling for unauthenticated writes / expired sessions
- keep invitation token flow constrained to the service-role path only where needed

Minimum methods to implement first:

- verify `getProjectById`
- verify `getIssueById`
- extend aggregate read strategy only if profile/activity requirements justify a dedicated detail read model

### 4. Fill the missing issue-detail depth

- labels
- mutation failure polish
- richer author/profile presentation now that profiles schema path exists

### 6. Add optimistic locking for concurrent edits (MVP 2)

- [x] validate concurrent edit behavior against the real database
- [x] upgrade conflict notice into a richer dialog
- [x] move `issue-detail-screen` async mutation coverage into browser Playwright-based Vitest tests

See [optimistic-locking.md](/Users/choiho/zerone/hinear/docs/issue-detail/optimistic-locking.md) for detailed implementation guide.

## Open Notes

- `pen/Hinear.pen` is present in the working tree and was not created by this work
- `pen/components.pen` is now the reference file for primitive matching
- no GitHub issue was created for this branch because GitHub API auth failed earlier
- remote git push works through `git@github-zerone:devzerone/hinear.git`
- TODO details are tracked in [docs/todo.md](/Users/choiho/zerone/hinear/docs/todo.md)
- primitive implementation details are tracked in [docs/ui-primitives.md](/Users/choiho/zerone/hinear/docs/ui-primitives.md)
- `.env.local` no longer needs `HINEAR_ACTOR_ID` for the primary app request path
- authenticated writes now require a valid Supabase auth session cookie
- Supabase MCP auth works again in the fresh session and `issues.version` is already applied remotely
- for local auth automation, `/auth/confirm` expects `token_hash` and `type`; raw Supabase `action_link` can miss this app-specific callback format
- current issue-detail composition lives in [page.tsx](/Users/choiho/zerone/hinear/src/app/projects/[projectId]/issues/[issueId]/page.tsx) and intentionally keeps `getIssueById` lean
- project workspace now uses real project/member/invitation read models instead of mock data
- invitation send / resend / revoke / accept are wired through real server actions and `/invite/[token]` routes
- profile rows are upserted on authenticated request reads through [server-auth.ts](/Users/choiho/zerone/hinear/src/lib/supabase/server-auth.ts)
- `0005_add_profiles.sql` exists locally but remote Supabase apply is still a separate verification step
- **PWA 알림 시스템 관련** (2026-03-23):
  - VAPID 키가 `.env.local`에 설정되어 있음
    - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
    - `VAPID_PRIVATE_KEY`
    - `NOTIFICATION_PUBLIC_KEY`
  - 현재 push subscription이 메모리(Map)에 저장되어 서버 재시작 시 소실
  - DB 마이그레이션 `0007`, `0008`이 생성되었으나 아직 적용되지 않음
  - 이 메모는 당시 상태이며, 현재는 Supabase MCP 호출이 정상 동작한다
  - Service Worker가 `/public/sw.js`에 있으며 자동 등록됨
  - 알림 설정이 프로젝트 설정(`/projects/[projectId]/settings`) 페이지에 통합됨

## Suggested First Prompt For Next Session

```text
Continue from docs/session-handoff.md, docs/todo.md on branch main.

**Priority 1**: Complete PWA notification system
- Apply migrations 0007, 0008 to database
- Replace in-memory subscription storage with Supabase repository
- Add notification preference toggles to settings UI
- Test push notifications end-to-end

**Priority 2**: Polish remaining routes
- Verify invitation flows against real database
- Finish not-found/loading/empty state polish
```
