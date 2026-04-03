import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  BottleneckCategory,
  BottleneckSeverity,
  BottleneckStatus,
  Environment,
  OptimizationRecord,
  PerformanceBaseline,
  PerformanceBottleneck,
  PerformanceMetric,
} from "../types";

type Bottleneck = PerformanceBottleneck;

interface PerformanceBottleneckRow {
  id: string;
  title: string;
  category: BottleneckCategory;
  severity: BottleneckSeverity;
  current_value: number;
  target_value: number;
  unit: string;
  impact: string;
  suggestion: string;
  status: BottleneckStatus;
  identified_at: string;
  resolved_at: string | null;
  location: string | null;
  description: string | null;
}

interface PerformanceMetricRow {
  id: string;
  name: string;
  value: number;
  unit: PerformanceMetric["unit"];
  timestamp: string;
  route: string | null;
  environment: Environment;
  metadata: Record<string, unknown> | null;
}

interface PerformanceBaselineRow {
  id: string;
  metric_name: string;
  route: string | null;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

interface OptimizationRecordRow {
  id: string;
  bottleneck_id: string;
  title: string;
  description: string;
  before_value: number;
  after_value: number;
  improvement_percentage: number;
  implementation: string;
  created_at: string;
  verified_at: string | null;
}

// Repository class
export class PerformanceMetricsRepository {
  constructor(private supabase: AppSupabaseServerClient) {}

  async recordBottleneck(
    bottleneck: Omit<Bottleneck, "id">
  ): Promise<Bottleneck> {
    const { data, error } = await (this.supabase as any)
      .from("performance_bottlenecks")
      .insert({
        title: bottleneck.title,
        category: bottleneck.category,
        severity: bottleneck.severity,
        current_value: bottleneck.currentValue,
        target_value: bottleneck.targetValue,
        unit: bottleneck.unit,
        impact: bottleneck.impact,
        suggestion: bottleneck.suggestion,
        status: bottleneck.status,
        identified_at: bottleneck.identifiedAt.toISOString(),
        resolved_at: bottleneck.resolvedAt?.toISOString(),
        location: bottleneck.location,
        description: bottleneck.description,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "[PerformanceRepository] Error recording bottleneck:",
        error
      );
      throw error;
    }

    const row = data as PerformanceBottleneckRow;

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      severity: row.severity,
      currentValue: Number(row.current_value),
      targetValue: Number(row.target_value),
      unit: row.unit,
      impact: row.impact,
      suggestion: row.suggestion,
      status: row.status,
      identifiedAt: new Date(row.identified_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
      location: row.location ?? "",
      description: row.description ?? "",
    };
  }

  async saveBottleneck(
    bottleneck: Omit<Bottleneck, "id">
  ): Promise<Bottleneck> {
    return this.recordBottleneck(bottleneck);
  }

  async getMetricsByTimeRange(
    timeRange: { start: Date; end: Date },
    options?: {
      environment?: Environment;
      name?: string;
      route?: string;
    }
  ): Promise<PerformanceMetric[]> {
    let query = this.supabase
      .from("performance_metrics")
      .select("*")
      .gte("timestamp", timeRange.start.toISOString())
      .lte("timestamp", timeRange.end.toISOString())
      .order("timestamp", { ascending: true });

    if (options?.environment) {
      query = query.eq("environment", options.environment);
    }
    if (options?.name) {
      query = query.eq("name", options.name);
    }
    if (options?.route) {
      query = query.eq("route", options.route);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[PerformanceRepository] Error fetching metrics by time range:",
        error
      );
      throw error;
    }

    return (data as PerformanceMetricRow[]).map((m) => ({
      id: m.id,
      name: m.name,
      value: Number(m.value),
      unit: m.unit,
      timestamp: new Date(m.timestamp),
      route: m.route,
      environment: m.environment,
      metadata: m.metadata ?? null,
    }));
  }

  async listBottlenecks(filters?: {
    category?: string;
    severity?: string;
    status?: string;
  }): Promise<Bottleneck[]> {
    let query = this.supabase
      .from("performance_bottlenecks")
      .select("*")
      .order("identified_at", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "[PerformanceRepository] Error fetching bottlenecks:",
        error
      );
      throw error;
    }

    return (data as PerformanceBottleneckRow[]).map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      severity: b.severity,
      description: b.description ?? "",
      location: b.location ?? "",
      currentValue: Number(b.current_value),
      targetValue: Number(b.target_value),
      unit: b.unit,
      impact: b.impact,
      suggestion: b.suggestion,
      status: b.status,
      identifiedAt: new Date(b.identified_at),
      resolvedAt: b.resolved_at ? new Date(b.resolved_at) : null,
    }));
  }

  async getBaselines(): Promise<PerformanceBaseline[]> {
    const { data, error } = await this.supabase
      .from("performance_baselines")
      .select("*")
      .order("metric_name");

    if (error) {
      console.error("[PerformanceRepository] Error fetching baselines:", error);
      throw error;
    }

    return (data as PerformanceBaselineRow[]).map((b) => ({
      id: b.id,
      metricName: b.metric_name,
      route: b.route,
      targetValue: Number(b.target_value),
      warningThreshold: Number(b.warning_threshold),
      criticalThreshold: Number(b.critical_threshold),
      unit: b.unit,
      createdAt: new Date(b.created_at),
      updatedAt: new Date(b.updated_at),
    }));
  }

  async saveBaseline(
    baseline: Omit<PerformanceBaseline, "id" | "createdAt" | "updatedAt">
  ): Promise<PerformanceBaseline> {
    const { data, error } = await (this.supabase as any)
      .from("performance_baselines")
      .upsert({
        metric_name: baseline.metricName,
        route: baseline.route,
        target_value: baseline.targetValue,
        warning_threshold: baseline.warningThreshold,
        critical_threshold: baseline.criticalThreshold,
        unit: baseline.unit,
      })
      .select()
      .single();

    if (error) {
      console.error("[PerformanceRepository] Error saving baseline:", error);
      throw error;
    }

    const row = data as PerformanceBaselineRow;

    return {
      id: row.id,
      metricName: row.metric_name,
      route: row.route,
      targetValue: Number(row.target_value),
      warningThreshold: Number(row.warning_threshold),
      criticalThreshold: Number(row.critical_threshold),
      unit: row.unit,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async saveOptimizationRecord(
    record: Omit<OptimizationRecord, "id">
  ): Promise<OptimizationRecord> {
    const { data, error } = await (this.supabase as any)
      .from("optimization_records")
      .insert({
        bottleneck_id: record.bottleneckId,
        title: record.title,
        description: record.description,
        before_value: record.beforeValue,
        after_value: record.afterValue,
        improvement_percentage: record.improvementPercentage,
        implementation: record.implementation,
        created_at: record.createdAt.toISOString(),
        verified_at: record.verifiedAt?.toISOString() ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "[PerformanceRepository] Error saving optimization record:",
        error
      );
      throw error;
    }

    const row = data as OptimizationRecordRow;

    return {
      id: row.id,
      bottleneckId: row.bottleneck_id,
      title: row.title,
      description: row.description,
      beforeValue: Number(row.before_value),
      afterValue: Number(row.after_value),
      improvementPercentage: Number(row.improvement_percentage),
      implementation: row.implementation,
      createdAt: new Date(row.created_at),
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    };
  }

  async getOptimizationRecords(
    bottleneckId: string
  ): Promise<OptimizationRecord[]> {
    const { data, error } = await this.supabase
      .from("optimization_records")
      .select("*")
      .eq("bottleneck_id", bottleneckId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[PerformanceRepository] Error fetching optimization records:",
        error
      );
      throw error;
    }

    return (data as OptimizationRecordRow[]).map((r) => ({
      id: r.id,
      bottleneckId: r.bottleneck_id,
      title: r.title,
      description: r.description,
      beforeValue: Number(r.before_value),
      afterValue: Number(r.after_value),
      improvementPercentage: Number(r.improvement_percentage),
      implementation: r.implementation,
      createdAt: new Date(r.created_at),
      verifiedAt: r.verified_at ? new Date(r.verified_at) : null,
    }));
  }
}
