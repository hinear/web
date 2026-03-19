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

Current local flow also expects:

- `HINEAR_ACTOR_ID`

This is a temporary server-action actor fallback until Supabase auth/session wiring replaces it.

## CI/CD

GitHub Actions is configured for:

- `CI`
  - runs on every push and pull request
  - installs dependencies, then runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`

Deployment is expected to use Vercel Git Integration:

- pull requests create Vercel preview deployments
- pushes to `main` trigger Vercel production deployments

No GitHub Actions Vercel deploy workflow is checked in right now to avoid duplicating Vercel's default deployment pipeline.

## Docs

- `docs/issue-detail/overview.md`
- `docs/issue-detail/roadmap.md`
- `docs/issue-detail/project-model.md`
- `docs/issue-detail/pwa-firebase-notifications.md`

## First Focus

- personal/team project model
- project-scoped issue identifiers
- issue detail page
- activity log with before/after tracking
- invitation flow

## Current App Flow

- `/projects/new`
- `/projects/[projectId]`
- `/projects/[projectId]/issues/[issueId]`
