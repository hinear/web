// Get Performance Report Action
// Feature: 003-performance-audit

"use server";

import type { PerformanceReport } from "../contracts";
import { BottleneckStatus } from "../contracts";
import { performanceMetricsRepository } from "../repositories/performance-metrics-repository";
import type { PerformanceReportQuery } from "../types";

/**
 * Server action to generate a performance report
 *
 * Usage:
 * ```typescript
 * const report = await getPerformanceReport({
 *   timeRange: { start: new Date(Date.now() - 24*60*60*1000), end: new Date() },
 *   routes: ["/projects/[id]"],
 * });
 * ```
 */
export async function getPerformanceReport(
  query: PerformanceReportQuery
): Promise<PerformanceReport> {
  const { timeRange } = query;

  // Fetch metrics
  const metrics =
    await performanceMetricsRepository.getMetricsByTimeRange(timeRange);

  // Calculate summary statistics
  const summary = {
    totalMetrics: metrics.length,
    averagePageLoadTime: calculateAverage(metrics, "page_load_time"),
    slowQueriesCount: metrics.filter(
      (m) => m.name === "query_duration" && m.value > 200
    ).length,
    averageBundleSize: calculateAverage(metrics, "bundle_size"),
    webVitals: {
      cls: calculateLatest(metrics, "CLS"),
      fid: calculateLatest(metrics, "FID"),
      fcp: calculateLatest(metrics, "FCP"),
      lcp: calculateLatest(metrics, "LCP"),
      ttfb: calculateLatest(metrics, "TTFB"),
    },
  };

  // Fetch bottlenecks
  const bottlenecks = await performanceMetricsRepository.listBottlenecks({
    status: BottleneckStatus.IDENTIFIED,
  });

  const bottleneckSummaries = groupBottlenecks(bottlenecks);

  // Generate recommendations
  const recommendations = generateRecommendations(summary, bottleneckSummaries);

  return {
    id: crypto.randomUUID(),
    generatedAt: new Date(),
    timeRange,
    summary,
    bottlenecks: bottleneckSummaries,
    recommendations,
  };
}

/**
 * Calculate average value for a specific metric name
 */
function calculateAverage(metrics: any[], name: string): number {
  const filtered = metrics.filter((m) => m.name === name);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
}

/**
 * Get latest value for a specific metric name
 */
function calculateLatest(metrics: any[], name: string): number {
  const filtered = metrics.filter((m) => m.name === name);
  if (filtered.length === 0) return 0;
  return filtered[0].value; // Already sorted by timestamp desc
}

/**
 * Group bottlenecks by category and severity
 */
function groupBottlenecks(bottlenecks: any[]): any[] {
  const grouped = bottlenecks.reduce(
    (acc, b) => {
      const key = `${b.category}-${b.severity}`;
      if (!acc[key]) {
        acc[key] = {
          category: b.category,
          severity: b.severity,
          count: 0,
          avgValue: 0,
          targetValue: b.targetValue,
          impact: b.impact,
        };
      }
      acc[key].count++;
      acc[key].avgValue += b.currentValue;
      return acc;
    },
    {} as Record<string, any>
  );

  return Object.values(grouped).map((g: any) => ({
    ...g,
    avgValue: g.avgValue / g.count,
  }));
}

/**
 * Generate recommendations based on summary and bottlenecks
 */
function generateRecommendations(summary: any, bottlenecks: any[]): string[] {
  const recommendations: string[] = [];

  if (summary.averagePageLoadTime > 2000) {
    recommendations.push(
      "Page load time exceeds 2s target. Consider implementing code splitting and lazy loading."
    );
  }

  if (summary.slowQueriesCount > 10) {
    recommendations.push(
      `${summary.slowQueriesCount} slow queries detected. Review database indexes and query optimization.`
    );
  }

  if (summary.averageBundleSize > 200) {
    recommendations.push(
      "Bundle size exceeds 200KB target. Consider dynamic imports and tree-shaking."
    );
  }

  if (summary.webVitals.lcp > 2500) {
    recommendations.push(
      "Largest Contentful Paint (LCP) is slow. Optimize image loading and consider SSR for critical content."
    );
  }

  const criticalBottlenecks = bottlenecks.filter(
    (b) => b.severity === "CRITICAL"
  );
  if (criticalBottlenecks.length > 0) {
    recommendations.push(
      `${criticalBottlenecks.length} critical bottlenecks require immediate attention.`
    );
  }

  return recommendations;
}
