export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UserPushSubscription {
  subscription: PushSubscription;
  userId: string;
}

export interface NotificationData {
  type:
    | "issue_assigned"
    | "issue_updated"
    | "issue_status_changed"
    | "comment_added"
    | "project_invited";
  issueId?: string;
  issueIdentifier?: string;
  projectId?: string;
  projectName?: string;
  actor?: {
    id: string;
    name: string;
  };
  targetUserIds?: string[];
  data?: Record<string, unknown>;
}

export interface IssueNotificationData extends NotificationData {
  type:
    | "issue_assigned"
    | "issue_updated"
    | "issue_status_changed"
    | "comment_added";
  issueId: string;
  issueIdentifier: string;
  projectId: string;
}

export interface IssueAssignedNotification extends IssueNotificationData {
  type: "issue_assigned";
  data: {
    previousAssignee?: string | null;
    newAssignee: string;
  };
}

export interface IssueUpdatedNotification extends IssueNotificationData {
  type: "issue_updated";
  data: {
    field: "priority" | "status" | "title" | "description" | "assignee";
    previousValue?: string;
    newValue: string;
  };
}

export interface IssueStatusChangedNotification extends IssueNotificationData {
  type: "issue_status_changed";
  data: {
    previousStatus: string;
    newStatus: string;
  };
}

export interface CommentAddedNotification extends IssueNotificationData {
  type: "comment_added";
  data: {
    commentId: string;
    commentAuthor: string;
    commentPreview: string;
  };
}

export interface ProjectInvitedNotification extends NotificationData {
  type: "project_invited";
  projectId: string;
  projectName: string;
  data: {
    invitedBy: string;
    role: "owner" | "member";
  };
}
