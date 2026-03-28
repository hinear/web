import { requireApiActorId, requireProjectAccess } from "@/app/api/_lib/auth";
import {
  buildCursorPaginationMeta,
  decodeCursor,
} from "@/app/api/_lib/pagination";
import {
  apiV1Created,
  apiV1Error,
  apiV1Success,
} from "@/app/api/_lib/response";
import {
  parseEnumValue,
  parseJsonBody,
  parsePositiveInt,
  requireNonEmptyString,
} from "@/app/api/_lib/validation";
import { assertValidCreateIssueInput } from "@/features/issues/lib/issue-validation";
import { toRestIssueResources } from "@/features/issues/presenters/issues-api-presenter";
import { getServerIssuesRepository } from "@/features/issues/repositories/server-issues-repository";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "@/features/issues/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const actorId = await requireApiActorId();
    const { projectId } = await params;
    await requireProjectAccess(projectId, actorId);

    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInt(searchParams.get("limit"), "limit", 20, 100);
    const status = parseEnumValue(
      searchParams.get("status"),
      ISSUE_STATUSES,
      "status"
    );
    const priority = parseEnumValue(
      searchParams.get("priority"),
      ISSUE_PRIORITIES,
      "priority"
    );
    const cursor = searchParams.get("cursor");
    const repository = await getServerIssuesRepository();
    const parsedCursor = cursor ? decodeCursor(cursor) : undefined;
    const { issues, hasMore } = await repository.listIssuesCursorPage({
      after: parsedCursor,
      limit,
      priority: priority ?? undefined,
      projectId,
      status: status ?? undefined,
    });

    return apiV1Success({
      items: toRestIssueResources(issues),
      pagination: buildCursorPaginationMeta(issues, limit, hasMore),
    });
  } catch (error) {
    return apiV1Error(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const actorId = await requireApiActorId();
    const { projectId } = await params;
    await requireProjectAccess(projectId, actorId);
    const payload = await parseJsonBody<{
      assigneeId?: string | null;
      description?: string;
      priority?: string;
      status?: string;
      title?: string;
    }>(request);

    const input = {
      assigneeId: payload.assigneeId ?? null,
      createdBy: actorId,
      description: payload.description ?? "",
      priority: payload.priority
        ? parseEnumValue(payload.priority, ISSUE_PRIORITIES, "priority")
        : undefined,
      projectId,
      status: payload.status
        ? parseEnumValue(payload.status, ISSUE_STATUSES, "status")
        : undefined,
      title: requireNonEmptyString(payload.title, "title"),
    };

    assertValidCreateIssueInput(input);

    const repository = await getServerIssuesRepository();
    const issue = await repository.createIssue(input);

    return apiV1Created(
      toRestIssueResources([issue])[0],
      `/api/v1/projects/${projectId}/issues/${issue.id}`
    );
  } catch (error) {
    return apiV1Error(error);
  }
}
