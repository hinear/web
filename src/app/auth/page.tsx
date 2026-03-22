import { redirect } from "next/navigation";

import { AuthForm } from "@/components/organisms/AuthForm";
import { startEmailAuthAction } from "@/features/auth/actions/start-email-auth-action";
import { getDefaultPostAuthPath } from "@/features/auth/lib/default-post-auth-path";
import {
  type AuthRedirectReason,
  normalizeNextPath,
} from "@/features/auth/lib/next-path";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

interface AuthPageProps {
  searchParams: Promise<{
    email?: string;
    error?: string;
    next?: string;
    reason?: AuthRedirectReason;
    sent?: string;
  }>;
}

function getNoticeMessage(
  reason: AuthRedirectReason | undefined,
  next: string
): string | undefined {
  if (reason === "auth_required") {
    return `Sign in to continue to ${next}.`;
  }

  if (reason === "session_expired") {
    return "Your session expired. Sign in again to continue.";
  }

  return undefined;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const next = normalizeNextPath(params.next, "/");

  if (await getAuthenticatedActorIdOrNull()) {
    redirect(params.next ? next : await getDefaultPostAuthPath());
  }

  return (
    <main className="app-shell">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <AuthForm
          action={startEmailAuthAction}
          defaultEmail={params.email}
          errorMessage={params.error}
          next={next}
          noticeMessage={getNoticeMessage(params.reason, next)}
          reason={params.reason}
          subtitle={
            params.sent === "1"
              ? `We sent a magic link to ${params.email ?? "your email"}. Open it on this device to continue.`
              : "Enter your work email and we will send you a magic link."
          }
          title="Sign in to continue"
          variant="desktop"
        />
      </div>
    </main>
  );
}
