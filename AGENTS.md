# hinear Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-29

## Active Technologies
- TypeScript 5.x on Node.js runtime, React 19.2.4 + Next.js 16.2.0 (App Router), Supabase, @tanstack/react-query 5.95.2, sonner, lucide-react, Vitest, Testing Library, Biome (006-activate-buttons)
- Supabase PostgreSQL for persisted project/issue state, URL query state for drawer/filter interactions, repository-based server actions, spec artifacts in repository files (006-activate-buttons)
- TypeScript 5.x on Node.js runtime, React 19.2.4, Next.js 16.2.0 (App Router) + Supabase, `@tanstack/react-query` 5.95.2, sonner, lucide-react, Vitest 4.1.0, Testing Library, Biome (007-feature-structure-refactor)
- Supabase PostgreSQL for persisted project and issue state; repository files for feature specs and migration documentation (007-feature-structure-refactor)
- TypeScript 5.x on Node.js 20 for repository tooling and GitHub Actions workflow execution + Next.js 16.2.0, React 19.2.4, pnpm 10.x, Biome, Vitest, Supabase, GitHub Actions (008-github-cicd-audit)
- Repository files (`.github/workflows/`, `specs/`, `AGENTS.md`) (008-github-cicd-audit)
- TypeScript 5.x + Next.js 16.2.0 (App Router), React 19.2.4, Supabase, next-pwa, lucide-react, sonner (011-stabilize-pwa-header)
- Supabase PostgreSQL for notification preferences and push subscriptions; browser/PWA runtime state for viewport and permission status (011-stabilize-pwa-header)

- TypeScript 5.x on Node.js runtime, React 19.2.4 + Next.js 16.2.0 (App Router), Supabase, @tanstack/react-query 5.95.2, next-pwa, Vitest, Testing Library, Biome (005-rebuild-003-build)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x on Node.js runtime, React 19.2.4: Follow standard conventions

## Recent Changes
- 011-stabilize-pwa-header: Added TypeScript 5.x + Next.js 16.2.0 (App Router), React 19.2.4, Supabase, next-pwa, lucide-react, sonner
- 008-github-cicd-audit: Added TypeScript 5.x on Node.js 20 for repository tooling and GitHub Actions workflow execution + Next.js 16.2.0, React 19.2.4, pnpm 10.x, Biome, Vitest, Supabase, GitHub Actions
- 007-feature-structure-refactor: Added TypeScript 5.x on Node.js runtime, React 19.2.4, Next.js 16.2.0 (App Router) + Supabase, `@tanstack/react-query` 5.95.2, sonner, lucide-react, Vitest 4.1.0, Testing Library, Biome


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
