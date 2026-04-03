// Generate Performance Report Action
// Feature: 003-performance-audit

"use server";

import type { PerformanceReport } from "../contracts";
import { generatePerformanceReport as generateReport } from "../lib/analyzer";
import { getServerPerformanceMetricsRepository } from "../repositories/server-performance-metrics-repository";
import type { PerformanceReportQuery } from "../types";

/**
 * Generate comprehensive performance report
 *
 * Usage:
 * ```typescript
 * const report = await generatePerformanceReport({
 *   timeRange: { start: new Date(Date.now() - 24*60*60*1000), end: new Date() },
 *   routes: ['/projects/[id]'],
 * });
 * ```
 */
export async function generatePerformanceReport(
  query: PerformanceReportQuery
): Promise<PerformanceReport> {
  try {
    // Fetch metrics for the time range
    const metrics =
      await getServerPerformanceMetricsRepository().getMetricsByTimeRange(
        query.timeRange
      );

    // Fetch baselines
    const baselines =
      await getServerPerformanceMetricsRepository().getBaselines();
    const baselineMap = new Map(
      baselines.map((b) => [
        b.metricName,
        {
          targetValue: b.targetValue,
          warningThreshold: b.warningThreshold,
          criticalThreshold: b.criticalThreshold,
          unit: b.unit,
        },
      ])
    );

    // Generate report using analyzer
    const reportData = generateReport(metrics, baselineMap, query.timeRange);

    // Return complete report with metadata
    return {
      id: crypto.randomUUID(),
      generatedAt: new Date(),
      timeRange: query.timeRange,
      summary: reportData.summary,
      bottlenecks: [], // TODO: Aggregate bottlenecks into summaries
      recommendations: reportData.recommendations,
    };
  } catch (error) {
    console.error("[generatePerformanceReport] Failed:", error);
    throw error;
  }
}

/**
 * Get performance summary for dashboard
 *
 * Usage:
 * ```typescript
 * const summary = await getPerformanceSummary({ hours: 24 });
 * ```
 */
export async function getPerformanceSummary(options: {
  hours?: number;
  routes?: string[];
}): Promise<{
  totalMetrics: number;
  averagePageLoadTime: number;
  slowQueriesCount: number;
  averageBundleSize: number;
  webVitals: {
    cls: number;
    fid: number;
    fcp: number;
    lcp: number;
    ttfb: number;
  };
  bottlenecksCount: number;
}> {
  try {
    const timeRange = {
      start: new Date(Date.now() - (options.hours || 24) * 60 * 60 * 1000),
      end: new Date(),
    };

    const report = await generatePerformanceReport({ timeRange });

    return {
      totalMetrics: report.summary.totalMetrics,
      averagePageLoadTime: report.summary.averagePageLoadTime,
      slowQueriesCount: report.summary.slowQueriesCount,
      averageBundleSize: report.summary.averageBundleSize,
      webVitals: report.summary.webVitals,
      bottlenecksCount: report.bottlenecks.length,
    };
  } catch (error) {
    console.error("[getPerformanceSummary] Failed:", error);
    throw error;
  }
}

/**
 * Export performance report as JSON
 *
 * Usage:
 * ```typescript
 * const jsonData = await exportPerformanceReport(report);
 * ```
 */
export async function exportPerformanceReport(
  report: PerformanceReport
): Promise<string> {
  return JSON.stringify(report, null, 2);
}

/**
 * Identify bottlenecks and save to database
 *
 * Usage:
 * ```typescript
 * await identifyAndSaveBottlenecks({
 *   timeRange: { start: new Date(Date.now() - 24*60*60*1000), end: new Date() },
 * });
 * ```
 */
export async function identifyAndSaveBottlenecks(_options: {
  timeRange: { start: Date; end: Date };
}): Promise<{
  identified: number;
  saved: number;
}> {
  try {
    // TODO: Implement bottleneck identification and saving
    // This requires raw bottleneck data, not summaries
    return {
      identified: 0,
      saved: 0,
    };
  } catch (error) {
    console.error("[identifyAndSaveBottlenecks] Failed:", error);
    throw error;
  }
}

/**
 * Get performance trends over time
 *
 * Usage:
 * ```typescript
 * const trends = await getPerformanceTrends({
 *   metricName: 'page_load_time',
 *   days: 7,
 * });
 * ```
 */
export async function getPerformanceTrends(options: {
  metricName: string;
  days?: number;
  route?: string;
}): Promise<{
  metricName: string;
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: "improving" | "stable" | "degrading";
  averageValue: number;
  changePercentage: number;
}> {
  try {
    const timeRange = {
      start: new Date(Date.now() - (options.days || 7) * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const metrics =
      await getServerPerformanceMetricsRepository().getMetricsByTimeRange(
        timeRange,
        {
          name: options.metricName,
          route: options.route,
        }
      );

    // Sort by timestamp
    const sortedMetrics = metrics.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    if (sortedMetrics.length < 2) {
      return {
        metricName: options.metricName,
        dataPoints: sortedMetrics.map((m) => ({
          timestamp: m.timestamp,
          value: m.value,
        })),
        trend: "stable",
        averageValue:
          sortedMetrics.length > 0
            ? sortedMetrics.reduce((sum, m) => sum + m.value, 0) /
              sortedMetrics.length
            : 0,
        changePercentage: 0,
      };
    }

    // Calculate trend
    const firstValue = sortedMetrics[0].value;
    const lastValue = sortedMetrics[sortedMetrics.length - 1].value;
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;

    let trend: "improving" | "stable" | "degrading";
    if (Math.abs(changePercentage) < 10) {
      trend = "stable";
    } else if (changePercentage < 0) {
      trend = "improving";
    } else {
      trend = "degrading";
    }

    const averageValue =
      sortedMetrics.reduce((sum, m) => sum + m.value, 0) / sortedMetrics.length;

    return {
      metricName: options.metricName,
      dataPoints: sortedMetrics.map((m) => ({
        timestamp: m.timestamp,
        value: m.value,
      })),
      trend,
      averageValue,
      changePercentage,
    };
  } catch (error) {
    console.error("[getPerformanceTrends] Failed:", error);
    throw error;
  }
}
