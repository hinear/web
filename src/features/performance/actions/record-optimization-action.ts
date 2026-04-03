// Record Optimization Action
// Feature: 003-performance-audit

"use server";

import { getServerPerformanceMetricsRepository } from "../repositories/server-performance-metrics-repository";
import type { RecordOptimizationInput } from "../types";

/**
 * Record a performance optimization with before/after metrics
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
    // TODO: Implement bottleneck status update
    // await getServerPerformanceMetricsRepository().updateBottleneckStatus(
    //   input.bottleneckId,
    //   "RESOLVED"
    // );

    console.log(
      `[recordOptimization] Optimization recorded for bottleneck ${input.bottleneckId}.`
    );
  } catch (error) {
    console.error("[recordOptimization] Failed:", error);
    throw error;
  }
}

/**
 * Calculate improvement percentage
 *
 * Usage:
 * ```typescript
 * const improvement = calculateImprovement(500, 100); // 80% improvement
 * ```
 */
export function calculateImprovement(
  beforeValue: number,
  afterValue: number
): number {
  if (beforeValue === 0) {
    throw new Error("Before value cannot be zero");
  }

  return ((beforeValue - afterValue) / beforeValue) * 100;
}

/**
 * Validate optimization meets minimum requirements
 *
 * Usage:
 * ```typescript
 * const isValid = validateOptimization(500, 200, 50); // true (50% improvement)
 * ```
 */
export function validateOptimization(
  beforeValue: number,
  afterValue: number,
  minimumImprovement: number = 30
): boolean {
  const improvement = calculateImprovement(beforeValue, afterValue);
  return improvement >= minimumImprovement && afterValue < beforeValue;
}

/**
 * Get optimization summary for a bottleneck
 *
 * Usage:
 * ```typescript
 * const summary = await getOptimizationSummary("bottleneck-123");
 * ```
 */
export async function getOptimizationSummary(bottleneckId: string): Promise<{
  bottleneckId: string;
  optimizations: Array<{
    title: string;
    beforeValue: number;
    afterValue: number;
    improvementPercentage: number;
    createdAt: Date;
  }>;
  totalImprovement: number;
}> {
  try {
    const records =
      await getServerPerformanceMetricsRepository().getOptimizationRecords(
        bottleneckId
      );

    const totalImprovement = 0; // TODO: Calculate from optimization records

    return {
      bottleneckId,
      optimizations: records.map((r) => ({
        title: r.title,
        beforeValue: r.beforeValue,
        afterValue: r.afterValue,
        improvementPercentage: r.improvementPercentage,
        createdAt: r.createdAt,
      })),
      totalImprovement,
    };
  } catch (error) {
    console.error("[getOptimizationSummary] Failed:", error);
    throw error;
  }
}

/**
 * Generate optimization report
 *
 * Usage:
 * ```typescript
 * const report = await generateOptimizationReport({
 *   timeRange: { start: new Date(Date.now() - 30*24*60*60*1000), end: new Date() },
 * });
 * ```
 */
export async function generateOptimizationReport(_options: {
  timeRange: { start: Date; end: Date };
}): Promise<{
  totalOptimizations: number;
  averageImprovement: number;
  optimizationsByCategory: Record<string, number>;
  topImprovements: Array<{
    title: string;
    improvementPercentage: number;
    category: string;
  }>;
}> {
  try {
    const bottlenecks =
      await getServerPerformanceMetricsRepository().listBottlenecks({
        status: "RESOLVED",
      });

    const totalImprovement = 0;
    const optimizationsByCategory: Record<string, number> = {};
    const allImprovements: Array<{
      title: string;
      improvementPercentage: number;
      category: string;
    }> = [];

    for (const bottleneck of bottlenecks) {
      const records =
        await getServerPerformanceMetricsRepository().getOptimizationRecords(
          bottleneck.id
        );

      if (records.length > 0) {
        const averageImprovement =
          records.reduce(
            (sum, record) => sum + record.improvementPercentage,
            0
          ) / records.length;

        allImprovements.push({
          title: bottleneck.title,
          improvementPercentage: averageImprovement,
          category: bottleneck.category,
        });

        optimizationsByCategory[bottleneck.category] =
          (optimizationsByCategory[bottleneck.category] || 0) + 1;

        // totalImprovement += averageImprovement;
      }
    }

    // Sort by improvement percentage
    const topImprovements = allImprovements
      .sort((a, b) => b.improvementPercentage - a.improvementPercentage)
      .slice(0, 10);

    return {
      totalOptimizations: bottlenecks.length,
      averageImprovement:
        allImprovements.length > 0
          ? totalImprovement / allImprovements.length
          : 0,
      optimizationsByCategory,
      topImprovements,
    };
  } catch (error) {
    console.error("[generateOptimizationReport] Failed:", error);
    throw error;
  }
}
