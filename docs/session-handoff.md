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
  - MSW mock 데이터로 동작 중
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
  - reference/story 단계 organism 추가:
    - `DrawerIssueDetailPanel`
    - `CreateIssueTabletModal`
    - `AuthForm`
    - `IssueDetailStateVariations`
    - `CreateProjectSection`
    - `ProjectOperationsSection`

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

## Current State

- Supabase MCP works in the current session
- remote project URL: `https://pmyrrckkiomjwjqntymr.supabase.co`
- remote migrations currently present:
  - `initial_project_issue_schema`
  - `schema_lint_fixes`
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
- several pen nodes are implemented as reference organisms in Storybook but are not yet wired into routes

## Current Risk

The current repository implementation defaults to a server-side `service role` client.

This is acceptable for scaffolding and controlled server-only operations, but it bypasses RLS if used as the primary request path.

This should be treated as a temporary integration step, not the final app access model.

Required next action:

- move request-bound data access to a session-aware server client
- keep service-role usage narrow and explicit
- remove temporary actor fallback env usage from user-facing request paths

## Next Session Priority

### 1. Apply primitives to real screens

Goal:

- stop leaving primitive work only in Storybook
- replace ad-hoc screen markup with shared primitives
- keep visuals aligned with `pen`

First targets:

- project switcher/sidebar
- issue card metadata rows
- create project / create issue form controls
- issue detail full-page state handling
- operations / invitations sections route integration

### 2. Replace service-role-first wiring

Goal:

- preserve the current schema and repository work
- stop treating service-role as the default app request client
- decide how authenticated request context reaches repository calls

### 3. Finish Supabase app wiring

- add client helpers under `src/lib/supabase/`
- connect them to real `.env.local`
- add session-aware server usage
- replace temporary `HINEAR_ACTOR_ID` usage with authenticated user context

### 4. Harden the existing flow

- keep the current project -> issue -> issue detail flow
- narrow the repository access path so app requests stop defaulting to service-role

Minimum methods to implement first:

- replace server-action actor lookup with auth-bound actor lookup
- verify `getProjectById`
- verify `getIssueById`
- add error handling and user-visible failure states

### 5. Fill the missing issue-detail depth

- labels
- assignee selector
- priority mutation
- activity log richness
- comment persistence and render depth

### 6. Add optimistic locking for concurrent edits (MVP 2)

- add `version` column to `issues` table
- implement `updateIssue` with version check
- add conflict error handling
- implement conflict dialog UI
- add unit and integration tests for conflict scenarios

See [optimistic-locking.md](/Users/choiho/zerone/hinear/docs/issue-detail/optimistic-locking.md) for detailed implementation guide.

## Open Notes

- `pen/Hinear.pen` is present in the working tree and was not created by this work
- `pen/components.pen` is now the reference file for primitive matching
- no GitHub issue was created for this branch because GitHub API auth failed earlier
- remote git push works through `git@github-zerone:devzerone/hinear.git`
- TODO details are tracked in [docs/todo.md](/Users/choiho/zerone/hinear/docs/todo.md)
- primitive implementation details are tracked in [docs/ui-primitives.md](/Users/choiho/zerone/hinear/docs/ui-primitives.md)
- `.env.local` currently needs `HINEAR_ACTOR_ID` in addition to Supabase values for the temporary server-action flow

## Suggested First Prompt For Next Session

```text
Continue from docs/session-handoff.md, docs/todo.md, and docs/ui-primitives.md on branch main. Apply the new pen-based primitives to the real project workspace screens while keeping the current project -> issue -> detail flow working, then continue replacing service-role-first repository usage with session-aware server wiring.
```
