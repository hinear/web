import type {
  ProjectInvitationStatus,
  ProjectMemberSummary,
  ProjectType,
} from "@/features/projects/types";

export const defaultMembers: ProjectMemberSummary[] = [
  {
    id: "member-1",
    name: "Alex Kim",
    role: "owner",
    note: "You",
    isCurrentUser: true,
    canRemove: false,
  },
  {
    id: "member-2",
    name: "John Doe",
    role: "member",
    note: "Assigned 6 issues",
    canRemove: true,
  },
];

export function formatInvitationMeta(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatProjectTypeLabel(value: ProjectType) {
  return value === "team" ? "Team" : "Personal";
}

export function formatInvitationStatus(status: ProjectInvitationStatus) {
  if (status === "accepted") return "Accepted";
  if (status === "revoked") return "Revoked";
  if (status === "expired") return "Expired";
  return "Pending";
}
