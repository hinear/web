import {
  type DehydratedState,
  dehydrate,
  hydrate,
  type QueryClient,
} from "@tanstack/react-query";
import { cache } from "react";
import { getQueryClient } from "./providers";

/**
 * React Query 서버 클라이언트 캐싱
 * - 서버 사이드에서 QueryClient 인스턴스를 캐싱하여 재사용
 * - Hydration 상태를 클라이언트로 전달
 */
export const getServerQueryClient = cache(() => getQueryClient());

export function dehydrateQueryClient(
  queryClient: QueryClient
): DehydratedState {
  return dehydrate(queryClient);
}

export function hydrateQueryClient(
  dehydratedState: DehydratedState,
  queryClient: QueryClient
): void {
  hydrate(queryClient, dehydratedState);
}
