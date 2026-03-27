// Performance Profiler Component
// Feature: 003-performance-audit

"use client";

import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import type { BottleneckSeverity } from "../contracts";

/**
 * PerformanceProfiler component - Displays real-time profiling information
 *
 * This component shows performance metrics and profiling status in development mode.
 * In production, it only displays for sampled sessions (1%).
 *
 * Usage:
 * ```tsx
 * import { PerformanceProfiler } from "@/features/performance/components/PerformanceProfiler";
 *
 * export function MyPage() {
 *   return (
 *     <>
 *       <PerformanceProfiler />
 *       <MyPageContent />
 *     </>
 *   );
 * }
 * ```
 */
export function PerformanceProfiler() {
  const [isVisible, setIsVisible] = useState(false);
  const [profilingData, setProfilingData] = useState<{
    sessionDuration: number;
    metrics: Record<string, number>;
    route: string;
  } | null>(null);

  // Only show in development or when explicitly enabled
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.NEXT_PUBLIC_ENABLE_PROFILING !== "true"
  ) {
    return null;
  }

  // Listen for custom profiling events
  if (typeof window !== "undefined") {
    window.addEventListener("performance-profiling-start", () =>
      setIsVisible(true)
    );
    window.addEventListener("performance-profiling-data", (event: any) => {
      setProfilingData(event.detail);
    });
  }

  if (!isVisible || !profilingData) {
    return null;
  }

  const { sessionDuration, metrics, route } = profilingData;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm">Performance Profiling</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Route:</span>
          <span className="font-mono">{route}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">
            Session Duration:
          </span>
          <span className="font-mono">{sessionDuration.toFixed(0)}ms</span>
        </div>

        {Object.entries(metrics).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Metrics:
            </div>
            {Object.entries(metrics).map(([name, value]) => (
              <div key={name} className="flex justify-between">
                <span className="font-mono">{name}:</span>
                <span
                  className={`font-mono ${value > 200 ? "text-red-500" : "text-green-500"}`}
                >
                  {value.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get severity icon and color
 */
export function getSeverityIcon(severity: BottleneckSeverity) {
  switch (severity) {
    case "CRITICAL":
      return { icon: XCircle, color: "text-red-500", bgColor: "bg-red-50" };
    case "HIGH":
      return {
        icon: AlertTriangle,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
      };
    case "MEDIUM":
      return {
        icon: AlertTriangle,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50",
      };
    case "LOW":
      return {
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-50",
      };
  }
}

/**
 * Format metric value with appropriate unit
 */
export function formatMetricValue(value: number, unit: string): string {
  if (unit === "KB" || unit === "MB") {
    return `${value.toFixed(1)}${unit}`;
  }
  if (unit === "percentage") {
    return `${value.toFixed(1)}%`;
  }
  if (unit === "score") {
    return value.toFixed(2);
  }
  return `${value.toFixed(0)}${unit}`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
