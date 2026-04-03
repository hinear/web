# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hinear is a project-first issue management app built with Next.js App Router, Supabase for data/auth, and PWA capabilities. The top-level domain boundary is `project` (not workspace), with each project being either `personal` or `team`. Issues use project-scoped identifiers like `PROJECTKEY-n` (e.g., `WEB-1`).

## Development Commands

```bash
pnpm dev              # Start development server
pnpm lint             # Run Biome linter
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # Run TypeScript type checking
pnpm test             # Run Vitest tests
pnpm test:watch       # Run tests in watch mode
pnpm build            # Build for production
```

## Critical Architecture Notes

### Security Status
사용자 요청 경로에서 service-role 클라이언트 사용이 제거되었습니다.
service-role은 다음 시스템 경로에서만 사용됩니다:
- 알림 전송 (cross-user 구독 조회)
- MCP OAuth 토큰 교환 (machine-to-machine)
- 초대 페이지 (비인증 경로, 토큰 기반 접근 제어)
- 개발용 테스트 로그인
- 내부 GitHub API
- 성능 모니터링 리포지토리 (시스템 전체 가시성 필요)

### Feature Structure
Each domain feature follows this pattern:
- `contracts.ts` - Input/output types
- `types.ts` - Domain model types
- `lib/` - Pure business logic
- `repositories/` - Data access layer (Supabase implementations)
- `actions/` - Next.js server actions
- `components/` - React components

### Domain Model
- **Project**: Top-level boundary, `personal` or `team`
- **Issue**: Belongs to exactly one project, defaults to `Triage` status
- **ProjectMember**: Access control with `owner`/`member` roles
- Issue statuses: `Triage` → `Backlog`/`Todo` → `In Progress` → `Done`

### Current App Flow
`/projects/new` → `/projects/[projectId]` → `/projects/[projectId]/issues/[issueId]`

### Environment Setup
Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HINEAR_ACTOR_ID` (temporary, to be removed)

## Key Documentation

- `docs/issue-detail/overview.md` - Feature scope and requirements
- `docs/issue-detail/roadmap.md` - MVP stages and priorities
- `docs/issue-detail/optimistic-locking.md` - Concurrent edit conflict resolution (MVP 2)
- `docs/performance-optimizations.md` - Performance optimizations implemented (003-performance-audit)
- `docs/performance-runbook.md` - Performance issue diagnosis and resolution (003-performance-audit)
- `docs/todo.md` - Current session context and next priorities
- `docs/session-handoff.md` - Implementation status and next steps

## Next Priority Tasks

1. Replace service-role-first repository usage with session-aware server wiring
2. Remove `HINEAR_ACTOR_ID` temporary actor fallback
3. Implement optimistic locking for concurrent edits (MVP 2)
4. Complete issue detail editing controls

## Design System

UI design is based on `pen/Hinear.pen` file created with Pen design tool. This file contains Issue Create Page, Sidebar, and overall layout structure. Extract design tokens (colors, fonts, spacing, component structure) from this file when implementing React components. See `docs/issue-detail/overview.md` and `specs/issue-detail.md` for design integration details.

## Active Technologies
- TypeScript 5.x (002-mcp-phase2-features)
- Supabase PostgreSQL (already configured) (002-mcp-phase2-features)
- TypeScript 5.x + Next.js 16.2.0 (App Router), React 19.2.4, Supabase (PostgreSQL), @tanstack/react-query 5.95.2 (003-performance-audit)
- TypeScript 5.x + Next.js 16.2.0 (App Router), Supabase (PostgreSQL), React 19.2.4 (010-restful-api)

## Recent Changes
- 002-mcp-phase2-features: Added TypeScript 5.x
- 003-performance-audit: Performance Investigation and Optimization feature

## Performance Monitoring Guide (003-performance-audit)

### Performance Features Implemented

The application now includes comprehensive performance monitoring and optimization capabilities:

1. **Web Vitals Collection** - Automatic collection of CLS, FID, FCP, LCP, TTFB
2. **Performance Profiling** - 1% sampling in production, 100% in development
3. **Database Query Optimization** - 13 indexes for common query patterns
4. **React Query Caching** - 5-10 minute cache for projects and issues
5. **Bundle Optimization** - Dynamic imports for heavy components (MarkdownEditor)
6. **Component Optimization** - React.memo, useMemo, useCallback applied
7. **Performance Monitoring** - BaselineManager, BottleneckTracker, AlertManager
8. **Regression Detection** - Automated performance regression detection

### Performance Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Page Load Time | 2000ms | 3000ms | 4000ms |
| Query Duration | 200ms | 300ms | 500ms |
| Bundle Size | 200KB | 250KB | 300KB |
| FCP | 1500ms | 2000ms | 3000ms |
| LCP | 2000ms | 2500ms | 4000ms |
| CLS | 0.1 | 0.2 | 0.3 |

### Using Performance Hooks

**Profile Component Performance**
```typescript
import { usePerformanceProfiler } from "@/features/performance/hooks/usePerformanceProfiler";

function MyComponent() {
  usePerformanceProfiler("MyComponent");

  // Component logic...
}
```

**Track Database Queries**
```typescript
import { trackQuery } from "@/lib/performance/query-tracker";

const result = await trackQuery("getProjectById", async () => {
  return repository.getProjectById(id);
});
```

**React Query Data Fetching**
```typescript
import { useProject } from "@/features/projects/hooks/use-projects";

function ProjectPage({ projectId }) {
  const { data: project, isLoading, error } = useProject(projectId);
  // Data is cached for 10 minutes
}
```

### Performance Monitoring Commands

```bash
# Run performance tests
pnpm test tests/performance

# Analyze bundle size
ANALYZE=true pnpm build

# Generate performance report
curl -X POST http://localhost:3000/api/performance/report

# Check performance bottlenecks
psql $DATABASE_URL -c "SELECT * FROM performance_bottlenecks WHERE status != 'RESOLVED';"
```

### Performance Best Practices

**For Database Queries**
- Use `select()` with specific columns instead of `select(*)`
- Apply indexes for WHERE, JOIN, and ORDER BY clauses
- Use pagination for large result sets
- Run EXPLAIN ANALYZE on slow queries

**For React Components**
- Apply React.memo to pure components
- Use useMemo for expensive computations
- Use useCallback to stabilize function references
- Dynamic import heavy components (editors, charts)

**For Caching**
- Use React Query hooks for data fetching
- Set appropriate staleTime and gcTime values
- Invalidate cache after mutations
- Use cache keys consistently

### Performance Troubleshooting

**Slow Page Loads**
1. Check Web Vitals in browser DevTools
2. Review bundle size with `ANALYZE=true pnpm build`
3. Check database query performance
4. Verify React Query cache is working

**High Memory Usage**
1. Profile with React DevTools Profiler
2. Check for memory leaks in useEffect
3. Verify cleanup functions are implemented
4. Look for unnecessary re-renders

**Database Timeouts**
1. Run EXPLAIN ANALYZE on slow queries
2. Check if indexes are being used
3. Verify query is selecting only needed columns
4. Consider adding indexes for common patterns

For detailed troubleshooting procedures, see `docs/performance-runbook.md`.
