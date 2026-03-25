import type { NextRequest } from "next/server";
import {
  apiError,
  apiForbidden,
  apiInvalidJson,
  apiSuccess,
  apiUnauthorized,
} from "@/app/api/_lib/response";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { SupabaseProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import { getAuthenticatedActorIdOrNull } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

interface SearchIssuesPayload {
  assigneeIds?: string[];
  labelIds?: string[];
  priorities?: string[];
  projectId?: string;
  query?: string;
  statuses?: string[];
}

function normalizeValues(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

export async function POST(request: NextRequest) {
  const actorId = await getAuthenticatedActorIdOrNull();

  if (!actorId) {
    return apiUnauthorized();
  }

  let payload: SearchIssuesPayload;

  try {
    payload = (await request.json()) as SearchIssuesPayload;
  } catch {
    return apiInvalidJson();
  }

  const projectId = payload.projectId?.trim();
  const query = payload.query?.trim();
  const statuses = normalizeValues(payload.statuses);
  const priorities = normalizeValues(payload.priorities);
  const payloadAssigneeIds = normalizeValues(payload.assigneeIds);
  const labelIds = normalizeValues(payload.labelIds);
  const hasFilters =
    statuses.length > 0 ||
    priorities.length > 0 ||
    payloadAssigneeIds.length > 0 ||
    labelIds.length > 0;

  if (!projectId || (!query && !hasFilters)) {
    return apiError(
      "projectId and at least one search or filter field are required",
      400
    );
  }

  const supabase = await createRequestSupabaseServerClient();
  const projectsRepository = new SupabaseProjectsRepository(supabase);
  const hasAccess = await projectsRepository.checkProjectAccess(
    projectId,
    actorId
  );

  if (!hasAccess) {
    return apiForbidden();
  }

  const issuesRepository = await getServerIssuesRepository();
  const issues = hasFilters
    ? await issuesRepository.filterIssues({
        projectId,
        searchQuery: query,
        statuses,
        priorities,
        assigneeIds: payloadAssigneeIds,
        labelIds,
      })
    : query
      ? await issuesRepository.searchIssues({
          projectId,
          query,
        })
      : [];
  const issueAssigneeIds = [
    ...new Set(issues.map((issue) => issue.assigneeId).filter(Boolean)),
  ];

  const { data: profiles, error } = issueAssigneeIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", issueAssigneeIds)
    : { data: [], error: null };

  if (error) {
    return apiError(`Failed to load assignee profiles: ${error.message}`, 500);
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        id: profile.id,
        avatarUrl: profile.avatar_url,
        name: profile.display_name?.trim() || profile.id,
      },
    ])
  );

  return apiSuccess({
    issues: issues.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      assignee: issue.assigneeId
        ? (profilesById.get(issue.assigneeId) ?? null)
        : null,
      labels: issue.labels,
      issueNumber: issue.issueNumber,
      projectId: issue.projectId,
      dueDate: issue.dueDate,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })),
    total: issues.length,
  });
}
