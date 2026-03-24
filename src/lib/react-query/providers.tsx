"use client";

import {
  QueryClient,
  QueryClientProvider as RQQueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useState } from "react";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return makeQueryClient();
  } else {
    // Browser: create a QueryClient if needed and reuse it
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

export function QueryClientProvider({ children }: { children: ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the client code above
  const queryClient = getQueryClient();

  return (
    <RQQueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </RQQueryClientProvider>
  );
}
