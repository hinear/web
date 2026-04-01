import { resolveSession } from "../lib/auth";
import {
  mapHinearPriorityToMcpPriority,
  mapHinearStatusToMcpStatus,
  mapMcpPriorityToHinearPriority,
  mapMcpStatusToHinearStatus,
} from "../lib/hinear-mappers";
import {
  createMcpActorSupabaseClient,
  createMcpServiceRoleSupabaseClient,
  type McpSupabaseClient,
} from "../lib/supabase";
import type {
  CreateIssueInput,
  GetIssueDetailInput,
  SearchIssuesInput,
  UpdateIssueStatusInput,
} from "../schemas/issue";

type IssueRow = {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  issue_number: number;
  project_id: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type LabelRow = {
  id: string;
  name: string;
  color: string;
};

type IssueLabelRow = {
  issue_id: string;
  label_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type CommentRow = {
  id: string;
  issue_id: string;
  project_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at?: string | null;
  parent_comment_id?: string | null;
  thread_id?: string | null;
};

type ActivityLogRow = {
  id: string;
  issue_id: string;
  project_id: string;
  actor_id: string;
  type: string;
  field: string | null;
  from_value: unknown;
  to_value: unknown;
  summary: string;
  created_at: string;
};

async function requireActor() {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  if (session.userId) {
    return {
      actorId: session.userId,
      supabase,
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      "Authentication required. Set HINEAR_MCP_ACCESS_TOKEN or HINEAR_MCP_USER_ID."
    );
  }

  return {
    actorId: user.id,
    supabase,
  };
}

async function assertProjectAccess(
  projectId: string,
  actorId: string,
  supabase: McpSupabaseClient
) {
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", actorId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to verify project access: ${error.message}`);
  }

  if (!data) {
    throw new Error("Forbidden. The current user cannot access this project.");
  }
}

async function listLabelsByIssueIds(
  supabase: McpSupabaseClient,
  projectId: string,
  issueIds: string[]
) {
  if (issueIds.length === 0) {
    return new Map<string, LabelRow[]>();
  }

  const { data: issueLabelRows, error: issueLabelError } = await supabase
    .from("issue_labels")
    .select("issue_id, label_id")
    .eq("project_id", projectId)
    .in("issue_id", issueIds);

  if (issueLabelError) {
    throw new Error(`Failed to load issue labels: ${issueLabelError.message}`);
  }

  const labelIds = [
    ...new Set((issueLabelRows ?? []).map((row) => row.label_id)),
  ];

  if (labelIds.length === 0) {
    return new Map(issueIds.map((issueId) => [issueId, [] as LabelRow[]]));
  }

  const { data: labelRows, error: labelError } = await supabase
    .from("labels")
    .select("id, name, color")
    .eq("project_id", projectId)
    .in("id", labelIds);

  if (labelError) {
    throw new Error(`Failed to load labels: ${labelError.message}`);
  }

  const labelsById = new Map(
    ((labelRows ?? []) as LabelRow[]).map((row) => [row.id, row])
  );
  const labelsByIssueId = new Map(
    issueIds.map((issueId) => [issueId, [] as LabelRow[]])
  );

  for (const row of (issueLabelRows ?? []) as IssueLabelRow[]) {
    const label = labelsById.get(row.label_id);

    if (label) {
      labelsByIssueId.get(row.issue_id)?.push(label);
    }
  }

  return labelsByIssueId;
}

async function listProfilesByIds(
  supabase: McpSupabaseClient,
  userIds: string[]
) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(`Failed to load assignee profiles: ${error.message}`);
  }

  return new Map(((data ?? []) as ProfileRow[]).map((row) => [row.id, row]));
}

function getDisplayName(profile: ProfileRow | undefined, fallback: string) {
  return profile?.display_name?.trim() || fallback;
}

export async function searchIssues(input: SearchIssuesInput) {
  const { actorId, supabase } = await requireActor();
  await assertProjectAccess(input.project_id, actorId, supabase);

  const hasFilters =
    (input.status?.length ?? 0) > 0 ||
    (input.priority?.length ?? 0) > 0 ||
    (input.label_ids?.length ?? 0) > 0 ||
    Boolean(input.assignee_id) ||
    Boolean(input.due_before) ||
    Boolean(input.due_after);

  let query = supabase
    .from("issues")
    .select("*")
    .eq("project_id", input.project_id);

  if (input.status?.length) {
    query = query.in(
      "status",
      input.status.map((status) => mapMcpStatusToHinearStatus(status))
    );
  }

  if (input.priority?.length) {
    query = query.in(
      "priority",
      input.priority.map((priority) => mapMcpPriorityToHinearPriority(priority))
    );
  }

  if (input.assignee_id) {
    query = query.eq("assignee_id", input.assignee_id);
  }

  if (input.query?.trim()) {
    const searchTerm = `%${input.query.trim()}%`;
    query = query.or(
      `title.ilike.${searchTerm},description.ilike.${searchTerm}`
    );
  }

  if (input.due_before) {
    query = query.lte("due_date", input.due_before);
  }

  if (input.due_after) {
    query = query.gte("due_date", input.due_after);
  }

  if (typeof input.limit === "number") {
    query = query.limit(input.limit);
  }

  const { data, error } = await query.order("issue_number", {
    ascending: true,
  });

  if (error) {
    throw new Error(`Failed to search issues: ${error.message}`);
  }

  let issues = ((data ?? []) as IssueRow[]).map((issue) => ({
    assignee_id: issue.assignee_id,
    created_at: issue.created_at,
    due_date: issue.due_date,
    id: issue.id,
    identifier: issue.identifier,
    issue_number: issue.issue_number,
    labels: [] as LabelRow[],
    priority: mapHinearPriorityToMcpPriority(issue.priority),
    project_id: issue.project_id,
    status: mapHinearStatusToMcpStatus(issue.status),
    title: issue.title,
    updated_at: issue.updated_at,
  }));

  if (input.label_ids?.length && issues.length > 0) {
    const { data: issueLabelRows, error: issueLabelError } = await supabase
      .from("issue_labels")
      .select("issue_id")
      .in("label_id", input.label_ids)
      .in(
        "issue_id",
        issues.map((issue) => issue.id)
      );

    if (issueLabelError) {
      throw new Error(
        `Failed to filter issues by label: ${issueLabelError.message}`
      );
    }

    const matchingIssueIds = new Set(
      (issueLabelRows ?? []).map((row) => row.issue_id)
    );
    issues = issues.filter((issue) => matchingIssueIds.has(issue.id));
  }

  const labelsByIssueId = await listLabelsByIssueIds(
    supabase,
    input.project_id,
    issues.map((issue) => issue.id)
  );
  const profilesById = await listProfilesByIds(
    supabase,
    issues
      .map((issue) => issue.assignee_id)
      .filter((assigneeId): assigneeId is string => Boolean(assigneeId))
  );

  const matches = issues.map((issue) => {
    const assignee = issue.assignee_id
      ? (profilesById.get(issue.assignee_id) ?? null)
      : null;

    return {
      assignee: assignee
        ? {
            avatar_url: assignee.avatar_url,
            id: assignee.id,
            name: assignee.display_name?.trim() || assignee.id,
          }
        : null,
      created_at: issue.created_at,
      due_date: issue.due_date,
      id: issue.id,
      identifier: issue.identifier,
      issue_number: issue.issue_number,
      labels: (labelsByIssueId.get(issue.id) ?? []).map((label) => ({
        color: label.color,
        id: label.id,
        name: label.name,
      })),
      priority: issue.priority,
      project_id: issue.project_id,
      status: issue.status,
      title: issue.title,
      updated_at: issue.updated_at,
    };
  });

  return {
    applied_filters: {
      assignee_id: input.assignee_id ?? null,
      due_after: input.due_after ?? null,
      due_before: input.due_before ?? null,
      has_advanced_filters: hasFilters,
      label_ids: input.label_ids ?? [],
      priority: input.priority ?? [],
      project_id: input.project_id,
      query: input.query ?? "",
      status: input.status ?? [],
    },
    matches,
    summary:
      matches.length === 0
        ? "No matching issues found."
        : `Found ${matches.length} matching issue${matches.length === 1 ? "" : "s"}.`,
    user_id: actorId,
  };
}

export async function getIssueDetail(input: GetIssueDetailInput) {
  const { actorId, supabase } = await requireActor();

  const { data: issueRow, error: issueError } = await supabase
    .from("issues")
    .select("*")
    .eq("id", input.issue_id)
    .maybeSingle();

  if (issueError) {
    throw new Error(`Failed to load issue: ${issueError.message}`);
  }

  if (!issueRow) {
    throw new Error("Issue not found.");
  }

  const projectId = issueRow.project_id;
  await assertProjectAccess(projectId, actorId, supabase);

  const detailClient = (() => {
    try {
      return createMcpServiceRoleSupabaseClient();
    } catch {
      return supabase;
    }
  })();

  const [labelsByIssueId, commentsResult, activityResult, profilesById] =
    await Promise.all([
      listLabelsByIssueIds(detailClient, projectId, [input.issue_id]),
      detailClient
        .from("comments")
        .select(
          "id, issue_id, project_id, author_id, body, created_at, updated_at, parent_comment_id, thread_id"
        )
        .eq("issue_id", input.issue_id)
        .order("created_at", { ascending: false }),
      detailClient
        .from("activity_logs")
        .select(
          "id, issue_id, project_id, actor_id, type, field, from_value, to_value, summary, created_at"
        )
        .eq("issue_id", input.issue_id)
        .order("created_at", { ascending: false }),
      listProfilesByIds(
        detailClient,
        [issueRow.assignee_id, issueRow.created_by, issueRow.updated_by].filter(
          (value): value is string => Boolean(value)
        )
      ),
    ]);

  if (commentsResult.error) {
    throw new Error(`Failed to load comments: ${commentsResult.error.message}`);
  }

  if (activityResult.error) {
    throw new Error(
      `Failed to load activity log: ${activityResult.error.message}`
    );
  }

  const commentLimit = input.comment_limit ?? 10;
  const activityLimit = input.activity_limit ?? 10;
  const comments = ((commentsResult.data ?? []) as CommentRow[])
    .slice(0, input.include_comments === false ? 0 : commentLimit)
    .map((comment) => {
      const author = profilesById.get(comment.author_id);

      return {
        author: {
          avatar_url: author?.avatar_url ?? null,
          id: comment.author_id,
          name: getDisplayName(author, comment.author_id),
        },
        body: comment.body,
        created_at: comment.created_at,
        id: comment.id,
        parent_comment_id: comment.parent_comment_id ?? null,
        thread_id: comment.thread_id ?? null,
        updated_at: comment.updated_at ?? null,
      };
    });

  const activity = ((activityResult.data ?? []) as ActivityLogRow[])
    .slice(0, input.include_activity === false ? 0 : activityLimit)
    .map((entry) => {
      const actor = profilesById.get(entry.actor_id);

      return {
        actor: {
          avatar_url: actor?.avatar_url ?? null,
          id: entry.actor_id,
          name: getDisplayName(actor, entry.actor_id),
        },
        created_at: entry.created_at,
        field: entry.field,
        from: entry.from_value,
        id: entry.id,
        summary: entry.summary,
        to: entry.to_value,
        type: entry.type,
      };
    });

  const assignee = issueRow.assignee_id
    ? (profilesById.get(issueRow.assignee_id) ?? null)
    : null;
  const createdBy = profilesById.get(issueRow.created_by);
  const updatedBy = profilesById.get(issueRow.updated_by);

  return {
    issue: {
      assignee: assignee
        ? {
            avatar_url: assignee.avatar_url,
            id: assignee.id,
            name: getDisplayName(assignee, assignee.id),
          }
        : null,
      created_at: issueRow.created_at,
      created_by: {
        avatar_url: createdBy?.avatar_url ?? null,
        id: issueRow.created_by,
        name: getDisplayName(createdBy, issueRow.created_by),
      },
      description: issueRow.description,
      due_date: issueRow.due_date,
      id: issueRow.id,
      identifier: issueRow.identifier,
      issue_number: issueRow.issue_number,
      labels: (labelsByIssueId.get(input.issue_id) ?? []).map((label) => ({
        color: label.color,
        id: label.id,
        name: label.name,
      })),
      priority: mapHinearPriorityToMcpPriority(issueRow.priority),
      project_id: issueRow.project_id,
      status: mapHinearStatusToMcpStatus(issueRow.status),
      title: issueRow.title,
      updated_at: issueRow.updated_at,
      updated_by: {
        avatar_url: updatedBy?.avatar_url ?? null,
        id: issueRow.updated_by,
        name: getDisplayName(updatedBy, issueRow.updated_by),
      },
      version: issueRow.version,
    },
    recent_activity: activity,
    recent_comments: comments,
    summary: `Loaded issue ${issueRow.identifier} with ${comments.length} recent comment${comments.length === 1 ? "" : "s"} and ${activity.length} recent activity item${activity.length === 1 ? "" : "s"}.`,
    user_id: actorId,
  };
}

export async function createIssue(_input: CreateIssueInput) {
  const { actorId, supabase } = await requireActor();
  await assertProjectAccess(_input.project_id, actorId, supabase);

  const title = _input.title.trim();
  if (!title) {
    throw new Error("Issue title is required.");
  }

  const description = _input.description?.trim() ?? "";
  const hinearStatus = _input.status
    ? mapMcpStatusToHinearStatus(_input.status)
    : "Triage";
  const hinearPriority = _input.priority
    ? mapMcpPriorityToHinearPriority(_input.priority)
    : "No Priority";

  const { data, error } = await supabase
    .from("issues")
    .insert({
      assignee_id: _input.assignee_id ?? null,
      created_by: actorId,
      description,
      due_date: _input.due_date ?? null,
      priority: hinearPriority,
      project_id: _input.project_id,
      status: hinearStatus,
      title,
      updated_by: actorId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create issue: ${error.message}`);
  }

  const issue = data as IssueRow & {
    created_by: string;
    description: string;
    updated_by: string;
    version: number;
  };

  const requestedLabels = _input.labels ?? [];
  const labels = requestedLabels.length
    ? await (async () => {
        const normalizedNames = [
          ...new Set(
            requestedLabels.map((label) => label.trim()).filter(Boolean)
          ),
        ];

        if (normalizedNames.length === 0) {
          return [] as LabelRow[];
        }

        const nameKeys = normalizedNames.map((name) =>
          name.toLowerCase().replace(/\s+/g, "-")
        );
        const { data: existingRows, error: existingError } = await supabase
          .from("labels")
          .select("id, name, color, name_key")
          .eq("project_id", _input.project_id)
          .in("name_key", nameKeys);

        if (existingError) {
          throw new Error(`Failed to load labels: ${existingError.message}`);
        }

        const existingByKey = new Map(
          ((existingRows ?? []) as Array<LabelRow & { name_key: string }>).map(
            (row) => [row.name_key, row]
          )
        );

        const missing = normalizedNames.filter(
          (name) => !existingByKey.has(name.toLowerCase().replace(/\s+/g, "-"))
        );

        if (missing.length > 0) {
          const { data: insertedRows, error: insertError } = await supabase
            .from("labels")
            .insert(
              missing.map((name) => ({
                color: "#94A3B8",
                created_by: actorId,
                name,
                name_key: name.toLowerCase().replace(/\s+/g, "-"),
                project_id: _input.project_id,
              }))
            )
            .select("id, name, color, name_key");

          if (insertError) {
            throw new Error(`Failed to create labels: ${insertError.message}`);
          }

          for (const row of (insertedRows ?? []) as Array<
            LabelRow & { name_key: string }
          >) {
            existingByKey.set(row.name_key, row);
          }
        }

        const resolved = nameKeys
          .map((key) => existingByKey.get(key))
          .filter((label): label is LabelRow & { name_key: string } =>
            Boolean(label)
          )
          .map((label) => ({
            color: label.color,
            id: label.id,
            name: label.name,
          }));

        if (resolved.length > 0) {
          const { error: issueLabelsError } = await supabase
            .from("issue_labels")
            .insert(
              resolved.map((label) => ({
                issue_id: issue.id,
                label_id: label.id,
                project_id: _input.project_id,
              }))
            );

          if (issueLabelsError) {
            throw new Error(
              `Failed to attach labels: ${issueLabelsError.message}`
            );
          }
        }

        return resolved;
      })()
    : [];

  const { error: activityError } = await supabase.from("activity_logs").insert({
    actor_id: actorId,
    field: null,
    from_value: null,
    issue_id: issue.id,
    project_id: _input.project_id,
    summary: `Created issue ${issue.identifier}.`,
    to_value: null,
    type: "issue.created",
  });

  if (activityError) {
    throw new Error(`Failed to append activity log: ${activityError.message}`);
  }

  return {
    issue: {
      id: issue.id,
      identifier: issue.identifier,
      labels,
      priority: mapHinearPriorityToMcpPriority(issue.priority),
      project_id: issue.project_id,
      status: mapHinearStatusToMcpStatus(issue.status),
      title: issue.title,
      version: issue.version,
    },
    summary: `Created issue ${issue.identifier}.`,
    url: `${issue.project_id}/${issue.id}`,
    user_id: actorId,
  };
}

export async function updateIssueStatus(input: UpdateIssueStatusInput) {
  const { actorId, supabase } = await requireActor();

  const { data: issueRow, error: issueError } = await supabase
    .from("issues")
    .select("*")
    .eq("id", input.issue_id)
    .maybeSingle();

  if (issueError) {
    throw new Error(`Failed to load issue: ${issueError.message}`);
  }

  if (!issueRow) {
    throw new Error("Issue not found.");
  }

  await assertProjectAccess(issueRow.project_id, actorId, supabase);

  const previousStatus = mapHinearStatusToMcpStatus(issueRow.status);
  const nextStatus = input.status;

  if (previousStatus === nextStatus) {
    return {
      issue_id: issueRow.id,
      previous_status: previousStatus,
      summary: `Issue ${issueRow.identifier} is already ${nextStatus}.`,
      updated_at: issueRow.updated_at,
    };
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("issues")
    .update({
      status: mapMcpStatusToHinearStatus(nextStatus),
      updated_at: new Date().toISOString(),
      updated_by: actorId,
      version: (issueRow.version ?? 0) + 1,
    })
    .eq("id", issueRow.id)
    .eq("version", issueRow.version)
    .select("*")
    .maybeSingle();

  if (updateError) {
    throw new Error(`Failed to update issue status: ${updateError.message}`);
  }

  if (!updatedRow) {
    throw new Error("Issue status update conflicted with a newer version.");
  }

  const { error: activityError } = await supabase.from("activity_logs").insert({
    actor_id: actorId,
    field: "status",
    from_value: issueRow.status,
    issue_id: issueRow.id,
    project_id: issueRow.project_id,
    summary: `상태를 "${issueRow.status}"에서 "${updatedRow.status}"(으)로 변경했습니다`,
    to_value: updatedRow.status,
    type: "issue.status.updated",
  });

  if (activityError) {
    throw new Error(`Failed to append activity log: ${activityError.message}`);
  }

  if (input.comment_on_change?.trim()) {
    const body = input.comment_on_change.trim();
    const { error: commentError } = await supabase.from("comments").insert({
      author_id: actorId,
      body,
      issue_id: issueRow.id,
      project_id: issueRow.project_id,
    });

    if (commentError) {
      throw new Error(`Failed to add status comment: ${commentError.message}`);
    }
  }

  return {
    issue_id: updatedRow.id,
    previous_status: previousStatus,
    summary: `Updated ${updatedRow.identifier} from ${previousStatus} to ${nextStatus}.`,
    updated_at: updatedRow.updated_at,
  };
}
