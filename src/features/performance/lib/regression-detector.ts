// Regression Detector
// Feature: 003-performance-audit (User Story 3: Monitoring)

/**
 * Regression Detector for performance degradation
 *
 * Detects performance regressions by comparing current metrics to historical baselines.
 */

import { getServerPerformanceMetricsRepository } from "../repositories/server-performance-metrics-repository";
import type { PerformanceMetric } from "../types";
import { baselineManager } from "./baseline-manager";

export interface Regression {
  metricName: string;
  route: string | null;
  currentValue: number;
  baselineValue: number;
  degradationPercentage: number;
  trend: "improving" | "stable" | "degrading";
  confidence: "low" | "medium" | "high";
}

export interface TrendAnalysis {
  metricName: string;
  route: string | null;
  trend: "improving" | "stable" | "degrading";
  changeRate: number; // percentage per time period
  dataPoints: number;
  timeRange: { start: Date; end: Date };
}

/**
 * Regression detection thresholds
 */
const REGRESSION_THRESHOLDS = {
  degradation: 20, // 20% degradation triggers regression alert
  improvement: -20, // -20% (improvement) triggers positive alert
  confidence: {
    high: 0.9, // 90% confidence
    medium: 0.7, // 70% confidence
    low: 0.5, // 50% confidence
  },
};

export class RegressionDetector {
  /**
   * Detect regressions by comparing current metrics to historical baselines
   */
  async detectRegression(
    timeRange: { start: Date; end: Date },
    options?: {
      route?: string;
      environment?: PerformanceMetric["environment"];
    }
  ): Promise<Regression[]> {
    const regressions: Regression[] = [];

    // Get current metrics
    const currentMetrics =
      await getServerPerformanceMetricsRepository().getMetricsByTimeRange(
        timeRange,
        options
      );

    // Aggregate metrics by name and route
    const aggregated = this.aggregateMetrics(currentMetrics);

    // Check each aggregated metric for regression
    for (const [key, data] of aggregated.entries()) {
      const [metricName, route] = key.split(":");

      // Get baseline
      const baseline = await baselineManager.getBaseline(
        metricName,
        route || null
      );

      if (!baseline) continue;

      // Calculate degradation
      const currentValue = data.average;
      const baselineValue = baseline.targetValue;
      const degradationPercentage =
        ((currentValue - baselineValue) / baselineValue) * 100;

      // Check if regression threshold is met
      if (degradationPercentage >= REGRESSION_THRESHOLDS.degradation) {
        const trend = await this.analyzeTrend(
          metricName,
          route || null,
          timeRange
        );

        regressions.push({
          metricName,
          route: route || null,
          currentValue,
          baselineValue,
          degradationPercentage,
          trend: trend.trend,
          confidence: this.calculateConfidence(data, trend),
        });
      }
    }

    return regressions;
  }

  /**
   * Aggregate metrics by name and route
   */
  private aggregateMetrics(metrics: PerformanceMetric[]): Map<
    string,
    {
      values: number[];
      average: number;
      min: number;
      max: number;
      count: number;
    }
  > {
    const grouped = new Map<string, number[]>();

    // Group metrics
    for (const metric of metrics) {
      const key = metric.route
        ? `${metric.name}:${metric.route}`
        : `${metric.name}:`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)?.push(metric.value);
    }

    // Calculate statistics
    const aggregated = new Map();

    for (const [key, values] of grouped.entries()) {
      const average = values.reduce((sum, v) => sum + v, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      aggregated.set(key, {
        values,
        average,
        min,
        max,
        count: values.length,
      });
    }

    return aggregated;
  }

  /**
   * Analyze trend for a specific metric
   */
  async analyzeTrend(
    metricName: string,
    route: string | null,
    timeRange: { start: Date; end: Date }
  ): Promise<TrendAnalysis> {
    // Get metrics for the time range
    const metrics =
      await getServerPerformanceMetricsRepository().getMetricsByTimeRange(
        timeRange,
        {
          name: metricName,
          route: route || undefined,
        }
      );

    if (metrics.length < 2) {
      return {
        metricName,
        route,
        trend: "stable",
        changeRate: 0,
        dataPoints: metrics.length,
        timeRange,
      };
    }

    // Sort by timestamp
    const sorted = [...metrics].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calculate trend using linear regression
    const n = sorted.length;
    const xValues = sorted.map((m) => m.timestamp.getTime());
    const yValues = sorted.map((m) => m.value);

    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Calculate change rate (percentage per day)
    const timeSpan = (xValues[n - 1] - xValues[0]) / (1000 * 60 * 60 * 24); // days
    const changeRate = timeSpan === 0 ? 0 : (slope / yMean) * 100 * timeSpan;

    // Determine trend
    let trend: "improving" | "stable" | "degrading";
    if (changeRate < -5) {
      trend = "improving"; // Getting better (values decreasing)
    } else if (changeRate > 5) {
      trend = "degrading"; // Getting worse (values increasing)
    } else {
      trend = "stable"; // No significant change
    }

    return {
      metricName,
      route,
      trend,
      changeRate,
      dataPoints: n,
      timeRange,
    };
  }

  /**
   * Calculate confidence level for regression detection
   */
  private calculateConfidence(
    data: { values: number[]; count: number },
    trend: TrendAnalysis
  ): "low" | "medium" | "high" {
    // More data points = higher confidence
    if (data.count < 5) return "low";
    if (data.count < 10) return "medium";

    // Check trend consistency
    if (trend.trend === "degrading" && trend.changeRate > 10) return "high";
    if (trend.trend === "degrading" && trend.changeRate > 5) return "medium";

    return "low";
  }

  /**
   * Get regression report
   */
  async getRegressionReport(timeRange: { start: Date; end: Date }): Promise<{
    regressions: Regression[];
    summary: {
      total: number;
      byRoute: Record<string, number>;
      critical: number;
      warning: number;
    };
    recommendations: string[];
  }> {
    const regressions = await this.detectRegression(timeRange);

    // Generate summary
    const byRoute: Record<string, number> = {};
    let critical = 0;
    let warning = 0;

    for (const regression of regressions) {
      const route = regression.route || "global";
      byRoute[route] = (byRoute[route] || 0) + 1;

      if (regression.degradationPercentage >= 50) {
        critical++;
      } else {
        warning++;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (critical > 0) {
      recommendations.push(
        `Immediate action required: ${critical} critical regressions detected`
      );
    }

    if (warning > 0) {
      recommendations.push(`Investigate soon: ${warning} regressions detected`);
    }

    const degradingRoutes = Object.entries(byRoute)
      .filter(([, count]) => count > 2)
      .map(([route]) => route);

    if (degradingRoutes.length > 0) {
      recommendations.push(
        `Focus optimization efforts on: ${degradingRoutes.join(", ")}`
      );
    }

    return {
      regressions,
      summary: {
        total: regressions.length,
        byRoute,
        critical,
        warning,
      },
      recommendations,
    };
  }
}

// Export singleton instance
export const regressionDetector = new RegressionDetector();
