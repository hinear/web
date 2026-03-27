// Performance Investigation and Optimization Contracts
// Feature: 003-performance-audit

// ============================================================================
// Enums
// ============================================================================

/**
 * Categories of performance metrics
 */
export enum MetricCategory {
  DATABASE = "database",
  NETWORK = "network",
  RENDERING = "rendering",
  BUNDLE_SIZE = "bundle_size",
  MEMORY = "memory",
  USER_INTERACTION = "user_interaction",
}

/**
 * Units of measurement for metrics
 */
export enum MetricUnit {
  MILLISECONDS = "ms",
  SECONDS = "s",
  KILOBYTES = "KB",
  MEGABYTES = "MB",
  COUNT = "count",
  PERCENTAGE = "percentage",
}

/**
 * Categories of performance bottlenecks
 */
export enum BottleneckCategory {
  DATABASE_QUERY = "DATABASE_QUERY",
  LARGE_BUNDLE = "LARGE_BUNDLE",
  SLOW_API = "SLOW_API",
  MEMORY_LEAK = "MEMORY_LEAK",
  EXCESSIVE_RENDERS = "EXCESSIVE_RENDERS",
  NETWORK_REQUESTS = "NETWORK_REQUESTS",
  SLOW_LCP = "SLOW_LCP",
}

/**
 * Severity levels for bottlenecks
 */
export enum BottleneckSeverity {
  CRITICAL = "CRITICAL", // Immediate action required (>5x slower than target)
  HIGH = "HIGH", // Urgent action needed (3-5x slower than target)
  MEDIUM = "MEDIUM", // Should fix soon (2-3x slower than target)
  LOW = "LOW", // Nice to have (1-2x slower than target)
}

/**
 * Resolution status for bottlenecks
 */
export enum BottleneckStatus {
  IDENTIFIED = "IDENTIFIED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
}

/**
 * Environment types
 */
export enum Environment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * A profiling session for collecting performance metrics
 */
export interface ProfilingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  route: string;
  environment: Environment;
  samplingRate: number; // 0.01 for 1% sampling
  metadata?: Record<string, unknown>;
}

/**
 * Web Vitals metrics from the browser
 */
export interface WebVitals {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  timestamp: Date;
}

/**
 * Bundle analysis results
 */
export interface BundleAnalysis {
  entrypointName: string;
  assetName: string;
  size: number;
  chunks: string[];
  modules: string[];
}

/**
 * Database query analysis results
 */
export interface QueryAnalysis {
  queryName: string;
  duration: number;
  rowCount: number;
  timestamp: Date;
  slow: boolean; // true if duration > 200ms
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated performance report
 */
export interface PerformanceReport {
  id: string;
  generatedAt: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  summary: {
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
  };
  bottlenecks: BottleneckSummary[];
  recommendations: string[];
}

/**
 * Summary of a performance bottleneck
 */
export interface BottleneckSummary {
  category: BottleneckCategory;
  severity: BottleneckSeverity;
  count: number;
  avgValue: number;
  targetValue: number;
  impact: string;
}

/**
 * A baseline violation detected during monitoring
 */
export interface BaselineViolation {
  id: string;
  metricName: string;
  route: string | null;
  currentValue: number;
  thresholdType: "warning" | "critical";
  thresholdValue: number;
  targetValue: number;
  percentageOverThreshold: number;
  timestamp: Date;
}

/**
 * An alert triggered by a violation or bottleneck
 */
export interface Alert {
  id: string;
  type: "baseline_violation" | "bottleneck_detected" | "regression_detected";
  severity: BottleneckSeverity;
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * A performance regression detected over time
 */
export interface PerformanceRegression {
  id: string;
  metricName: string;
  route: string | null;
  baselineValue: number;
  currentValue: number;
  degradationPercentage: number;
  trend: "improving" | "stable" | "degrading";
  detectedAt: Date;
}

// ============================================================================
// Interface Definitions
// ============================================================================

/**
 * Metric collector for recording performance measurements
 */
export interface MetricCollector {
  mark(name: string): void;
  measure(name: string): number;
  recordMetric(
    name: string,
    value: number,
    unit: MetricUnit,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  getMetrics(): Record<string, number>;
  clear(): void;
}

/**
 * Context for a profiling session
 */
export interface ProfilingContext {
  session: ProfilingSession;
  start(): void;
  stop(): Promise<PerformanceReport>;
  isProfiling(): boolean;
}

/**
 * Manager for performance baselines
 */
export interface BaselineManager {
  getBaseline(
    metricName: string,
    route?: string
  ): Promise<PerformanceBaseline | null>;
  setBaseline(
    baseline: Omit<PerformanceBaseline, "id" | "createdAt" | "updatedAt">
  ): Promise<void>;
  checkBaselines(
    metrics: Array<{
      name: string;
      value: number;
      route?: string | null;
    }>
  ): Promise<BaselineViolation[]>;
  deleteBaseline(metricName: string, route?: string): Promise<void>;
  getAllBaselines(): Promise<PerformanceBaseline[]>;
}

/**
 * Tracker for performance bottlenecks
 */
export interface BottleneckTracker {
  identifyBottlenecks(
    metrics: PerformanceMetric[],
    baselines?: Map<string, { targetValue: number; unit: string }>
  ): Promise<Omit<PerformanceBottleneck, "id">[]>;
  updateStatus(id: string, status: BottleneckStatus): Promise<void>;
  getBottlenecks(
    filters?: Partial<{
      category: BottleneckCategory;
      severity: BottleneckSeverity;
      status: BottleneckStatus;
    }>
  ): Promise<PerformanceBottleneck[]>;
  getBottleneck(id: string): Promise<PerformanceBottleneck | null>;
  recordOptimization(
    bottleneckId: string,
    record: Omit<
      OptimizationRecord,
      | "id"
      | "bottleneckId"
      | "improvementPercentage"
      | "createdAt"
      | "verifiedAt"
    >
  ): Promise<void>;
}

/**
 * Manager for performance alerts
 */
export interface AlertManager {
  checkAlerts(): Promise<Alert[]>;
  sendAlert(
    alert: Omit<Alert, "id" | "timestamp" | "acknowledged">
  ): Promise<void>;
  getAlertHistory(timeRange?: { start: Date; end: Date }): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<void>;
}

// ============================================================================
// Import domain types from types.ts
// ============================================================================

import type {
  OptimizationRecord,
  PerformanceBaseline,
  PerformanceBottleneck,
  PerformanceMetric,
} from "./types";

// Re-export for convenience
export type {
  OptimizationRecord,
  PerformanceBaseline,
  PerformanceBottleneck,
  PerformanceMetric,
};
