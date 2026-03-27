// Metrics Dashboard Component
// Feature: 003-performance-audit

"use client";

import { Activity, Database, Package, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { PerformanceBottleneck } from "../types";
import {
  formatMetricValue,
  formatNumber,
  getSeverityIcon,
} from "./PerformanceProfiler";

/**
 * MetricsDashboard component - Displays performance metrics and bottlenecks
 *
 * Usage:
 * ```tsx
 * import { MetricsDashboard } from "@/features/performance/components/MetricsDashboard";
 *
 * export function AdminPage() {
 *   return <MetricsDashboard timeRange={{ start: new Date(Date.now() - 24*60*60*1000), end: new Date() }} />;
 * }
 * ```
 */
interface MetricsDashboardProps {
  timeRange: {
    start: Date;
    end: Date;
  };
}

export function MetricsDashboard({ timeRange }: MetricsDashboardProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const start = timeRange.start.toISOString();
      const end = timeRange.end.toISOString();

      const response = await fetch(
        `/api/performance/report?start=${start}&end=${end}`
      );

      if (!response.ok) {
        throw new Error("Failed to load performance report");
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error("Failed to load performance report:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [timeRange.end, timeRange.start]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No performance data available</p>
      </div>
    );
  }

  const { summary, bottlenecks, recommendations } = report;

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Metrics"
            value={formatNumber(summary.totalMetrics)}
            icon={Activity}
            color="blue"
          />
          <SummaryCard
            title="Avg Page Load"
            value={formatMetricValue(summary.averagePageLoadTime, "ms")}
            icon={Zap}
            color={summary.averagePageLoadTime > 2000 ? "red" : "green"}
          />
          <SummaryCard
            title="Slow Queries"
            value={summary.slowQueriesCount}
            icon={Database}
            color={summary.slowQueriesCount > 10 ? "red" : "green"}
          />
          <SummaryCard
            title="Avg Bundle Size"
            value={formatMetricValue(summary.averageBundleSize, "KB")}
            icon={Package}
            color={summary.averageBundleSize > 200 ? "red" : "green"}
          />
        </div>
      </section>

      {/* Web Vitals Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Web Vitals</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <WebVitalCard
            name="CLS"
            value={summary.webVitals.cls}
            threshold={0.1}
            unit="score"
            better="lower"
          />
          <WebVitalCard
            name="FID"
            value={summary.webVitals.fid}
            threshold={100}
            unit="ms"
            better="lower"
          />
          <WebVitalCard
            name="FCP"
            value={summary.webVitals.fcp}
            threshold={1800}
            unit="ms"
            better="lower"
          />
          <WebVitalCard
            name="LCP"
            value={summary.webVitals.lcp}
            threshold={2500}
            unit="ms"
            better="lower"
          />
          <WebVitalCard
            name="TTFB"
            value={summary.webVitals.ttfb}
            threshold={800}
            unit="ms"
            better="lower"
          />
        </div>
      </section>

      {/* Bottlenecks Section */}
      {bottlenecks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Identified Bottlenecks</h2>
          <div className="space-y-3">
            {bottlenecks.map(
              (bottleneck: PerformanceBottleneck, index: number) => (
                <BottleneckCard
                  key={bottleneck.id || index}
                  bottleneck={bottleneck}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Recommendations</h2>
          <div className="space-y-2">
            {recommendations.map((recommendation: string) => (
              <div
                key={recommendation}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
              >
                {recommendation}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Summary card component
 */
function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <div
      className={`p-4 border rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

/**
 * Web Vital card component
 */
function WebVitalCard({
  name,
  value,
  threshold,
  unit,
  better,
}: {
  name: string;
  value: number;
  threshold: number;
  unit: string;
  better: "lower" | "higher";
}) {
  const isGood = better === "lower" ? value <= threshold : value >= threshold;
  const colorClass = isGood ? "text-green-600" : "text-red-600";
  const bgColorClass = isGood ? "bg-green-50" : "bg-red-50";

  return (
    <div className={`p-3 border rounded-lg ${bgColorClass}`}>
      <div className="text-xs text-gray-600 mb-1">{name}</div>
      <div className={`text-lg font-bold ${colorClass}`}>
        {formatMetricValue(value, unit)}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Target: {formatMetricValue(threshold, unit)}
      </div>
    </div>
  );
}

/**
 * Bottleneck card component
 */
function BottleneckCard({ bottleneck }: { bottleneck: PerformanceBottleneck }) {
  const severityInfo = getSeverityIcon(bottleneck.severity);
  const color = severityInfo?.color || "bg-gray-100";

  return (
    <div className={`p-4 border rounded-lg ${color} border-opacity-30`}>
      <div className="flex items-start gap-3">
        {severityInfo?.icon && (
          <severityInfo.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              {bottleneck.title}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
              {bottleneck.severity}
            </span>
          </div>
          <p className="text-sm mb-2">{bottleneck.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Current:</span>{" "}
              <span className="font-mono">
                {bottleneck.currentValue.toFixed(0)}
                {bottleneck.unit}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Target:</span>{" "}
              <span className="font-mono">
                {bottleneck.targetValue.toFixed(0)}
                {bottleneck.unit}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs">
            <span className="font-medium">Impact:</span> {bottleneck.impact}
          </div>
        </div>
      </div>
    </div>
  );
}
