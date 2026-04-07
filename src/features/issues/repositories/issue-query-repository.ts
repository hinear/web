import {
  assertQuerySucceeded,
  buildIssueSearchQuery,
  mapIssue,
  mapLabel,
} from "@/features/issues/repositories/issue-repository-helpers";
import type { Issue, Label } from "@/features/issues/types";
import { trackQuery } from "@/lib/performance/query-tracker";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

export class SupabaseIssueQueryRepository {
  constructor(private readonly client: AppSupabaseServerClient) {}

  async listIssuesCursorPage(input: {
    projectId: string;
    limit: number;
    status?: Issue["status"];
    priority?: Issue["priority"];
    after?: { createdAt: string; id: string };
  }): Promise<{ issues: Issue[]; hasMore: boolean }> {
    let query = this.client
      .from("issues")
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
      .eq("project_id", input.projectId);

    if (input.status) {
      query = query.eq("status", input.status);
    }

    if (input.priority) {
      query = query.eq("priority", input.priority);
    }

    if (input.after) {
      query = query.or(
        `created_at.gt.${input.after.createdAt},and(created_at.eq.${input.after.createdAt},id.gt.${input.after.id})`
      );
    }

    const { data, error } = await query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(input.limit + 1);

    assertQuerySucceeded("Failed to load cursor page of issues", error);

    const pageIssues = (data ?? []).slice(0, input.limit).map(mapIssue);
    const labelsByIssueId = await this.listLabelsByIssueIds(
      pageIssues.map((issue) => issue.id),
      input.projectId
    );

    return {
      issues: pageIssues.map((issue) => ({
        ...issue,
        labels: labelsByIssueId.get(issue.id) ?? [],
      })),
      hasMore: (data ?? []).length > input.limit,
    };
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    return trackQuery("getIssueById", async () => {
      const { data, error } = await this.client
        .from("issues")
        .select(
          "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
        )
        .eq("id", issueId)
        .maybeSingle();

      assertQuerySucceeded("Failed to load issue", error);

      if (!data) {
        return null;
      }

      const issue = mapIssue(data);

      const [labels] = await Promise.all([
        this.listIssueLabels(issue.id, issue.projectId),
      ]);

      return {
        ...issue,
        labels,
      };
    });
  }

  async listIssuesByProject(projectId: string): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    assertQuerySucceeded("Failed to list issues by project", error);

    if (!data) {
      return [];
    }

    const issues = data.map(mapIssue);
    const issuesWithLabels = await this.attachLabelsToIssues(issues);

    return issuesWithLabels;
  }

  async listIssuesByStatus(input: {
    projectId: string;
    status: Issue["status"];
  }): Promise<Issue[]> {
    const { data, error } = await this.client
      .from("issues")
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
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
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
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
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
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

    const { data, error } = await this.client
      .from("issues")
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
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
    limit?: number;
  }): Promise<Issue[]> {
    const trimmedQuery = buildIssueSearchQuery(input.query);

    if (!trimmedQuery) {
      return [];
    }

    const { data, error } = await this.client
      .from("issues")
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
      .eq("project_id", input.projectId)
      .textSearch("search_vector", trimmedQuery, {
        config: "simple",
        type: "websearch",
      })
      .order("issue_number", { ascending: true })
      .limit(input.limit ?? 50);

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
    return trackQuery("getIssuesByProjectPage", async () => {
      const { count, error: countError } = await this.client
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("project_id", input.projectId);

      assertQuerySucceeded("Failed to count issues", countError);

      const totalCount = count ?? 0;
      const offset = Math.max(0, (input.page - 1) * input.limit);
      const totalPages = Math.ceil(totalCount / input.limit);

      const { data, error } = await this.client
        .from("issues")
        .select(
          "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
        )
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
    });
  }

  async countIssuesByProject(projectId: string): Promise<number> {
    return trackQuery("countIssuesByProject", async () => {
      const { count, error } = await this.client
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      assertQuerySucceeded("Failed to count project issues", error);

      return count ?? 0;
    });
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
      "In Review": 0,
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
    const normalizedLimit =
      input.limit !== undefined && input.limit > 0 ? input.limit : 100;
    const normalizedSearchQuery = input.searchQuery
      ? buildIssueSearchQuery(input.searchQuery)
      : "";
    let query = this.client
      .from("issues")
      .select(
        "id, project_id, issue_number, identifier, title, status, priority, assignee_id, description, due_date, created_by, updated_by, created_at, updated_at, version"
      )
      .eq("project_id", input.projectId);

    if (input.statuses && input.statuses.length > 0) {
      query = query.in("status", input.statuses);
    }

    if (input.priorities && input.priorities.length > 0) {
      query = query.in("priority", input.priorities);
    }

    if (input.assigneeIds && input.assigneeIds.length > 0) {
      query = query.in("assignee_id", input.assigneeIds);
    }

    if (normalizedSearchQuery) {
      query = query.textSearch("search_vector", normalizedSearchQuery, {
        config: "simple",
        type: "websearch",
      });
    }

    if (input.dueBefore) {
      query = query.lte("due_date", input.dueBefore);
    }

    if (input.dueAfter) {
      query = query.gte("due_date", input.dueAfter);
    }

    if (input.createdAfter) {
      query = query.gte("created_at", input.createdAfter);
    }

    if (input.createdBefore) {
      query = query.lte("created_at", input.createdBefore);
    }

    query = query.order("created_at", { ascending: true }).order("id", {
      ascending: true,
    });

    if (input.offset !== undefined && input.offset >= 0) {
      query = query.range(input.offset, input.offset + normalizedLimit - 1);
    } else {
      query = query.limit(normalizedLimit);
    }

    let issuesWithoutLabels: Issue[] = [];
    const { data, error } = await query;

    assertQuerySucceeded("Failed to filter issues", error);

    if (data) {
      issuesWithoutLabels = data.map(mapIssue);
    }

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

    const issuesWithLabels =
      await this.attachLabelsToIssues(issuesWithoutLabels);

    return issuesWithLabels;
  }

  // --- Private helpers ---

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
      .select("id, name, color, name_key")
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
}
