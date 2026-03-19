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
