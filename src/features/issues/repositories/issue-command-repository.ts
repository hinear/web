import type {
  CreateIssueInput,
  DeleteIssueInput,
  UpdateIssueInput,
} from "@/features/issues/contracts";
import { createLabelKey, getLabelColor } from "@/features/issues/lib/labels";
import { createRepositoryError } from "@/features/issues/lib/repository-errors";
import { SupabaseActivityLogRepository } from "@/features/issues/repositories/activity-log-repository";
import { SupabaseIssueQueryRepository } from "@/features/issues/repositories/issue-query-repository";
import {
  assertDataPresent,
  assertQuerySucceeded,
  getDescriptionUpdateSummary,
  mapIssue,
  mapLabel,
} from "@/features/issues/repositories/issue-repository-helpers";
import type {
  ActivityLogEntry,
  ConflictError,
  Issue,
  Label,
} from "@/features/issues/types";
import { GitHubSyncService } from "@/lib/github/sync-service";
import { trackQuery } from "@/lib/performance/query-tracker";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";
import type { TableInsert, TableUpdate } from "@/lib/supabase/types";

export class SupabaseIssueCommandRepository {
  private queryRepo: SupabaseIssueQueryRepository;
  private activityLogRepo: SupabaseActivityLogRepository;

  constructor(private readonly client: AppSupabaseServerClient) {
    this.queryRepo = new SupabaseIssueQueryRepository(client);
    this.activityLogRepo = new SupabaseActivityLogRepository(client);
  }

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    return trackQuery("createIssue", async () => {
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

      this.syncIssueCreationToGitHub({
        ...issue,
        labels,
      });

      return {
        ...issue,
        labels,
      };
    });
  }

  async updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue> {
    return trackQuery("updateIssue", async () => {
      const currentIssue = await this.queryRepo.getIssueById(issueId);

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

      if (
        input.dueDate !== undefined &&
        input.dueDate !== currentIssue.dueDate
      ) {
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
        const latestIssue = await this.queryRepo.getIssueById(issueId);

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
        await this.activityLogRepo.appendActivityLog(activityEntry);
      }

      const issue = {
        ...mapIssue(assertDataPresent("Failed to update issue", data)),
        labels: currentIssue.labels,
      };

      this.syncIssueUpdateToGitHub(issue);

      return issue;
    });
  }

  async deleteIssue(input: DeleteIssueInput): Promise<void> {
    const issue = await this.queryRepo.getIssueById(input.issueId);

    if (!issue) {
      throw createRepositoryError("ISSUE_NOT_FOUND", "Issue not found.");
    }

    const { data, error } = await this.client
      .from("issues")
      .delete()
      .eq("id", input.issueId)
      .select("id");

    assertQuerySucceeded("Failed to delete issue", error);

    if (!data?.length) {
      throw createRepositoryError(
        "FORBIDDEN",
        "You do not have permission to delete this issue."
      );
    }
  }

  // --- Private helpers ---

  private syncIssueCreationToGitHub(issue: Issue): void {
    const syncService = new GitHubSyncService(this.client);
    syncService
      .syncIssueToGitHub({
        projectId: issue.projectId,
        issueId: issue.id,
        issueNumber: issue.issueNumber,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        labels: issue.labels,
      })
      .catch((error) => {
        console.error("Background GitHub sync failed:", error);
      });
  }

  private syncIssueUpdateToGitHub(issue: Issue): void {
    if (!issue.githubIssueNumber || !issue.githubIssueId) {
      return;
    }

    const syncService = new GitHubSyncService(this.client);
    syncService
      .updateGitHubIssue({
        projectId: issue.projectId,
        issueId: issue.id,
        issueNumber: issue.issueNumber,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        labels: issue.labels,
        githubIssueId: issue.githubIssueId,
        githubIssueNumber: issue.githubIssueNumber,
      })
      .catch((error) => {
        console.error("Background GitHub update failed:", error);
      });
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
      .select("id, name, color, name_key")
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
      .select("id, name, color, name_key")
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
}
