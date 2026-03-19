import type { ActivityLogEntry, Comment, Issue } from "@/features/issues/types";

export interface CreateIssueInput {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  createdBy: string;
}

export interface CreateCommentInput {
  issueId: string;
  projectId: string;
  authorId: string;
  body: string;
}

export interface IssuesRepository {
  createIssue(input: CreateIssueInput): Promise<Issue>;
  createComment(input: CreateCommentInput): Promise<Comment>;
  appendActivityLog(entry: Omit<ActivityLogEntry, "id" | "createdAt">): Promise<ActivityLogEntry>;
  getIssueById(issueId: string): Promise<Issue | null>;
}
