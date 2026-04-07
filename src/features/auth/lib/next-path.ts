export type AuthRedirectReason = "auth_required" | "session_expired";

export function normalizeNextPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/"
): string {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  return raw;
}

export function buildAuthPath(
  nextPath: string,
  reason: AuthRedirectReason = "auth_required"
): string {
  return `/auth?next=${encodeURIComponent(normalizeNextPath(nextPath))}&reason=${reason}`;
}

export function buildAuthStatusPath({
  email,
  error,
  next,
  reason,
  sent,
}: {
  email: string;
  error?: string;
  next: string;
  reason?: AuthRedirectReason;
  sent?: boolean;
}): string {
  const searchParams = new URLSearchParams();

  searchParams.set("next", next);

  if (reason) {
    searchParams.set("reason", reason);
  }

  if (email) {
    searchParams.set("email", email);
  }

  if (sent) {
    searchParams.set("sent", "1");
  }

  if (error) {
    searchParams.set("error", error);
  }

  return `/auth?${searchParams.toString()}`;
}
