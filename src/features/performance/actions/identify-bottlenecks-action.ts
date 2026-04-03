// Identify Bottlenecks Action
// Feature: 003-performance-audit

"use server";

import {
  BottleneckCategory,
  BottleneckSeverity,
  BottleneckStatus,
} from "../contracts";
import { getServerPerformanceMetricsRepository } from "../repositories/server-performance-metrics-repository";
import type { CreateBottleneckInput, RecordOptimizationInput } from "../types";

/**
 * Server action to identify and create performance bottlenecks
 *
 * Usage:
 * ```typescript
 * await identifyBottlenecks();
 * ```
 */
export async function identifyBottlenecks(): Promise<void> {
  try {
    // Get recent metrics from the last hour
    const timeRange = {
      start: new Date(Date.now() - 60 * 60 * 1000),
      end: new Date(),
    };

    const metrics =
      await getServerPerformanceMetricsRepository().getMetricsByTimeRange(
        timeRange
      );

    // Analyze metrics for bottlenecks
    const bottlenecks = analyzeMetricsForBottlenecks(metrics);

    // Save identified bottlenecks
    for (const bottleneck of bottlenecks) {
      try {
        await getServerPerformanceMetricsRepository().saveBottleneck({
          ...bottleneck,
          status: BottleneckStatus.IDENTIFIED,
          identifiedAt: new Date(),
          resolvedAt: null,
        });
      } catch (error) {
        console.error(
          "[identifyBottlenecks] Failed to save bottleneck:",
          error
        );
        // Continue with other bottlenecks
      }
    }
  } catch (error) {
    console.error(
      "[identifyBottlenecks] Failed to identify bottlenecks:",
      error
    );
    throw error;
  }
}

/**
 * Analyze metrics and identify potential bottlenecks
 */
function analyzeMetricsForBottlenecks(
  metrics: any[]
): Omit<CreateBottleneckInput, "id">[] {
  const bottlenecks: Omit<CreateBottleneckInput, "id">[] = [];

  // Group metrics by name and route
  const grouped = groupMetrics(metrics);

  for (const [key, group] of Object.entries(grouped)) {
    const [name, route] = key.split("|");
    const avgValue = group.reduce((sum, m) => sum + m.value, 0) / group.length;
    const _max_value = Math.max(...group.map((m) => m.value));

    // Check for slow page loads
    if (name === "page_load_time" && avgValue > 2000) {
      const severity = getSeverity(avgValue, 2000);
      bottlenecks.push({
        title: `Slow Page Load Time${route ? ` on ${route}` : ""}`,
        category: BottleneckCategory.SLOW_LCP,
        severity,
        description: `Average page load time is ${avgValue.toFixed(0)}ms, exceeding the 2000ms target.`,
        location: route || "global",
        currentValue: avgValue,
        targetValue: 2000,
        unit: "ms",
        impact:
          "Users experience slow page loads, leading to frustration and potential abandonment.",
        suggestion:
          "Implement code splitting, lazy loading, optimize images, and consider server-side rendering for critical content.",
      });
    }

    // Check for slow queries
    if (name === "query_duration" && avgValue > 200) {
      const severity = getSeverity(avgValue, 200);
      bottlenecks.push({
        title: `Slow Database Query${route ? ` on ${route}` : ""}`,
        category: BottleneckCategory.DATABASE_QUERY,
        severity,
        description: `Average query duration is ${avgValue.toFixed(0)}ms, exceeding the 200ms target.`,
        location: route || "global",
        currentValue: avgValue,
        targetValue: 200,
        unit: "ms",
        impact:
          "Slow database queries cause delayed data loading and poor user experience.",
        suggestion:
          "Review query execution plans, add appropriate indexes, optimize queries, and implement query result caching.",
      });
    }

    // Check for large bundles
    if (name === "bundle_size" && avgValue > 200) {
      const severity = getSeverity(avgValue, 200);
      bottlenecks.push({
        title: `Large JavaScript Bundle${route ? ` for ${route}` : ""}`,
        category: BottleneckCategory.LARGE_BUNDLE,
        severity,
        description: `Average bundle size is ${avgValue.toFixed(0)}KB, exceeding the 200KB target.`,
        location: route || "global",
        currentValue: avgValue,
        targetValue: 200,
        unit: "KB",
        impact:
          "Large bundles increase initial load time and may affect app installability on PWA.",
        suggestion:
          "Implement dynamic imports, tree-shaking, code splitting, and consider lighter alternatives for heavy dependencies.",
      });
    }

    // Check for slow API responses
    if (name === "api_response_time" && avgValue > 100) {
      const severity = getSeverity(avgValue, 100);
      bottlenecks.push({
        title: `Slow API Response${route ? ` on ${route}` : ""}`,
        category: BottleneckCategory.SLOW_API,
        severity,
        description: `Average API response time is ${avgValue.toFixed(0)}ms, exceeding the 100ms target.`,
        location: route || "global",
        currentValue: avgValue,
        targetValue: 100,
        unit: "ms",
        impact:
          "Slow API responses cause delayed data loading and poor user experience.",
        suggestion:
          "Review API endpoint performance, implement caching, optimize database queries, and consider edge caching.",
      });
    }
  }

  return bottlenecks;
}

/**
 * Group metrics by name and route
 */
function groupMetrics(metrics: any[]): Record<string, any[]> {
  return metrics.reduce(
    (acc, metric) => {
      const key = `${metric.name}|${metric.route || "global"}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    },
    {} as Record<string, any[]>
  );
}

/**
 * Calculate severity based on current value vs target
 */
function getSeverity(
  currentValue: number,
  targetValue: number
): BottleneckSeverity {
  const ratio = currentValue / targetValue;

  if (ratio > 5) return BottleneckSeverity.CRITICAL;
  if (ratio > 3) return BottleneckSeverity.HIGH;
  if (ratio > 2) return BottleneckSeverity.MEDIUM;
  return BottleneckSeverity.LOW;
}

/**
 * Record an optimization for a bottleneck
 *
 * Usage:
 * ```typescript
 * await recordOptimization({
 *   bottleneckId: "bottleneck-123",
 *   title: "Added database index",
 *   description: "Added composite index on issues(project_id, status)",
 *   beforeValue: 500,
 *   afterValue: 50,
 *   implementation: "Migration 004_query_indexes.sql",
 * });
 * ```
 */
export async function recordOptimization(
  input: RecordOptimizationInput
): Promise<void> {
  try {
    const improvementPercentage =
      ((input.beforeValue - input.afterValue) / input.beforeValue) * 100;

    await getServerPerformanceMetricsRepository().saveOptimizationRecord({
      bottleneckId: input.bottleneckId,
      title: input.title,
      description: input.description,
      beforeValue: input.beforeValue,
      afterValue: input.afterValue,
      improvementPercentage,
      implementation: input.implementation,
      createdAt: new Date(),
      verifiedAt: null,
    });

    // Update bottleneck status to RESOLVED
    const bottlenecks =
      await getServerPerformanceMetricsRepository().listBottlenecks();
    const bottleneck = bottlenecks.find((b) => b.id === input.bottleneckId);

    if (bottleneck) {
      // This would require implementing an update method in the repository
      // For now, we'll just log a message
      console.log(
        `[recordOptimization] Optimization recorded for bottleneck ${input.bottleneckId}. Please update status manually.`
      );
    }
  } catch (error) {
    console.error("[recordOptimization] Failed to record optimization:", error);
    throw error;
  }
}

/**
 * Get all bottlenecks
 *
 * Usage:
 * ```typescript
 * const bottlenecks = await getAllBottlenecks();
 * ```
 */
export async function getAllBottlenecks() {
  try {
    return await getServerPerformanceMetricsRepository().listBottlenecks();
  } catch (error) {
    console.error("[getAllBottlenecks] Failed to get bottlenecks:", error);
    throw error;
  }
}

/**
 * Get bottlenecks by status
 *
 * Usage:
 * ```typescript
 * const identifiedBottlenecks = await getBottlenecksByStatus(BottleneckStatus.IDENTIFIED);
 * ```
 */
export async function getBottlenecksByStatus(status: BottleneckStatus) {
  try {
    return await getServerPerformanceMetricsRepository().listBottlenecks({
      status,
    });
  } catch (error) {
    console.error("[getBottlenecksByStatus] Failed to get bottlenecks:", error);
    throw error;
  }
}
