// Set Baseline Action
// Feature: 003-performance-audit

"use server";

import { performanceMetricsRepository } from "../repositories/performance-metrics-repository";
import type { CreateBaselineInput } from "../types";

/**
 * Server action to set a performance baseline
 *
 * Usage:
 * ```typescript
 * await setBaseline({
 *   metricName: "page_load_time",
 *   route: "/projects/[id]",
 *   targetValue: 2000,
 *   warningThreshold: 3000,
 *   criticalThreshold: 4000,
 *   unit: "ms",
 * });
 * ```
 */
export async function setBaseline(input: CreateBaselineInput): Promise<void> {
  try {
    await performanceMetricsRepository.saveBaseline({
      metricName: input.metricName,
      route: input.route || null,
      targetValue: input.targetValue,
      warningThreshold: input.warningThreshold,
      criticalThreshold: input.criticalThreshold,
      unit: input.unit,
    });
  } catch (error) {
    console.error("[setBaseline] Failed to set baseline:", error);
    throw error;
  }
}

/**
 * Initialize default performance baselines
 *
 * Usage:
 * ```typescript
 * await initializeDefaultBaselines();
 * ```
 */
export async function initializeDefaultBaselines(): Promise<void> {
  const defaults: CreateBaselineInput[] = [
    {
      metricName: "page_load_time",
      targetValue: 2000,
      warningThreshold: 3000,
      criticalThreshold: 4000,
      unit: "ms",
    },
    {
      metricName: "query_duration",
      targetValue: 200,
      warningThreshold: 300,
      criticalThreshold: 500,
      unit: "ms",
    },
    {
      metricName: "bundle_size",
      targetValue: 200,
      warningThreshold: 300,
      criticalThreshold: 400,
      unit: "KB",
    },
    {
      metricName: "FCP",
      targetValue: 1800,
      warningThreshold: 3000,
      criticalThreshold: 4000,
      unit: "ms",
    },
    {
      metricName: "LCP",
      targetValue: 2500,
      warningThreshold: 4000,
      criticalThreshold: 6000,
      unit: "ms",
    },
    {
      metricName: "TTFB",
      targetValue: 800,
      warningThreshold: 1200,
      criticalThreshold: 2000,
      unit: "ms",
    },
  ];

  for (const baseline of defaults) {
    try {
      await setBaseline(baseline);
    } catch (error) {
      console.error(
        `[initializeDefaultBaselines] Failed to set baseline for ${baseline.metricName}:`,
        error
      );
      // Continue with other baselines even if one fails
    }
  }
}

/**
 * Update an existing baseline
 *
 * Usage:
 * ```typescript
 * await updateBaseline("page_load_time", {
 *   targetValue: 1500,
 *   warningThreshold: 2250,
 *   criticalThreshold: 3000,
 * });
 * ```
 */
export async function updateBaseline(
  _metricName: string,
  _updates: Partial<Omit<CreateBaselineInput, "metricName">>
): Promise<void> {
  try {
    // This would require implementing an update method in the repository
    // For now, we'll just log a warning
    console.warn(
      "[updateBaseline] Update not yet implemented. Please use Supabase dashboard directly."
    );
  } catch (error) {
    console.error("[updateBaseline] Failed to update baseline:", error);
    throw error;
  }
}

/**
 * Delete a baseline
 *
 * Usage:
 * ```typescript
 * await deleteBaseline("page_load_time", "/projects/[id]");
 * ```
 */
export async function deleteBaseline(
  _metricName: string,
  _route?: string
): Promise<void> {
  try {
    console.warn(
      "[deleteBaseline] Delete not yet implemented. Remove the baseline directly from storage if needed."
    );
  } catch (error) {
    console.error("[deleteBaseline] Failed to delete baseline:", error);
    throw error;
  }
}

/**
 * Get all baselines
 *
 * Usage:
 * ```typescript
 * const baselines = await getAllBaselines();
 * ```
 */
export async function getAllBaselines() {
  try {
    return await performanceMetricsRepository.getBaselines();
  } catch (error) {
    console.error("[getAllBaselines] Failed to get baselines:", error);
    throw error;
  }
}
