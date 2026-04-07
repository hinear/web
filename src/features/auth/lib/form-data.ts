import {
  type AuthRedirectReason,
  normalizeNextPath,
} from "@/features/auth/lib/next-path";

export function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim();
}

export function readNextPath(formData: FormData, fallback = "/"): string {
  return normalizeNextPath(formData.get("next"), fallback);
}

export function readReason(formData: FormData): AuthRedirectReason | undefined {
  return (formData.get("reason") as AuthRedirectReason | null) ?? undefined;
}

export function readProjectId(formData: FormData): string {
  return String(formData.get("projectId") ?? "");
}
