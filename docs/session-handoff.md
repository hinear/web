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

## Key Files

- [docs/todo.md](/Users/choiho/zerone/hinear/docs/todo.md)
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

## Current Risk

The current repository implementation defaults to a server-side `service role` client.

This is acceptable for scaffolding and controlled server-only operations, but it bypasses RLS if used as the primary request path.

This should be treated as a temporary integration step, not the final app access model.

Required next action:

- move request-bound data access to a session-aware server client
- keep service-role usage narrow and explicit
- remove temporary actor fallback env usage from user-facing request paths

## Next Session Priority

### 1. Replace service-role-first wiring

Goal:

- preserve the current schema and repository work
- stop treating service-role as the default app request client
- decide how authenticated request context reaches repository calls

### 2. Finish Supabase app wiring

- add client helpers under `src/lib/supabase/`
- connect them to real `.env.local`
- add session-aware server usage
- replace temporary `HINEAR_ACTOR_ID` usage with authenticated user context

### 3. Harden the existing flow

- keep the current project -> issue -> issue detail flow
- narrow the repository access path so app requests stop defaulting to service-role

Minimum methods to implement first:

- replace server-action actor lookup with auth-bound actor lookup
- verify `getProjectById`
- verify `getIssueById`
- add error handling and user-visible failure states

### 4. Fill the missing issue-detail depth

- labels
- assignee selector
- priority mutation
- activity log richness
- comment persistence and render depth

## Open Notes

- `pen/Hinear.pen` is present in the working tree and was not created by this work
- no GitHub issue was created for this branch because GitHub API auth failed earlier
- remote git push works through `git@github-zerone:devzerone/hinear.git`
- TODO details are tracked in [docs/todo.md](/Users/choiho/zerone/hinear/docs/todo.md)
- `.env.local` currently needs `HINEAR_ACTOR_ID` in addition to Supabase values for the temporary server-action flow

## Suggested First Prompt For Next Session

```text
Continue from docs/session-handoff.md and docs/todo.md on branch main. Keep the current project -> issue -> detail flow working, replace service-role-first repository usage with session-aware server wiring, and remove the temporary HINEAR_ACTOR_ID actor fallback.
```
