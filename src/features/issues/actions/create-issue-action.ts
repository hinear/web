"use server";

import { redirect } from "next/navigation";

import { requireAuthRedirect } from "@/features/auth/actions/start-email-auth-action";
import { createIssueFlow } from "@/features/issues/lib/create-issue-flow";
import { parseLabelInput } from "@/features/issues/lib/labels";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getProjectIssueCreatePath } from "@/features/projects/lib/project-routes";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

function readOptionalFormValue(
  formData: FormData,
  name: string
): string | undefined {
  const value = String(formData.get(name) ?? "").trim();

  return value.length > 0 ? value : undefined;
}

function readFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  // Handle case where field wasn't filled (no user input)
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export async function createIssueAction(projectId: string, formData: FormData) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return requireAuthRedirect(getProjectIssueCreatePath(projectId));
  }

  const path = await createIssueFlow(await getServerIssuesRepository(), {
    actorId,
    assigneeId: readOptionalFormValue(formData, "assigneeId") ?? null,
    priority: readOptionalFormValue(formData, "priority") as
      | "No Priority"
      | "Low"
      | "Medium"
      | "High"
      | "Urgent"
      | undefined,
    projectId,
    status: readOptionalFormValue(formData, "status") as
      | "Triage"
      | "Backlog"
      | "Todo"
      | "In Progress"
      | "Done"
      | "Canceled"
      | undefined,
    dueDate: readOptionalFormValue(formData, "dueDate") ?? null,
    title: readFormValue(formData, "title"),
    description: readOptionalFormValue(formData, "description"),
    labels: parseLabelInput(readOptionalFormValue(formData, "labels")),
  });

  return redirect(path);
}
