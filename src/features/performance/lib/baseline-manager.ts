// Baseline Manager
// Feature: 003-performance-audit (User Story 3: Monitoring)

/**
 * Baseline Manager for performance thresholds
 *
 * Manages performance baselines that define acceptable ranges for metrics.
 * Baselines include target values, warning thresholds, and critical thresholds.
 */

import { performanceMetricsRepository } from "../repositories/performance-metrics-repository";
import type { PerformanceBaseline } from "../types";

/**
 * Default baselines for common metrics
 */
const DEFAULT_BASELINES: Array<
  Omit<PerformanceBaseline, "id" | "createdAt" | "updatedAt">
> = [
  {
    metricName: "page_load_time",
    route: null,
    targetValue: 2000, // 2 seconds
    warningThreshold: 3000, // 3 seconds
    criticalThreshold: 4000, // 4 seconds
    unit: "ms",
  },
  {
    metricName: "query_duration",
    route: null,
    targetValue: 200, // 200ms
    warningThreshold: 300, // 300ms
    criticalThreshold: 500, // 500ms
    unit: "ms",
  },
  {
    metricName: "bundle_size",
    route: null,
    targetValue: 200, // 200KB
    warningThreshold: 250, // 250KB
    criticalThreshold: 300, // 300KB
    unit: "KB",
  },
  {
    metricName: "first_contentful_paint",
    route: null,
    targetValue: 1500, // 1.5s
    warningThreshold: 2000, // 2s
    criticalThreshold: 3000, // 3s
    unit: "ms",
  },
  {
    metricName: "largest_contentful_paint",
    route: null,
    targetValue: 2000, // 2s
    warningThreshold: 2500, // 2.5s
    criticalThreshold: 4000, // 4s
    unit: "ms",
  },
  {
    metricName: "cumulative_layout_shift",
    route: null,
    targetValue: 0.1,
    warningThreshold: 0.2,
    criticalThreshold: 0.3,
    unit: "score",
  },
];

export class BaselineManager {
  private baselineCache = new Map<string, PerformanceBaseline>();
  private cacheExpiry: number | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get baseline for a specific metric and route
   * Falls back to default baseline if no specific baseline exists
   */
  async getBaseline(
    metricName: string,
    route?: string | null
  ): Promise<PerformanceBaseline | null> {
    await this.ensureCache();

    // Try to find route-specific baseline first
    if (route) {
      const routeSpecific = this.baselineCache.get(`${metricName}:${route}`);
      if (routeSpecific) {
        return routeSpecific;
      }
    }

    // Fall back to global baseline for metric
    const globalBaseline = this.baselineCache.get(metricName);
    if (globalBaseline) {
      return globalBaseline;
    }

    // Fall back to default baselines
    const defaultBaseline = DEFAULT_BASELINES.find(
      (b) => b.metricName === metricName
    );
    if (defaultBaseline) {
      return {
        ...defaultBaseline,
        id: "default",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return null;
  }

  /**
   * Set or update a baseline
   * Validates that thresholds are in correct order: target < warning < critical
   */
  async setBaseline(
    baseline: Omit<PerformanceBaseline, "id" | "createdAt" | "updatedAt">
  ): Promise<PerformanceBaseline> {
    // Validate threshold values
    if (baseline.targetValue >= baseline.warningThreshold) {
      throw new Error("Warning threshold must be greater than target value");
    }
    if (baseline.warningThreshold >= baseline.criticalThreshold) {
      throw new Error(
        "Critical threshold must be greater than warning threshold"
      );
    }

    // Save to database
    const saved = await performanceMetricsRepository.saveBaseline({
      metricName: baseline.metricName,
      route: baseline.route,
      targetValue: baseline.targetValue,
      warningThreshold: baseline.warningThreshold,
      criticalThreshold: baseline.criticalThreshold,
      unit: baseline.unit,
    });

    // Update cache
    const cacheKey = baseline.route
      ? `${baseline.metricName}:${baseline.route}`
      : baseline.metricName;
    this.baselineCache.set(cacheKey, saved);

    return saved;
  }

  /**
   * Check if current metric values violate any baselines
   */
  async checkBaselines(
    metrics: Array<{
      name: string;
      value: number;
      route?: string | null;
    }>
  ): Promise<
    Array<{
      metricName: string;
      route: string | null;
      currentValue: number;
      thresholdType: "warning" | "critical";
      thresholdValue: number;
      targetValue: number;
      baseline: PerformanceBaseline;
    }>
  > {
    const violations: Array<{
      metricName: string;
      route: string | null;
      currentValue: number;
      thresholdType: "warning" | "critical";
      thresholdValue: number;
      targetValue: number;
      baseline: PerformanceBaseline;
    }> = [];

    for (const metric of metrics) {
      const baseline = await this.getBaseline(metric.name, metric.route);
      if (!baseline) continue;

      // Check critical threshold first
      if (metric.value > baseline.criticalThreshold) {
        violations.push({
          metricName: metric.name,
          route: metric.route || null,
          currentValue: metric.value,
          thresholdType: "critical",
          thresholdValue: baseline.criticalThreshold,
          targetValue: baseline.targetValue,
          baseline,
        });
      }
      // Check warning threshold
      else if (metric.value > baseline.warningThreshold) {
        violations.push({
          metricName: metric.name,
          route: metric.route || null,
          currentValue: metric.value,
          thresholdType: "warning",
          thresholdValue: baseline.warningThreshold,
          targetValue: baseline.targetValue,
          baseline,
        });
      }
    }

    return violations;
  }

  /**
   * Delete a baseline
   */
  async deleteBaseline(baselineId: string): Promise<void> {
    // This would be implemented in the repository
    // For now, just remove from cache
    for (const [key, baseline] of this.baselineCache.entries()) {
      if (baseline.id === baselineId) {
        this.baselineCache.delete(key);
        break;
      }
    }
  }

  /**
   * Get all configured baselines
   */
  async getAllBaselines(): Promise<PerformanceBaseline[]> {
    await this.ensureCache();

    return Array.from(this.baselineCache.values());
  }

  /**
   * Initialize default baselines in database
   */
  async initializeDefaults(): Promise<void> {
    const existing = await this.getAllBaselines();

    // Only add defaults that don't exist
    for (const defaultBaseline of DEFAULT_BASELINES) {
      const exists = existing.some(
        (b) =>
          b.metricName === defaultBaseline.metricName &&
          b.route === defaultBaseline.route
      );

      if (!exists) {
        await this.setBaseline(defaultBaseline);
        console.log(
          `[BaselineManager] Initialized default baseline for ${defaultBaseline.metricName}`
        );
      }
    }
  }

  /**
   * Ensure cache is populated and fresh
   */
  private async ensureCache(): Promise<void> {
    const now = Date.now();

    // Check if cache is still valid
    if (this.cacheExpiry && now < this.cacheExpiry) {
      return;
    }

    // Fetch from database
    const baselines = await performanceMetricsRepository.getBaselines();

    // Rebuild cache
    this.baselineCache.clear();
    for (const baseline of baselines) {
      const cacheKey = baseline.route
        ? `${baseline.metricName}:${baseline.route}`
        : baseline.metricName;
      this.baselineCache.set(cacheKey, baseline as any);
    }

    // Set cache expiry
    this.cacheExpiry = now + this.CACHE_TTL;
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.baselineCache.clear();
    this.cacheExpiry = null;
  }
}

// Export singleton instance
export const baselineManager = new BaselineManager();
