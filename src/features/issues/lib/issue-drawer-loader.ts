import "server-only";

import { notFound } from "next/navigation";

import { SupabaseIssuesRepository } from "@/features/issues/repositories/supabase-issues-repository";
import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server-client";

export async function loadIssueDrawerDetail(
  projectId: string,
  issueId: string
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    throw new Error("Authentication required");
  }

  const supabase = createServiceRoleSupabaseClient();
  const issuesRepository = new SupabaseIssuesRepository(supabase);
  const projectsRepository = new SupabaseProjectsRepository(supabase);

  const hasProjectAccess = await projectsRepository.checkProjectAccess(
    projectId,
    actorId
  );

  if (!hasProjectAccess) {
    notFound();
  }

  const [
    issue,
    members,
    activityLog,
    { data: availableLabels, error: labelsError },
  ] = await Promise.all([
    issuesRepository.getIssueById(issueId),
    projectsRepository.listProjectMembers(projectId),
    issuesRepository.listActivityLogByIssueId(issueId),
    supabase
      .from("labels")
      .select("id, project_id, name, name_key, color, created_by, created_at")
      .eq("project_id", projectId)
      .order("name"),
  ]);

  if (!issue) {
    notFound();
  }

  if (labelsError) {
    throw new Error(`Failed to load labels: ${labelsError.message}`);
  }

  const assigneeOptions = members.map((member) => ({
    label: member.name,
    value: member.id,
  }));

  const memberNamesById: Record<string, string> = {};
  for (const member of members) {
    memberNamesById[member.id] = member.name;
  }

  return {
    activityLog,
    availableLabels: availableLabels ?? [],
    assigneeOptions,
    issue,
    memberNamesById,
  };
}
