import "server-only";

import type {
  CreateCommentInput,
  CreateIssueInput,
  DeleteIssueInput,
  IssuesRepository,
  UpdateIssueInput,
} from "@/features/issues/contracts";
import { SupabaseActivityLogRepository } from "@/features/issues/repositories/activity-log-repository";
import { SupabaseCommentRepository } from "@/features/issues/repositories/comment-repository";
import { SupabaseIssueCommandRepository } from "@/features/issues/repositories/issue-command-repository";
import { SupabaseIssueQueryRepository } from "@/features/issues/repositories/issue-query-repository";
import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";
import type { AppSupabaseServerClient } from "@/lib/supabase/server-client";

export class SupabaseIssuesRepository implements IssuesRepository {
  private commentRepo: SupabaseCommentRepository;
  private activityLogRepo: SupabaseActivityLogRepository;
  private queryRepo: SupabaseIssueQueryRepository;
  private commandRepo: SupabaseIssueCommandRepository;

  constructor(readonly client: AppSupabaseServerClient) {
    this.commentRepo = new SupabaseCommentRepository(client);
    this.activityLogRepo = new SupabaseActivityLogRepository(client);
    this.queryRepo = new SupabaseIssueQueryRepository(client);
    this.commandRepo = new SupabaseIssueCommandRepository(client);
  }

  // --- Commands ---

  async createIssue(input: CreateIssueInput): Promise<Issue> {
    return this.commandRepo.createIssue(input);
  }

  async updateIssue(issueId: string, input: UpdateIssueInput): Promise<Issue> {
    return this.commandRepo.updateIssue(issueId, input);
  }

  async deleteIssue(input: DeleteIssueInput): Promise<void> {
    return this.commandRepo.deleteIssue(input);
  }

  // --- Queries ---

  async listIssuesCursorPage(input: {
    projectId: string;
    limit: number;
    status?: Issue["status"];
    priority?: Issue["priority"];
    after?: { createdAt: string; id: string };
  }): Promise<{ issues: Issue[]; hasMore: boolean }> {
    return this.queryRepo.listIssuesCursorPage(input);
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    return this.queryRepo.getIssueById(issueId);
  }

  async listIssuesByProject(projectId: string): Promise<Issue[]> {
    return this.queryRepo.listIssuesByProject(projectId);
  }

  async listIssuesByStatus(input: {
    projectId: string;
    status: Issue["status"];
  }): Promise<Issue[]> {
    return this.queryRepo.listIssuesByStatus(input);
  }

  async listIssuesByAssignee(input: {
    projectId: string;
    assigneeId: string;
  }): Promise<Issue[]> {
    return this.queryRepo.listIssuesByAssignee(input);
  }

  async listIssuesByPriority(input: {
    projectId: string;
    priority: Issue["priority"];
  }): Promise<Issue[]> {
    return this.queryRepo.listIssuesByPriority(input);
  }

  async listIssuesByLabel(input: {
    projectId: string;
    labelId: string;
  }): Promise<Issue[]> {
    return this.queryRepo.listIssuesByLabel(input);
  }

  async searchIssues(input: {
    projectId: string;
    query: string;
    limit?: number;
  }): Promise<Issue[]> {
    return this.queryRepo.searchIssues(input);
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
    return this.queryRepo.getIssuesByProjectPage(input);
  }

  async countIssuesByProject(projectId: string): Promise<number> {
    return this.queryRepo.countIssuesByProject(projectId);
  }

  async countIssuesByStatus(
    projectId: string
  ): Promise<Record<Issue["status"], number>> {
    return this.queryRepo.countIssuesByStatus(projectId);
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
    return this.queryRepo.filterIssues(input);
  }

  // --- Comments ---

  async createComment(input: CreateCommentInput): Promise<Comment> {
    return this.commentRepo.createComment(input);
  }

  async getCommentById(commentId: string): Promise<Comment> {
    return this.commentRepo.getCommentById(commentId);
  }

  async listCommentsByIssueId(issueId: string): Promise<Comment[]> {
    return this.commentRepo.listCommentsByIssueId(issueId);
  }

  async updateComment(
    commentId: string,
    updates: { body: string }
  ): Promise<Comment> {
    return this.commentRepo.updateComment(commentId, updates);
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.commentRepo.deleteComment(commentId);
  }

  // --- Activity Log ---

  async appendActivityLog(
    entry: Omit<ActivityLogEntry, "id" | "createdAt">
  ): Promise<ActivityLogEntry> {
    return this.activityLogRepo.appendActivityLog(entry);
  }

  async listActivityLogByIssueId(issueId: string): Promise<ActivityLogEntry[]> {
    return this.activityLogRepo.listActivityLogByIssueId(issueId);
  }
}

// Factory function
export function createIssuesRepository(
  client: AppSupabaseServerClient
): IssuesRepository {
  return new SupabaseIssuesRepository(client);
}
