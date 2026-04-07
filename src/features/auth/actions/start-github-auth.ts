"use server";

import { redirect } from "next/navigation";

import {
  readNextPath,
  readProjectId,
  readReason,
} from "@/features/auth/lib/form-data";
import { buildAuthStatusPath } from "@/features/auth/lib/next-path";
import { getRequestOrigin } from "@/lib/request-origin";

export async function startGitHubAuthAction(formData: FormData) {
  const next = readNextPath(formData);
  const reason = readReason(formData);
  const projectId = readProjectId(formData);

  if (!projectId) {
    return redirect(
      buildAuthStatusPath({
        email: "",
        error: "Project ID is required for GitHub integration.",
        next,
        reason,
      })
    );
  }

  const origin = await getRequestOrigin();
  const githubAuthUrl = new URL("/api/github/auth", origin);
  githubAuthUrl.searchParams.set("projectId", projectId);

  return redirect(githubAuthUrl.toString());
}
