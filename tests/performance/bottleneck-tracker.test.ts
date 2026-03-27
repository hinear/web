import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAllBaselinesMock,
  saveOptimizationRecordMock,
  getMetricsByTimeRangeMock,
  saveBottleneckMock,
  listBottlenecksMock,
  analyzeMetricsMock,
} = vi.hoisted(() => ({
  getAllBaselinesMock: vi.fn(),
  saveOptimizationRecordMock: vi.fn(),
  getMetricsByTimeRangeMock: vi.fn(),
  saveBottleneckMock: vi.fn(),
  listBottlenecksMock: vi.fn(),
  analyzeMetricsMock: vi.fn(),
}));

vi.mock("@/features/performance/lib/baseline-manager", () => ({
  baselineManager: {
    getAllBaselines: getAllBaselinesMock,
  },
}));

vi.mock(
  "@/features/performance/repositories/performance-metrics-repository",
  () => ({
    performanceMetricsRepository: {
      getMetricsByTimeRange: getMetricsByTimeRangeMock,
      listBottlenecks: listBottlenecksMock,
      saveBottleneck: saveBottleneckMock,
      saveOptimizationRecord: saveOptimizationRecordMock,
    },
  })
);

vi.mock("@/features/performance/lib/analyzer", () => ({
  analyzeMetrics: analyzeMetricsMock,
}));

import {
  BottleneckCategory,
  BottleneckSeverity,
  BottleneckStatus,
  Environment,
  MetricUnit,
} from "@/features/performance/contracts";
import { BottleneckTracker } from "@/features/performance/lib/bottleneck-tracker";
import type {
  OptimizationRecord,
  PerformanceBaseline,
  PerformanceMetric,
} from "@/features/performance/types";

describe("BottleneckTracker", () => {
  const tracker = new BottleneckTracker();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads baselines and delegates metric analysis when identifyBottlenecks runs", async () => {
    const metrics: PerformanceMetric[] = [
      {
        id: "metric-1",
        name: "page_load_time",
        value: 4200,
        unit: MetricUnit.MILLISECONDS,
        timestamp: new Date("2026-03-27T00:00:00.000Z"),
        route: "/projects/project-1",
        environment: Environment.PRODUCTION,
        metadata: null,
      },
    ];

    const baselines: PerformanceBaseline[] = [
      {
        id: "baseline-1",
        metricName: "page_load_time",
        route: null,
        targetValue: 2000,
        warningThreshold: 3000,
        criticalThreshold: 4000,
        unit: "ms",
        createdAt: new Date("2026-03-20T00:00:00.000Z"),
        updatedAt: new Date("2026-03-20T00:00:00.000Z"),
      },
    ];

    const detected = [
      {
        title: "Slow page load",
        category: BottleneckCategory.SLOW_LCP,
        severity: BottleneckSeverity.MEDIUM,
        description: "Page load exceeds target.",
        location: "/projects/project-1",
        currentValue: 4200,
        targetValue: 2000,
        unit: "ms",
        impact: "Slower project loading",
        suggestion: "Split the route bundle",
        status: BottleneckStatus.IDENTIFIED,
        identifiedAt: new Date("2026-03-27T00:00:00.000Z"),
        resolvedAt: null,
      },
    ];

    getAllBaselinesMock.mockResolvedValue(baselines);
    analyzeMetricsMock.mockReturnValue(detected);

    const result = await tracker.identifyBottlenecks(metrics);

    expect(getAllBaselinesMock).toHaveBeenCalledTimes(1);
    expect(analyzeMetricsMock).toHaveBeenCalledWith(
      metrics,
      new Map([["page_load_time", { targetValue: 2000, unit: "ms" }]])
    );
    expect(result).toEqual(detected);
  });

  it("records an optimization using the domain optimization record shape", async () => {
    saveOptimizationRecordMock.mockResolvedValue({
      id: "opt-1",
      bottleneckId: "bottleneck-1",
      title: "Added query index",
      description: "Indexed issues(project_id, status)",
      beforeValue: 500,
      afterValue: 125,
      improvementPercentage: 75,
      implementation: "migration 004_query_indexes.sql",
      createdAt: new Date("2026-03-27T00:00:00.000Z"),
      verifiedAt: null,
    } satisfies OptimizationRecord);

    await tracker.recordOptimization("bottleneck-1", {
      title: "Added query index",
      description: "Indexed issues(project_id, status)",
      beforeValue: 500,
      afterValue: 125,
      implementation: "migration 004_query_indexes.sql",
    });

    expect(saveOptimizationRecordMock).toHaveBeenCalledWith({
      bottleneckId: "bottleneck-1",
      title: "Added query index",
      description: "Indexed issues(project_id, status)",
      beforeValue: 500,
      afterValue: 125,
      improvementPercentage: 75,
      implementation: "migration 004_query_indexes.sql",
      createdAt: expect.any(Date),
      verifiedAt: null,
    });
  });

  it("fetches metrics with the new timeRange + options signature and persists identified bottlenecks", async () => {
    const timeRange = {
      start: new Date("2026-03-26T00:00:00.000Z"),
      end: new Date("2026-03-27T00:00:00.000Z"),
    };

    const metrics: PerformanceMetric[] = [
      {
        id: "metric-1",
        name: "query_duration",
        value: 450,
        unit: MetricUnit.MILLISECONDS,
        timestamp: new Date("2026-03-26T12:00:00.000Z"),
        route: "/projects/project-1",
        environment: Environment.PRODUCTION,
        metadata: null,
      },
    ];

    const detected = [
      {
        title: "Slow query",
        category: BottleneckCategory.DATABASE_QUERY,
        severity: BottleneckSeverity.HIGH,
        description: "Query duration exceeds threshold.",
        location: "/projects/project-1",
        currentValue: 450,
        targetValue: 200,
        unit: "ms",
        impact: "Project page feels delayed",
        suggestion: "Add query index",
        status: BottleneckStatus.IDENTIFIED,
        identifiedAt: new Date("2026-03-27T00:00:00.000Z"),
        resolvedAt: null,
      },
    ];

    getMetricsByTimeRangeMock.mockResolvedValue(metrics);
    analyzeMetricsMock.mockReturnValue(detected);
    getAllBaselinesMock.mockResolvedValue([]);
    saveBottleneckMock.mockImplementation(async (value) => ({
      id: "saved-bottleneck-1",
      ...value,
    }));

    const result = await tracker.scanForBottlenecks(timeRange, {
      route: "/projects/project-1",
      environment: Environment.PRODUCTION,
    });

    expect(getMetricsByTimeRangeMock).toHaveBeenCalledWith(timeRange, {
      route: "/projects/project-1",
      environment: Environment.PRODUCTION,
    });
    expect(saveBottleneckMock).toHaveBeenCalledWith(detected[0]);
    expect(result).toEqual([
      {
        id: "saved-bottleneck-1",
        ...detected[0],
      },
    ]);
  });
});
