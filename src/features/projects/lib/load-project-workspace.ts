import "server-only";

import { notFound } from "next/navigation";

import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import type { Project } from "@/features/projects/types";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

function mapProjectRow(row: {
  id: string;
  key: string;
  name: string;
  type: Project["type"];
  issue_seq: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  github_repo_owner?: string | null;
  github_repo_name?: string | null;
  github_integration_enabled?: boolean | null;
}): Project {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    type: row.type,
    issueSeq: row.issue_seq,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    githubRepoOwner: row.github_repo_owner ?? null,
    githubRepoName: row.github_repo_name ?? null,
    githubIntegrationEnabled: row.github_integration_enabled ?? false,
  };
}

/**
 * Load only the shell data needed for sidebar + header rendering.
 * Fast (~3 queries): project info + accessible projects list.
 */
export async function loadProjectShell(projectId: string) {
  const actorId = await getAuthenticatedActorIdOrNull();
  if (!actorId) throw new Error("Authentication required");

  const repository = await getServerProjectsRepository();
  const requestSupabase = await createRequestSupabaseServerClient();

  const [project, accessibleProjectIdsResult] = await Promise.all([
    repository.getProjectById(projectId),
    requestSupabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", actorId),
  ]);

  if (!project) notFound();

  const accessibleProjectIds = [
    ...new Set(
      (accessibleProjectIdsResult.data ?? []).map((row) => row.project_id)
    ),
  ].filter(Boolean);

  const { data: accessibleProjectRows } =
    accessibleProjectIds.length > 0
      ? await requestSupabase
          .from("projects")
          .select(
            "id, key, name, type, issue_seq, created_by, created_at, updated_at, github_repo_owner, github_repo_name, github_integration_enabled"
          )
          .in("id", accessibleProjectIds)
      : {
          data: [] as Array<{
            id: string;
            key: string;
            name: string;
            type: Project["type"];
            issue_seq: number;
            created_by: string;
            created_at: string;
            updated_at: string;
            github_repo_owner?: string | null;
            github_repo_name?: string | null;
            github_integration_enabled?: boolean | null;
          }>,
        };

  const accessibleProjects = (accessibleProjectRows ?? []).map(mapProjectRow);

  return { accessibleProjects, actorId, project };
}

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
  const { data: accessibleProjectRows, error: accessibleProjectsError } =
    accessibleProjectIds.length > 0
      ? await requestSupabase
          .from("projects")
          .select(
            "id, key, name, type, issue_seq, created_by, created_at, updated_at, github_repo_owner, github_repo_name, github_integration_enabled"
          )
          .in("id", accessibleProjectIds)
      : { data: [], error: null };

  if (accessibleProjectsError) {
    throw new Error(
      `Failed to load accessible projects: ${accessibleProjectsError.message}`
    );
  }

  const accessibleProjects = (accessibleProjectRows ?? []).map(mapProjectRow);

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
