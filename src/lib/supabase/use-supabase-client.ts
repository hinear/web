"use client";

import { useRef } from "react";

import {
  type AppSupabaseClient,
  createBrowserSupabaseClient,
} from "@/lib/supabase/browser-client";

export function useSupabaseClient(): AppSupabaseClient {
  const clientRef = useRef<AppSupabaseClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = createBrowserSupabaseClient();
  }

  return clientRef.current;
}
