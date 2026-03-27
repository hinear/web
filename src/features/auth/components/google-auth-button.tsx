"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/atoms/Button";
import { startGoogleAuthAction } from "@/features/auth/actions/start-email-auth-action";
import type { AuthRedirectReason } from "@/features/auth/lib/next-path";

interface GoogleAuthButtonProps {
  next: string;
  reason?: AuthRedirectReason;
}

function GoogleAuthSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full gap-2"
      disabled={pending}
      size="md"
      type="submit"
      variant="secondary"
    >
      <span className="text-[16px] leading-none font-[var(--app-font-weight-700)] text-[var(--app-color-black)]">
        G
      </span>
      <span className="text-[14px] leading-[14px] font-[var(--app-font-weight-500)] text-[var(--app-color-black)]">
        {pending ? "Redirecting to Google..." : "Continue with Google"}
      </span>
    </Button>
  );
}

export function GoogleAuthButton({ next, reason }: GoogleAuthButtonProps) {
  return (
    <form action={startGoogleAuthAction}>
      <input name="next" readOnly type="hidden" value={next} />
      {reason ? (
        <input name="reason" readOnly type="hidden" value={reason} />
      ) : null}
      <GoogleAuthSubmitButton />
    </form>
  );
}
