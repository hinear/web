import "server-only";

import { notFound } from "next/navigation";

import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function loadProjectWorkspace(
  projectId: string,
  _returnTo: string
) {
  // Auth check is now done at layout level to avoid duplicate checks in parallel routes
  const actorId = await getAuthenticatedActorIdOrNull();

  const repository = await getServerProjectsRepository();
  const issuesRepository = await getServerIssuesRepository();
  const requestSupabase = await createRequestSupabaseServerClient();

  if (!actorId) {
    throw new Error("Authentication required");
  }

  const accessibleProjectIdsPromise = requestSupabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", actorId);
  const [project, members, invitations, issues, accessibleProjectIdsResult] =
    await Promise.all([
      repository.getProjectById(projectId),
      repository.listProjectMembers(projectId),
      repository.listPendingProjectInvitations(projectId),
      issuesRepository.listIssuesByProject(projectId),
      accessibleProjectIdsPromise,
    ]);

  if (!project) {
    notFound();
  }

  const createdByLabel =
    members.find((member) => member.id === project.createdBy)?.name ??
    project.createdBy;
  const totalIssueCount = issues.length;
  const doneIssueCount = issues.filter(
    (issue) => issue.status === "Done"
  ).length;
  const backlogIssueCount = issues.filter(
    (issue) => issue.status === "Backlog"
  ).length;
  const inProgressIssueCount = issues.filter(
    (issue) => issue.status === "In Progress"
  ).length;
  const activeIssueCount = issues.filter(
    (issue) => issue.status !== "Done" && issue.status !== "Canceled"
  ).length;
  const accessibleProjectIds = [
    ...new Set(
      (accessibleProjectIdsResult.data ?? []).map((row) => row.project_id)
    ),
  ].filter(Boolean);
  const accessibleProjects = (
    await Promise.all(
      accessibleProjectIds.map((accessibleProjectId) =>
        repository.getProjectById(accessibleProjectId)
      )
    )
  ).filter((candidate): candidate is NonNullable<typeof candidate> =>
    Boolean(candidate)
  );

  return {
    accessibleProjects,
    actorId,
    createdByLabel,
    invitations,
    issues,
    members: members.map((member) => ({
      ...member,
      isCurrentUser: member.id === actorId,
      note: member.id === actorId ? "You" : member.note,
    })),
    project,
    summary: {
      activeIssueCount,
      backlogIssueCount,
      doneIssueCount,
      inProgressIssueCount,
      memberCount: members.length,
      pendingInvitationCount: invitations.length,
      totalIssueCount,
    },
  };
}
