export const PROJECT_TYPES = ["personal", "team"] as const;
export const PROJECT_MEMBER_ROLES = ["owner", "member"] as const;
export const PROJECT_INVITATION_STATUSES = [
  "pending",
  "accepted",
  "revoked",
  "expired",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];
export type ProjectInvitationStatus =
  (typeof PROJECT_INVITATION_STATUSES)[number];

export interface Project {
  id: string;
  key: string;
  name: string;
  type: ProjectType;
  issueSeq: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  createdAt: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  role: "member";
  invitedBy: string;
  status: ProjectInvitationStatus;
  token: string;
  expiresAt: string;
  acceptedBy: string | null;
  createdAt: string;
}

export interface ProjectMemberSummary {
  avatarUrl?: string | null;
  id: string;
  name: string;
  role: ProjectMemberRole;
  note: string;
  isCurrentUser?: boolean;
  canRemove?: boolean;
}

export interface ProjectInvitationSummary {
  id: string;
  email: string;
  token: string;
  invitedBy: string;
  invitedByAvatarUrl?: string | null;
  status: ProjectInvitationStatus;
  expiresAt: string;
  createdAt: string;
}
