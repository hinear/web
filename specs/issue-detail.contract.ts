export const ISSUE_STATUSES = [
  "Triage",
  "Backlog",
  "Todo",
  "In Progress",
  "Done",
  "Canceled",
] as const;

export const ISSUE_PRIORITIES = [
  "No Priority",
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export interface UserRef {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  body: string;
  author: UserRef;
  createdAt: string;
}

export type ActivityType =
  | "issue.created"
  | "issue.title.updated"
  | "issue.status.updated"
  | "issue.priority.updated"
  | "issue.assignee.updated"
  | "issue.labels.updated"
  | "issue.description.updated"
  | "issue.comment.created";

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  actor: UserRef;
  createdAt: string;
  summary: string;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee: UserRef | null;
  labels: Label[];
  description: string;
  dueDate: string | null;
  comments: Comment[];
  activityLog: ActivityLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateIssueInput {
  id: string;
  title?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  labelIds?: string[];
  description?: string;
}

export interface CreateCommentInput {
  issueId: string;
  body: string;
}

export interface IssueRepository {
  getIssueById(issueId: string): Promise<Issue | null>;
  updateIssue(input: UpdateIssueInput): Promise<Issue>;
  createComment(input: CreateCommentInput): Promise<Comment>;
}

export function createNewIssueDefaults(
  input: Pick<Issue, "id" | "identifier" | "title" | "createdAt" | "updatedAt">
): Issue {
  return {
    ...input,
    status: "Triage",
    priority: "No Priority",
    assignee: null,
    labels: [],
    description: "",
    dueDate: null,
    comments: [],
    activityLog: [],
  };
}

export function canSubmitTitle(title: string): boolean {
  return title.trim().length > 0;
}

export function canSubmitComment(body: string): boolean {
  return body.trim().length > 0;
}
