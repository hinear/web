"use server";

import { redirect } from "next/navigation";
import { createProjectFlow } from "@/features/projects/lib/create-project-flow";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import type { ProjectType } from "@/features/projects/types";
import { getHinearActorId } from "@/lib/supabase/env";

function assertProjectType(value: FormDataEntryValue | null): ProjectType {
  return value === "team" ? "team" : "personal";
}

function readFormValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

export async function createProjectAction(formData: FormData) {
  const path = await createProjectFlow(getServerProjectsRepository(), {
    actorId: getHinearActorId(),
    key: readFormValue(formData, "key"),
    name: readFormValue(formData, "name"),
    type: assertProjectType(formData.get("type")),
  });

  redirect(path);
}
