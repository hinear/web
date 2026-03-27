# Quick Start Guide: Performance Investigation and Optimization

> 2026-03-27 recovery note: For the currently accepted recovered baseline and validation loop, use `specs/005-rebuild-003-build/` as the source of truth. This document remains useful for original 003 intent, but not for the active build-stability gate.

**Feature**: 003-performance-audit
**Date**: 2026-03-26
**Phase**: Phase 1 - Design & Contracts

## Overview

This guide provides a quick reference for implementing performance monitoring, profiling, and optimization in the Hinear application. Follow these steps to get started with the performance feature.

## Prerequisites

- Node.js 20+ installed
- pnpm package manager
- Access to Supabase project
- Next.js 16.2.0 development environment

## Installation

### 1. Install Dependencies

```bash
# No new production dependencies required
# Dev dependencies for bundle analysis
pnpm add -D @next/bundle-analyzer
```

### 2. Update Next.js Configuration

Add to `next.config.js`:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'lucide-react'],
  },

  // Bundle size limits
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 200000, // 200KB
        maxEntrypointSize: 200000,
      };
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

### 3. Create Performance Feature Directory

```bash
mkdir -p src/features/performance/{lib,repositories,actions,components,hooks}
mkdir -p src/lib/performance
mkdir -p tests/performance
```

## Quick Start: Three Phases

### Phase 1: Performance Profiling (P1 - Critical)

#### Step 1: Set Up Web Vitals Collection

Create `src/app/layout.tsx` (update existing):

```typescript
import { WebVitals } from '@/components/WebVitals';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
```

Create `src/components/WebVitals.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import {CLS, FID, FCP, LCP, TTFB} from 'web-vitals';

export function WebVitals() {
  useEffect(() => {
    const reportWebVital = (metric) => {
      // Send to performance monitoring
      fetch('/api/performance/metrics', {
        method: 'POST',
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
          rating: metric.rating,
        }),
      });
    };

    CLS(reportWebVital);
    FID(reportWebVital);
    FCP(reportWebVital);
    LCP(reportWebVital);
    TTFB(reportWebVital);
  }, []);

  return null;
}
```

#### Step 2: Create Metric Collector

Create `src/features/performance/lib/metric-collector.ts`:

```typescript
export class MetricCollector {
  private sessionId: string;
  private metrics: Map<string, number> = new Map();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  mark(name: string): void {
    performance.mark(`${name}-start`);
  }

  measure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure.duration;
    this.metrics.set(name, duration);
    return duration;
  }

  async recordMetric(name: string, value: number, unit: string) {
    await fetch('/api/performance/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        name,
        value,
        unit,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```

#### Step 3: Profile Page Loads

Create `src/features/performance/hooks/usePerformanceProfiler.ts`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function usePerformanceProfiler(enabled: boolean = false) {
  const pathname = usePathname();
  const collectorRef = useRef<MetricCollector | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Only profile 1% of sessions
    if (Math.random() > 0.01) return;

    const collector = new MetricCollector(crypto.randomUUID());
    collectorRef.current = collector;

    collector.mark('page-load');
    collector.mark('first-contentful-paint');

    return () => {
      collector.measure('page-load');
      const metrics = collector.getMetrics();
      console.log('[Performance]', pathname, metrics);
    };
  }, [pathname, enabled]);
}

// Usage in page components
export function IssueDetailPage() {
  usePerformanceProfiler(process.env.NODE_ENV === 'production');

  return <div>...</div>;
}
```

#### Step 4: Analyze Database Queries

Create `src/lib/performance/query-tracker.ts`:

```typescript
export function trackQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return queryFn().then(
    (result) => {
      const duration = performance.now() - start;

      if (duration > 200) {
        console.warn(`[Slow Query] ${queryName}: ${duration.toFixed(2)}ms`);
      }

      // Record metric
      if (typeof window !== 'undefined') {
        fetch('/api/performance/metrics', {
          method: 'POST',
          body: JSON.stringify({
            name: 'query_duration',
            value: duration,
            unit: 'ms',
            metadata: { queryName },
          }),
        }).catch(() => {}); // Fire and forget
      }

      return result;
    },
    (error) => {
      const duration = performance.now() - start;
      console.error(`[Query Error] ${queryName}: ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  );
}

// Usage in repositories
export async function getProject(id: string) {
  return trackQuery('getProject', async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  });
}
```

### Phase 2: Optimize Critical Issues (P2)

#### Step 1: Analyze Bundle Size

```bash
# Analyze bundle
ANALYZE=true pnpm build

# View results in browser
# Open dist/analyze.html
```

#### Step 2: Implement Code Splitting

Before:
```typescript
import { TipTapEditor } from './TipTapEditor';

export function IssueDetail() {
  return <TipTapEditor />;
}
```

After:
```typescript
import dynamic from 'next/dynamic';

const TipTapEditor = dynamic(() => import('./TipTapEditor'), {
  loading: () => <Skeleton />,
  ssr: false,
});

export function IssueDetail() {
  return <TipTapEditor />;
}
```

#### Step 3: Optimize Database Queries

Add indexes in Supabase:

```sql
-- Create indexes for common queries
CREATE INDEX idx_issues_project_status ON issues(project_id, status);
CREATE INDEX idx_issues_assignee ON issues(assignee_id);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM issues
WHERE project_id = 'xxx'
AND status = 'In Progress'
ORDER BY created_at DESC;
```

#### Step 4: Implement Caching

```typescript
import { useQuery } from '@tanstack/react-query';

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Phase 3: Set Up Monitoring (P3)

#### Step 1: Create Performance API Routes

Create `src/app/api/performance/metrics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { recordMetric } from '@/features/performance/actions/record-metric-action';

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();
    await recordMetric(metric);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Performance] Failed to record metric:', error);
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
  }
}
```

#### Step 2: Set Up Baselines

```typescript
// Initialize default baselines
const baselines = [
  { metricName: 'page_load_time', targetValue: 2000, unit: 'ms' },
  { metricName: 'query_duration', targetValue: 200, unit: 'ms' },
  { metricName: 'bundle_size', targetValue: 200, unit: 'KB' },
];

for (const baseline of baselines) {
  await setBaseline(baseline);
}
```

#### Step 3: Configure Alerts

```typescript
// Check for violations every hour
setInterval(async () => {
  const violations = await checkBaselines();

  for (const violation of violations) {
    if (violation.thresholdType === 'critical') {
      await sendAlert({
        type: 'baseline_violation',
        severity: 'critical',
        message: `${violation.metricName} exceeded critical threshold`,
        details: violation,
      });
    }
  }
}, 60 * 60 * 1000);
```

## Development Workflow

### 1. Local Development

```bash
# Start dev server
pnpm dev

# Enable profiling in development
# Set NEXT_PUBLIC_ENABLE_PROFILING=true
```

### 2. Performance Testing

```bash
# Run performance tests
pnpm test tests/performance

# Run Lighthouse CI
lhci autorun

# Analyze bundle size
ANALYZE=true pnpm build
```

### 3. Monitor in Production

```bash
# View performance dashboard
# Navigate to /performance (admin only)

# Check bottlenecks
# SELECT * FROM performance_bottlenecks WHERE status = 'IDENTIFIED'

# View recent metrics
# SELECT * FROM performance_metrics
# WHERE timestamp > NOW() - INTERVAL '1 hour'
# ORDER BY timestamp DESC;
```

## Common Performance Issues and Fixes

### Issue 1: Slow Page Loads

**Symptoms**: Page load time > 2s

**Diagnosis**:
```typescript
const metrics = await collector.getSessionMetrics(sessionId);
console.log(metrics.filter(m => m.name === 'page_load_time'));
```

**Fixes**:
- Implement code splitting for heavy components
- Optimize images with `next/image`
- Use `next/font` for automatic font optimization
- Enable static generation where possible

### Issue 2: Slow Database Queries

**Symptoms**: Query duration > 200ms

**Diagnosis**:
```sql
-- Check slow queries
SELECT * FROM performance_metrics
WHERE name = 'query_duration'
AND value > 200
ORDER BY value DESC
LIMIT 10;
```

**Fixes**:
- Add indexes on frequently queried columns
- Use `select()` to limit columns
- Implement pagination
- Cache results with React Query

### Issue 3: Large Bundle Size

**Symptoms**: Initial bundle > 200KB

**Diagnosis**:
```bash
ANALYZE=true pnpm build
# Check dist/analyze.html
```

**Fixes**:
- Dynamic imports for heavy libraries
- Tree-shaking unused code
- Consider lighter alternatives
- Optimize package imports

### Issue 4: Excessive Re-renders

**Symptoms**: Component renders > 2 times per interaction

**Diagnosis**:
```typescript
import { Profiler } from 'react';

<Profiler id="IssueDetail" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 100) {
    console.warn(`[Slow Render] ${id}: ${actualDuration}ms`);
  }
}}>
  <IssueDetail />
</Profiler>
```

**Fixes**:
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Split large components into smaller ones
- Use React.memo for expensive components

## Testing Performance

### Unit Tests

```typescript
// tests/performance/metric-collector.test.ts
import { describe, it, expect } from 'vitest';
import { MetricCollector } from '@/features/performance/lib/metric-collector';

describe('MetricCollector', () => {
  it('should measure duration correctly', async () => {
    const collector = new MetricCollector('test-session');
    collector.mark('test-operation');
    await new Promise(resolve => setTimeout(resolve, 100));
    const duration = collector.measure('test-operation');
    expect(duration).toBeGreaterThan(90);
  });
});
```

### Integration Tests

```typescript
// tests/performance/api.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/performance/metrics/route';

describe('Performance API', () => {
  it('should record metric successfully', async () => {
    const request = new Request('http://localhost/api/performance/metrics', {
      method: 'POST',
      body: JSON.stringify({ name: 'test', value: 100, unit: 'ms' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## Checklist

- [ ] Install @next/bundle-analyzer
- [ ] Update next.config.js
- [ ] Create performance feature directory structure
- [ ] Implement Web Vitals collection
- [ ] Create MetricCollector class
- [ ] Add usePerformanceProfiler hook
- [ ] Implement query tracking
- [ ] Set up performance API routes
- [ ] Create initial baselines
- [ ] Configure alerting
- [ ] Run bundle analysis
- [ ] Test in development
- [ ] Deploy to staging
- [ ] Verify in production
- [ ] Set up ongoing monitoring

## Next Steps

1. Implement Phase 1 (Profiling) - 1 week
2. Analyze results and identify bottlenecks - 3 days
3. Implement Phase 2 (Optimizations) - 1-2 weeks
4. Implement Phase 3 (Monitoring) - 1 week
5. Document findings and create runbook - 3 days

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)
- [React Profiling](https://react.dev/learn/react-developer-tools#profiling-components)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
