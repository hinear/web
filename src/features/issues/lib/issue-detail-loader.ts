import "server-only";

import { notFound, redirect } from "next/navigation";

import { buildAuthPath } from "@/features/auth/lib/next-path";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { getServerProjectsRepository } from "@/features/projects/repositories/server-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";

export async function loadIssueDetail(
  projectId: string,
  issueId: string,
  returnTo: string
) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    redirect(buildAuthPath(returnTo));
  }

  const issuesRepository = await getServerIssuesRepository();
  const projectsRepository = await getServerProjectsRepository();

  const [project, issue, members, comments] = await Promise.all([
    projectsRepository.getProjectById(projectId),
    issuesRepository.getIssueById(issueId),
    projectsRepository.listProjectMembers(projectId),
    issuesRepository.listCommentsByIssueId(issueId),
  ]);

  if (!project || !issue) {
    notFound();
  }

  // Build assignee options
  const assigneeOptions = members.map(
    (member: { id: string; name: string }) => ({
      label: member.name,
      value: member.id,
    })
  );

  // Build member names map
  const memberNamesById: Record<string, string> = {};
  for (const member of members) {
    memberNamesById[member.id] = member.name;
  }

  return {
    activityLog: [], // TODO: Implement activity log loading
    comments,
    assigneeOptions,
    memberNamesById,
    project,
    issue,
    members,
    actorId,
  };
}
