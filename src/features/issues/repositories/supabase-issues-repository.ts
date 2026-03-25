import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CreateCommentInput,
  CreateIssueInput,
  GetIssuesByProjectPageInput,
  IssuesRepository,
  ListIssuesByAssigneeInput,
  ListIssuesByLabelInput,
  ListIssuesByPriorityInput,
  ListIssuesByStatusInput,
  SearchIssuesInput,
  UpdateIssueInput,
} from "@/features/issues/contracts";
import { createLabelKey, getLabelColor } from "@/features/issues/lib/labels";
import {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "@/features/issues/lib/repository-errors";
import type {
  ActivityLogEntry,
  Comment,
  ConflictError,
  Issue,
  Label,
} from "@/features/issues/types";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  Json,
  TableInsert,
  TableRow,
  TableUpdate,
} from "@/lib/supabase/types";

function assertQuerySucceeded(
  context: string,
  error: PostgrestError | null
): void {
  if (error) {
    throw createPostgrestRepositoryError(context, error);
  }
}

function assertDataPresent<T>(context: string, data: T | null): T {
  if (!data) {
    throw createRepositoryError(
      "UNKNOWN",
      `${context}: query returned no rows.`
    );
  }

  return data;
}

function mapIssue(row: TableRow<"issues">): Issue {
  return {
    id: row.id,
    projectId: row.project_id,
    issueNumber: row.issue_number,
    identifier: row.identifier,
    title: row.title,
    status: row.status as Issue["status"],
    priority: row.priority as Issue["priority"],
    assigneeId: row.assignee_id,
    labels: [],
    description: row.description,
    dueDate: row.due_date,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };
}

function mapLabel(row: TableRow<"labels">): Label {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

function mapComment(row: TableRow<"comments">): Comment {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapActivityLogEntry(row: TableRow<"activity_logs">): ActivityLogEntry {
  return {
    id: row.id,
    issueId: row.issue_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    type: row.type,
    field: row.field,
    from: row.from_value,
    to: row.to_value,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

function getDescriptionUpdateSummary(previous: string, next: string): string {
  if (previous.trim().length === 0 && next.trim().length > 0) {
    return "설명을 추가했습니다";
  }

  if (previous.trim().length > 0 && next.trim().length === 0) {
    return "설명을 비웠습니다";
  }

  return "설명을 업데이트했습니다";
}

export class SupabaseIssuesRepository implements IssuesRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async listCommentsByIssueId(issueId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to load issue comments", error);

    return (data ?? []).map(mapComment);
  }

  async listActivityLogByIssueId(issueId: string): Promise<ActivityLogEntry[]> {
    const { data, error } = await this.client
      .from("activity_logs")
      .select()
      .eq("issue_id", issueId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to load issue activity log", error);

    return (data ?? []).map(mapActivityLogEntry);
  }

  private async listLabelsByIssueIds(
    issueIds: string[],
    projectId: string
  ): Promise<Map<string, Label[]>> {
    if (issueIds.length === 0) {
      return new Map();
    }

    const { data: issueLabelRows, error: issueLabelError } = await this.client
      .from("issue_labels")
      .select("issue_id, label_id")
      .eq("project_id", projectId)
      .in("issue_id", issueIds);

    assertQuerySucceeded("Failed to load issue labels", issueLabelError);

    const filteredIssueLabelRows = issueLabelRows ?? [];
    const labelIds = [
      ...new Set(filteredIssueLabelRows.map((row) => row.label_id)),
    ];

    if (labelIds.length === 0) {
      return new Map(issueIds.map((issueId) => [issueId, []]));
    }

    const { data: labelRows, error: labelError } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .in("id", labelIds);

    assertQuerySucceeded("Failed to load labels", labelError);

    const labelsById = new Map(
      (labelRows ?? []).map((row) => [row.id, mapLabel(row)])
    );
    const labelsByIssueId = new Map(
      issueIds.map((issueId) => [issueId, [] as Label[]])
    );

    for (const issueLabelRow of filteredIssueLabelRows) {
      const label = labelsById.get(issueLabelRow.label_id);

      if (!label) {
        continue;
      }

      labelsByIssueId.get(issueLabelRow.issue_id)?.push(label);
    }

    return labelsByIssueId;
  }

  private async listIssueLabels(
    issueId: string,
    projectId: string
  ): Promise<Label[]> {
    const labelsByIssueId = await this.listLabelsByIssueIds(
      [issueId],
      projectId
    );
    return labelsByIssueId.get(issueId) ?? [];
  }

  private async attachLabelsToIssues(issues: Issue[]): Promise<Issue[]> {
    if (issues.length === 0) {
      return issues;
    }

    const projectId = issues[0]?.projectId;
    if (!projectId) {
      return issues;
    }

    const labelsByIssueId = await this.listLabelsByIssueIds(
      issues.map((issue) => issue.id),
      projectId
    );

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? issue.labels,
    }));
  }

  private async resolveProjectLabels(
    projectId: string,
    actorId: string,
    labelNames: string[]
  ): Promise<Label[]> {
    if (labelNames.length === 0) {
      return [];
    }

    const labelKeys = labelNames.map((name) => createLabelKey(name));
    const { data: existingRows, error: existingError } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .in("name_key", labelKeys);

    assertQuerySucceeded("Failed to load existing labels", existingError);

    const existingByKey = new Map(
      (existingRows ?? []).map((row) => [row.name_key, mapLabel(row)])
    );

    const missingRows: TableInsert<"labels">[] = labelNames
      .filter((name) => !existingByKey.has(createLabelKey(name)))
      .map((name) => ({
        color: getLabelColor(createLabelKey(name)),
        created_by: actorId,
        name,
        name_key: createLabelKey(name),
        project_id: projectId,
      }));

    if (missingRows.length > 0) {
      const { error: insertLabelsError } = await this.client
        .from("labels")
        .insert(missingRows);

      assertQuerySucceeded("Failed to create labels", insertLabelsError);
    }

    const { data: labelRows, error: labelError } = await this.client
      .from("labels")
      .select()
      .eq("project_id", projectId)
      .in("name_key", labelKeys);

    assertQuerySucceeded("Failed to resolve labels", labelError);

    const labelsByKey = new Map(
      (labelRows ?? []).map((row) => [row.name_key, mapLabel(row)])
    );

    return labelKeys
      .map((labelKey) => labelsByKey.get(labelKey))
      .filter((label): label is Label => Boolean(label));
  }

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    const { data, error } = await this.client
      .from("issues")
      .insert({
        assignee_id: input.assigneeId ?? null,
        created_by: input.createdBy,
        description: input.description ?? "",
        due_date: input.dueDate ?? null,
        priority: input.priority ?? "No Priority",
        project_id: input.projectId,
        status: input.status ?? "Triage",
        title: input.title,
        updated_by: input.createdBy,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create issue", error);

    const issue = mapIssue(assertDataPresent("Failed to create issue", data));
    const labels = await this.resolveProjectLabels(
      input.projectId,
      input.createdBy,
      input.labels ?? []
    );

    if (labels.length > 0) {
      const { error: issueLabelsError } = await this.client
        .from("issue_labels")
        .insert(
          labels.map((label) => ({
            issue_id: issue.id,
            label_id: label.id,
            project_id: issue.projectId,
          }))
        );

      assertQuerySucceeded("Failed to link issue labels", issueLabelsError);
    }

    return {
      ...issue,
      labels,
    };
  }

  async listIssuesByProject(projectId: string): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", projectId)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to load project issues", error);

    const issues = (data ?? []).map(mapIssue);

    // 병렬로 관련 데이터 페칭
    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .insert({
        issue_id: input.issueId,
        project_id: input.projectId,
        author_id: input.authorId,
        body: input.body,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to create comment", error);

    return mapComment(assertDataPresent("Failed to create comment", data));
  }

  async getCommentById(commentId: string): Promise<Comment> {
    const { data, error } = await this.client
      .from("comments")
      .select()
      .eq("id", commentId)
      .single();

    assertQuerySucceeded("Failed to get comment", error);

    return mapComment(assertDataPresent("Failed to get comment", data));
  }

  async updateComment(
    commentId: string,
    updates: { body: string }
  ): Promise<Comment> {
    console.log(
      "[updateComment] Updating comment:",
      commentId,
      "with body:",
      updates.body
    );

    const { data, error } = await this.client
      .from("comments")
      .update({ body: updates.body })
      .eq("id", commentId)
      .select()
      .single();

    console.log("[updateComment] Data:", data, "Error:", error);

    assertQuerySucceeded("Failed to update comment", error);

    return mapComment(assertDataPresent("Failed to update comment", data));
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.client
      .from("comments")
      .delete()
      .eq("id", commentId);

    assertQuerySucceeded("Failed to delete comment", error);
  }

  async appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
  ): Promise<ActivityLogEntry> {
    const { data, error } = await this.client
      .from("activity_logs")
      .insert({
        issue_id: entry.issueId,
        project_id: entry.projectId,
        actor_id: entry.actorId,
        type: entry.type,
        field: entry.field,
        from_value: (entry.from as Json | null) ?? null,
        to_value: (entry.to as Json | null) ?? null,
        summary: entry.summary,
      })
      .select()
      .single();

    assertQuerySucceeded("Failed to append activity log", error);

    return mapActivityLogEntry(
      assertDataPresent("Failed to append activity log", data)
    );
  }

  async updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue> {
    const currentIssue = await this.getIssueById(issueId);

    if (!currentIssue) {
      throw createRepositoryError("ISSUE_NOT_FOUND", "Issue not found.");
    }

    const issueUpdates: TableUpdate<"issues"> = {
      updated_by: input.updatedBy,
    };
    const activityEntries: Array<Omit<ActivityLogEntry, "id" | "createdAt">> =
      [];

    if (input.title !== undefined && input.title !== currentIssue.title) {
      issueUpdates.title = input.title;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.title.updated",
        field: "title",
        from: currentIssue.title,
        to: input.title,
        summary: `제목을 "${currentIssue.title}"에서 "${input.title}"(으)로 변경했습니다`,
      });
    }

    if (input.status !== undefined && input.status !== currentIssue.status) {
      issueUpdates.status = input.status;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.status.updated",
        field: "status",
        from: currentIssue.status,
        to: input.status,
        summary: `상태를 "${currentIssue.status}"에서 "${input.status}"(으)로 변경했습니다`,
      });
    }

    if (
      input.priority !== undefined &&
      input.priority !== currentIssue.priority
    ) {
      issueUpdates.priority = input.priority;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.priority.updated",
        field: "priority",
        from: currentIssue.priority,
        to: input.priority,
        summary: `우선순위를 "${currentIssue.priority}"에서 "${input.priority}"(으)로 변경했습니다`,
      });
    }

    if (
      input.description !== undefined &&
      input.description !== currentIssue.description
    ) {
      issueUpdates.description = input.description;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.description.updated",
        field: "description",
        from: currentIssue.description,
        to: input.description,
        summary: getDescriptionUpdateSummary(
          currentIssue.description,
          input.description
        ),
      });
    }

    if (
      input.assigneeId !== undefined &&
      input.assigneeId !== currentIssue.assigneeId
    ) {
      issueUpdates.assignee_id = input.assigneeId;
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.assignee.updated",
        field: "assigneeId",
        from: currentIssue.assigneeId,
        to: input.assigneeId,
        summary: input.assigneeId
          ? "담당자를 배정했습니다"
          : "담당자를 해제했습니다",
      });
    }

    if (input.dueDate !== undefined && input.dueDate !== currentIssue.dueDate) {
      issueUpdates.due_date = input.dueDate;
      const previousDate = currentIssue.dueDate
        ? new Date(currentIssue.dueDate).toLocaleDateString("ko-KR")
        : "없음";
      const newDate = input.dueDate
        ? new Date(input.dueDate).toLocaleDateString("ko-KR")
        : "없음";
      activityEntries.push({
        issueId: currentIssue.id,
        projectId: currentIssue.projectId,
        actorId: input.updatedBy,
        type: "issue.dueDate.updated",
        field: "dueDate",
        from: currentIssue.dueDate,
        to: input.dueDate,
        summary: `마감일을 "${previousDate}"에서 "${newDate}"(으)로 변경했습니다`,
      });
    }

    if (Object.keys(issueUpdates).length === 1) {
      return currentIssue;
    }

    issueUpdates.version = currentIssue.version + 1;

    const { data, error } = await this.client
      .from("issues")
      .update(issueUpdates)
      .eq("id", issueId)
      .eq("version", input.version)
      .select()
      .maybeSingle();

    assertQuerySucceeded("Failed to update issue", error);

    if (!data) {
      const latestIssue = await this.getIssueById(issueId);

      if (!latestIssue) {
        throw createRepositoryError("ISSUE_NOT_FOUND", "Issue not found.");
      }

      const conflictError: ConflictError = {
        currentIssue: latestIssue,
        currentVersion: latestIssue.version,
        message: "This issue has changed since you loaded it.",
        requestedVersion: input.version,
        type: "CONFLICT",
      };

      throw conflictError;
    }

    for (const activityEntry of activityEntries) {
      await this.appendActivityLog(activityEntry);
    }

    const issue = mapIssue(assertDataPresent("Failed to update issue", data));

    return {
      ...issue,
      labels: currentIssue.labels,
    };
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("id", issueId)
      .maybeSingle();

    assertQuerySucceeded("Failed to load issue", error);

    if (!data) {
      return null;
    }

    const issue = mapIssue(data);

    // 병렬로 관련 데이터 페칭
    const [labels] = await Promise.all([
      this.listIssueLabels(issue.id, issue.projectId),
    ]);

    return {
      ...issue,
      labels,
    };
  }

  async listIssuesByStatus(input: {
    projectId: string;
    status: Issue["status"];
  }): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", input.projectId)
      .eq("status", input.status)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to load issues by status", error);

    const issues = (data ?? []).map(mapIssue);

    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        input.projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async listIssuesByAssignee(input: {
    projectId: string;
    assigneeId: string;
  }): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", input.projectId)
      .eq("assignee_id", input.assigneeId)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to load issues by assignee", error);

    const issues = (data ?? []).map(mapIssue);

    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        input.projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async listIssuesByPriority(input: {
    projectId: string;
    priority: Issue["priority"];
  }): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", input.projectId)
      .eq("priority", input.priority)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to load issues by priority", error);

    const issues = (data ?? []).map(mapIssue);

    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        input.projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async listIssuesByLabel(input: {
    projectId: string;
    labelId: string;
  }): Promise<Issue[]> {
    // 먼저 해당 라벨이 붙은 이슈 ID들을 가져옴
    const { data: issueLabelRows, error: issueLabelError } = await this.client
      .from("issue_labels")
      .select("issue_id")
      .eq("project_id", input.projectId)
      .eq("label_id", input.labelId);

    assertQuerySucceeded("Failed to load issue labels", issueLabelError);

    const issueIds = (issueLabelRows ?? []).map((row) => row.issue_id);

    if (issueIds.length === 0) {
      return [];
    }

    // 해당 이슈들을 가져옴
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", input.projectId)
      .in("id", issueIds)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to load issues by label", error);

    const issues = (data ?? []).map(mapIssue);

    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        input.projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async searchIssues(input: {
    projectId: string;
    query: string;
  }): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", input.projectId)
      .or(`title.ilike.%${input.query}%,description.ilike.%${input.query}%`)
      .order("issue_number", { ascending: true });

    assertQuerySucceeded("Failed to search issues", error);

    const issues = (data ?? []).map(mapIssue);

    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        input.projectId
      ),
    ]);

    return issues.map((issue) => ({
      ...issue,
      labels: labelsByIssueId.get(issue.id) ?? [],
    }));
  }

  async getIssuesByProjectPage(input: {
    projectId: string;
    page: number;
    limit: number;
  }): Promise<{
    issues: Issue[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // 전체 개수를 먼저 가져옴
    const { count, error: countError } = await this.client
      .from("issues")
      .select("*", { count: "exact", head: true })
      .eq("project_id", input.projectId);

    assertQuerySucceeded("Failed to count issues", countError);

    const totalCount = count ?? 0;
    const offset = input.page * input.limit;
    const totalPages = Math.ceil(totalCount / input.limit);

    // 페이지네이션된 이슈들을 가져옴
    const { data, error } = await this.client
      .from("issues")
      .select()
      .eq("project_id", input.projectId)
      .order("issue_number", { ascending: true })
      .range(offset, offset + input.limit - 1);

    assertQuerySucceeded("Failed to load issues page", error);

    const issues = (data ?? []).map(mapIssue);

    const [labelsByIssueId] = await Promise.all([
      this.listLabelsByIssueIds(
        issues.map((issue) => issue.id),
        input.projectId
      ),
    ]);

    return {
      issues: issues.map((issue) => ({
        ...issue,
        labels: labelsByIssueId.get(issue.id) ?? [],
      })),
      totalCount,
      page: input.page,
      limit: input.limit,
      totalPages,
    };
  }

  async countIssuesByProject(projectId: string): Promise<number> {
    const { count, error } = await this.client
      .from("issues")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    assertQuerySucceeded("Failed to count project issues", error);

    return count ?? 0;
  }

  async countIssuesByStatus(
    projectId: string
  ): Promise<Record<Issue["status"], number>> {
    const { data, error } = await this.client
      .from("issues")
      .select("status")
      .eq("project_id", projectId);

    assertQuerySucceeded("Failed to count issues by status", error);

    const statusCounts: Record<Issue["status"], number> = {
      Triage: 0,
      Backlog: 0,
      Todo: 0,
      "In Progress": 0,
      Done: 0,
      Canceled: 0,
      Closed: 0,
    };

    for (const row of data ?? []) {
      const status = row.status as Issue["status"];
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    }

    return statusCounts;
  }

  /**
   * 고급 필터링 - 복합 조건으로 이슈 조회
   */
  async filterIssues(input: {
    projectId: string;
    statuses?: Issue["status"][];
    priorities?: Issue["priority"][];
    assigneeIds?: string[];
    labelIds?: string[];
    searchQuery?: string;
    dueBefore?: string;
    dueAfter?: string;
    createdAfter?: string;
    createdBefore?: string;
    limit?: number;
    offset?: number;
  }): Promise<Issue[]> {
    let query = this.client
      .from("issues")
      .select("*")
      .eq("project_id", input.projectId);

    // 상태 필터
    if (input.statuses && input.statuses.length > 0) {
      query = query.in("status", input.statuses);
    }

    // 우선순위 필터
    if (input.priorities && input.priorities.length > 0) {
      query = query.in("priority", input.priorities);
    }

    // 담당자 필터
    if (input.assigneeIds && input.assigneeIds.length > 0) {
      query = query.in("assignee_id", input.assigneeIds);
    }

    // 검색어 필터
    if (input.searchQuery && input.searchQuery.trim()) {
      const searchTerm = `%${input.searchQuery.trim()}%`;
      query = query.or(
        `title.ilike.${searchTerm},description.ilike.${searchTerm}`
      );
    }

    // 마감일 범위 필터
    if (input.dueBefore) {
      query = query.lte("due_date", input.dueBefore);
    }

    if (input.dueAfter) {
      query = query.gte("due_date", input.dueAfter);
    }

    // 생성일 범위 필터
    if (input.createdAfter) {
      query = query.gte("created_at", input.createdAfter);
    }

    if (input.createdBefore) {
      query = query.lte("created_at", input.createdBefore);
    }

    // 라벨 필터 (별도 쿼리 필요)
    let issuesWithoutLabels: Issue[] = [];
    const { data, error } = await query;

    assertQuerySucceeded("Failed to filter issues", error);

    if (data) {
      issuesWithoutLabels = data.map(mapIssue);
    }

    // 라벨 필터가 있는 경우 별도 처리
    if (
      input.labelIds &&
      input.labelIds.length > 0 &&
      issuesWithoutLabels.length > 0
    ) {
      const issueIds = issuesWithoutLabels.map((issue) => issue.id);

      const { data: labelData, error: labelError } = await this.client
        .from("issue_labels")
        .select("issue_id")
        .in("label_id", input.labelIds)
        .in("issue_id", issueIds);

      assertQuerySucceeded("Failed to filter by labels", labelError);

      const matchingIssueIds = new Set(
        labelData?.map((row) => row.issue_id) ?? []
      );

      issuesWithoutLabels = issuesWithoutLabels.filter((issue) =>
        matchingIssueIds.has(issue.id)
      );
    }

    // 라벨 병렬 로드
    const issuesWithLabels =
      await this.attachLabelsToIssues(issuesWithoutLabels);

    return issuesWithLabels;
  }
}
