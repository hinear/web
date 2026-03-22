"use client";

import { useTransition } from "react";

import { Button } from "@/components/atoms/Button";
import type { AuthRedirectReason } from "@/features/auth/lib/next-path";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

interface GoogleAuthButtonProps {
  next: string;
  reason?: AuthRedirectReason;
}

function buildAuthErrorPath(next: string, reason?: AuthRedirectReason) {
  const searchParams = new URLSearchParams();

  searchParams.set("next", next);

  if (reason) {
    searchParams.set("reason", reason);
  }

  searchParams.set("error", "Google login could not be started.");

  return `/auth?${searchParams.toString()}`;
}

export function GoogleAuthButton({ next, reason }: GoogleAuthButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full gap-2"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const redirectTo = new URL("/auth/confirm", window.location.origin);

          redirectTo.searchParams.set("next", next);

          const supabase = createBrowserSupabaseClient();
          const { data, error } = await supabase.auth.signInWithOAuth({
            options: {
              redirectTo: redirectTo.toString(),
            },
            provider: "google",
          });

          if (error || !data.url) {
            window.location.assign(buildAuthErrorPath(next, reason));
            return;
          }

          window.location.assign(data.url);
        });
      }}
      size="md"
      type="button"
      variant="secondary"
    >
      <span className="text-[16px] leading-none font-[var(--app-font-weight-700)] text-[var(--app-color-black)]">
        G
      </span>
      <span className="text-[14px] leading-[14px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]">
        {isPending ? "Redirecting to Google..." : "Continue with Google"}
      </span>
    </Button>
  );
}
