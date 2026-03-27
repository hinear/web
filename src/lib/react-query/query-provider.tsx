"use client";

import { QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "./query-client";

/**
 * React Query Provider Component
 * Feature: 003-performance-audit (User Story 2: Optimization)
 *
 * Wraps the app with React Query for data fetching and caching
 */

let clientQueryClientSingleton:
  | ReturnType<typeof createQueryClient>
  | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return createQueryClient();
  }
  // Browser: create a singleton client
  if (!clientQueryClientSingleton) {
    clientQueryClientSingleton = createQueryClient();
  }
  return clientQueryClientSingleton;
}

export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </ReactQueryClientProvider>
  );
}
