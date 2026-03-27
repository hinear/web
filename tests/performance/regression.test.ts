import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMetricsByTimeRangeMock, getBaselineMock } = vi.hoisted(() => ({
  getMetricsByTimeRangeMock: vi.fn(),
  getBaselineMock: vi.fn(),
}));

vi.mock(
  "@/features/performance/repositories/performance-metrics-repository",
  () => ({
    performanceMetricsRepository: {
      getMetricsByTimeRange: getMetricsByTimeRangeMock,
    },
  })
);

vi.mock("@/features/performance/lib/baseline-manager", () => ({
  baselineManager: {
    getBaseline: getBaselineMock,
  },
}));

import { Environment, MetricUnit } from "@/features/performance/contracts";
import { RegressionDetector } from "@/features/performance/lib/regression-detector";
import type { PerformanceMetric } from "@/features/performance/types";

describe("RegressionDetector", () => {
  const detector = new RegressionDetector();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the structured timeRange/options pair to the repository and reports regressions against route baselines", async () => {
    const timeRange = {
      start: new Date("2026-03-20T00:00:00.000Z"),
      end: new Date("2026-03-27T00:00:00.000Z"),
    };

    const metrics: PerformanceMetric[] = [
      {
        id: "metric-1",
        name: "page_load_time",
        value: 2600,
        unit: MetricUnit.MILLISECONDS,
        timestamp: new Date("2026-03-26T00:00:00.000Z"),
        route: "/projects/project-1",
        environment: Environment.PRODUCTION,
        metadata: null,
      },
      {
        id: "metric-2",
        name: "page_load_time",
        value: 3000,
        unit: MetricUnit.MILLISECONDS,
        timestamp: new Date("2026-03-27T00:00:00.000Z"),
        route: "/projects/project-1",
        environment: Environment.PRODUCTION,
        metadata: null,
      },
    ];

    getMetricsByTimeRangeMock.mockResolvedValue(metrics);
    getBaselineMock.mockResolvedValue({
      id: "baseline-1",
      metricName: "page_load_time",
      route: "/projects/project-1",
      targetValue: 2000,
      warningThreshold: 2600,
      criticalThreshold: 3200,
      unit: "ms",
      createdAt: new Date("2026-03-20T00:00:00.000Z"),
      updatedAt: new Date("2026-03-20T00:00:00.000Z"),
    });

    const result = await detector.detectRegression(timeRange, {
      route: "/projects/project-1",
      environment: Environment.PRODUCTION,
    });

    expect(getMetricsByTimeRangeMock).toHaveBeenNthCalledWith(1, timeRange, {
      route: "/projects/project-1",
      environment: Environment.PRODUCTION,
    });
    expect(getBaselineMock).toHaveBeenCalledWith(
      "page_load_time",
      "/projects/project-1"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      metricName: "page_load_time",
      route: "/projects/project-1",
      baselineValue: 2000,
      trend: "stable",
    });
    expect(result[0]?.degradationPercentage).toBeGreaterThanOrEqual(20);
  });

  it("reuses the repository query signature when analyzing trends for a named route metric", async () => {
    const timeRange = {
      start: new Date("2026-03-20T00:00:00.000Z"),
      end: new Date("2026-03-27T00:00:00.000Z"),
    };

    getMetricsByTimeRangeMock.mockResolvedValue([
      {
        id: "metric-1",
        name: "query_duration",
        value: 100,
        unit: MetricUnit.MILLISECONDS,
        timestamp: new Date("2026-03-20T00:00:00.000Z"),
        route: "/projects/project-1",
        environment: Environment.PRODUCTION,
        metadata: null,
      },
      {
        id: "metric-2",
        name: "query_duration",
        value: 180,
        unit: MetricUnit.MILLISECONDS,
        timestamp: new Date("2026-03-27T00:00:00.000Z"),
        route: "/projects/project-1",
        environment: Environment.PRODUCTION,
        metadata: null,
      },
    ] satisfies PerformanceMetric[]);

    const trend = await detector.analyzeTrend(
      "query_duration",
      "/projects/project-1",
      timeRange
    );

    expect(getMetricsByTimeRangeMock).toHaveBeenCalledWith(timeRange, {
      name: "query_duration",
      route: "/projects/project-1",
    });
    expect(trend).toMatchObject({
      metricName: "query_duration",
      route: "/projects/project-1",
      trend: "stable",
      dataPoints: 2,
    });
  });
});
