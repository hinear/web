// Bottleneck Tracker
// Feature: 003-performance-audit (User Story 3: Monitoring)

/**
 * Bottleneck Tracker for performance issues
 *
 * Identifies, tracks, and manages performance bottlenecks throughout their lifecycle.
 */

import {
  BottleneckCategory,
  type BottleneckSeverity,
  BottleneckStatus,
} from "../contracts";
import { getServerPerformanceMetricsRepository } from "../repositories/server-performance-metrics-repository";
import type { PerformanceBottleneck, PerformanceMetric } from "../types";
import { analyzeMetrics } from "./analyzer";
import { baselineManager } from "./baseline-manager";

export class BottleneckTracker {
  /**
   * Identify bottlenecks by comparing metrics to baselines
   */
  async identifyBottlenecks(
    metrics: PerformanceMetric[],
    baselines?: Map<string, { targetValue: number; unit: string }>
  ): Promise<Omit<PerformanceBottleneck, "id">[]> {
    // Use provided baselines or fetch from baseline manager
    if (!baselines) {
      const allBaselines = await baselineManager.getAllBaselines();
      baselines = new Map(
        allBaselines.map((b) => [
          b.metricName,
          { targetValue: b.targetValue, unit: b.unit },
        ])
      );
    }

    // Use analyzer to identify bottlenecks
    return analyzeMetrics(metrics, baselines);
  }

  /**
   * Update bottleneck status
   */
  async updateStatus(
    bottleneckId: string,
    status: BottleneckStatus
  ): Promise<void> {
    // TODO: Implement updateBottleneckStatus in repository
    // await getServerPerformanceMetricsRepository().updateBottleneckStatus(
    //   bottleneckId,
    //   status
    // );

    console.log(
      `[BottleneckTracker] Would update bottleneck ${bottleneckId} to ${status}`
    );
  }

  /**
   * Get bottlenecks with optional filters
   */
  async getBottlenecks(filters?: {
    category?: BottleneckCategory;
    severity?: BottleneckSeverity;
    status?: BottleneckStatus;
  }): Promise<PerformanceBottleneck[]> {
    const bottlenecks =
      await getServerPerformanceMetricsRepository().listBottlenecks(filters);
    return bottlenecks as any;
  }

  /**
   * Get a specific bottleneck by ID
   */
  async getBottleneck(
    bottleneckId: string
  ): Promise<PerformanceBottleneck | null> {
    // TODO: Implement getBottleneckById in repository
    const bottlenecks =
      await getServerPerformanceMetricsRepository().listBottlenecks();
    return (bottlenecks.find((b: any) => b.id === bottleneckId) || null) as any;
  }

  /**
   * Record an optimization for a bottleneck
   */
  async recordOptimization(
    bottleneckId: string,
    optimization: {
      title: string;
      description: string;
      beforeValue: number;
      afterValue: number;
      implementation: string;
    }
  ): Promise<void> {
    const improvementPercentage =
      ((optimization.beforeValue - optimization.afterValue) /
        optimization.beforeValue) *
      100;

    await getServerPerformanceMetricsRepository().saveOptimizationRecord({
      bottleneckId,
      title: optimization.title,
      description: optimization.description || "",
      beforeValue: optimization.beforeValue,
      afterValue: optimization.afterValue,
      improvementPercentage,
      implementation: optimization.implementation,
      createdAt: new Date(),
      verifiedAt: null,
    });

    console.log(
      `[BottleneckTracker] Recorded optimization for bottleneck ${bottleneckId}`
    );
  }

  /**
   * Get active bottlenecks (not resolved)
   */
  async getActiveBottlenecks(): Promise<PerformanceBottleneck[]> {
    return this.getBottlenecks({ status: BottleneckStatus.IDENTIFIED });
  }

  /**
   * Get bottlenecks by severity
   */
  async getBottlenecksBySeverity(
    severity: BottleneckSeverity
  ): Promise<PerformanceBottleneck[]> {
    return this.getBottlenecks({ severity });
  }

  /**
   * Get bottlenecks by category
   */
  async getBottlenecksByCategory(
    category: BottleneckCategory
  ): Promise<PerformanceBottleneck[]> {
    return this.getBottlenecks({ category });
  }

  /**
   * Auto-identify bottlenecks from recent metrics
   */
  async scanForBottlenecks(
    timeRange: { start: Date; end: Date },
    options?: {
      route?: string;
      environment?: PerformanceMetric["environment"];
    }
  ): Promise<PerformanceBottleneck[]> {
    // Fetch recent metrics
    const metrics =
      await getServerPerformanceMetricsRepository().getMetricsByTimeRange(
        timeRange,
        options
      );

    // Identify bottlenecks
    const newBottlenecks = await this.identifyBottlenecks(metrics);

    // Save new bottlenecks
    const savedBottlenecks: PerformanceBottleneck[] = [];
    for (const bottleneck of newBottlenecks) {
      const saved =
        await getServerPerformanceMetricsRepository().saveBottleneck(
          bottleneck
        );
      savedBottlenecks.push(saved);
    }

    console.log(
      `[BottleneckTracker] Scanned ${metrics.length} metrics and identified ${newBottlenecks.length} bottlenecks`
    );

    return savedBottlenecks;
  }

  /**
   * Get bottleneck statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<BottleneckStatus, number>;
    bySeverity: Record<BottleneckSeverity, number>;
    byCategory: Record<BottleneckCategory, number>;
  }> {
    const allBottlenecks = await this.getBottlenecks();

    const byStatus: Record<BottleneckStatus, number> = {
      IDENTIFIED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    const bySeverity: Record<BottleneckSeverity, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    const byCategory: Record<BottleneckCategory, number> = {
      [BottleneckCategory.DATABASE_QUERY]: 0,
      [BottleneckCategory.LARGE_BUNDLE]: 0,
      [BottleneckCategory.SLOW_API]: 0,
      [BottleneckCategory.MEMORY_LEAK]: 0,
      [BottleneckCategory.EXCESSIVE_RENDERS]: 0,
      [BottleneckCategory.NETWORK_REQUESTS]: 0,
      [BottleneckCategory.SLOW_LCP]: 0,
    };

    for (const bottleneck of allBottlenecks) {
      byStatus[bottleneck.status]++;
      bySeverity[bottleneck.severity]++;
      byCategory[bottleneck.category]++;
    }

    return {
      total: allBottlenecks.length,
      byStatus,
      bySeverity,
      byCategory,
    };
  }
}

// Export singleton instance
export const bottleneckTracker = new BottleneckTracker();
