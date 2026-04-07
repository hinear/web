"use server";

import { redirect } from "next/navigation";

import {
  type AuthRedirectReason,
  buildAuthPath,
} from "@/features/auth/lib/next-path";

export async function requireAuthRedirect(
  nextPath: string,
  reason: AuthRedirectReason = "auth_required"
): Promise<never> {
  return redirect(buildAuthPath(nextPath, reason));
}
