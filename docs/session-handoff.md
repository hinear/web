# Session Handoff

## Current Branch

- `main`

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

- Supabase MCP CLI login was completed, but this Codex session still returned `Auth required` from MCP tool calls
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
  - create issue
  - land on full-page issue detail route
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

## Suggested First Prompt For Next Session

```text
Continue from docs/session-handoff.md, docs/todo.md, and docs/logs/2026-03-21.md on branch main. Project workspace/invitations/profiles are now wired end-to-end, so verify the new invitation flows against the real database and finish not-found/loading/empty polish.
```
