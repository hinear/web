"use server";

import { redirect } from "next/navigation";

import { createIssueFlow } from "@/features/issues/lib/create-issue-flow";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getHinearActorId } from "@/lib/supabase/env";

function readOptionalFormValue(
  formData: FormData,
  name: string
): string | undefined {
  const value = String(formData.get(name) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function readFormValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

export async function createIssueAction(projectId: string, formData: FormData) {
  const path = await createIssueFlow(getServerIssuesRepository(), {
    actorId: getHinearActorId(),
    projectId,
    title: readFormValue(formData, "title"),
    description: readOptionalFormValue(formData, "description"),
  });

  redirect(path);
}
