"use server";

import { redirect } from "next/navigation";
import { requireAuthRedirect } from "@/features/auth/actions/require-auth-redirect";
import { getCreateProjectErrorMessage } from "@/features/projects/lib/create-project-error-message";
import { createProjectFlow } from "@/features/projects/lib/create-project-flow";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import type { ProjectType } from "@/features/projects/types";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

function assertProjectType(value: FormDataEntryValue | null): ProjectType {
  return value === "team" ? "team" : "personal";
}

function readFormValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

function isNextRedirectError(error: unknown): error is { digest: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT;")
  );
}

export async function createProjectAction(formData: FormData) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect("/projects/new");
  }

  try {
    const path = await createProjectFlow(await getServerProjectsRepository(), {
      actorId,
      key: readFormValue(formData, "key"),
      name: readFormValue(formData, "name"),
      type: assertProjectType(formData.get("type")),
    });

    return redirect(path);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("createProjectAction failed", error);

    const params = new URLSearchParams({
      error: getCreateProjectErrorMessage(error),
    });

    return redirect(`/projects/new?${params.toString()}`);
  }
}
