"use server";

import { redirect } from "next/navigation";
import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
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

export async function createProjectAction(formData: FormData) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect("/projects/new");
  }

  const path = await createProjectFlow(await getServerProjectsRepository(), {
    actorId,
    key: readFormValue(formData, "key"),
    name: readFormValue(formData, "name"),
    type: assertProjectType(formData.get("type")),
  });

  return redirect(path);
}
