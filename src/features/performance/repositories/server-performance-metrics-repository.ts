import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

import { PerformanceMetricsRepository } from "./performance-metrics-repository";

// Performance monitoring requires system-wide visibility.
// Admin/system-level feature using service-role access.
export function getServerPerformanceMetricsRepository(): PerformanceMetricsRepository {
  return new PerformanceMetricsRepository(createServiceRoleSupabaseClient());
}
