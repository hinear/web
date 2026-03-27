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
