export const ISSUE_STATUSES = [
  "Triage",
  "Backlog",
  "Todo",
  "In Progress",
  "Done",
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

export interface Issue {
  id: string;
  projectId: string;
  issueNumber: number;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  projectId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  issueId: string;
  projectId: string;
  actorId: string;
  type: string;
  field: string | null;
  from: unknown;
  to: unknown;
  summary: string;
  createdAt: string;
}
