import type { ProjectMemberWithUser } from "@/features/project-members/types";
import { MemberItem } from "./MemberItem";

interface MemberListProps {
  members: ProjectMemberWithUser[];
  currentUserId?: string;
  currentRole?: "owner" | "member";
  onRemove?: (userId: string) => void;
  onUpdateRole?: (userId: string, role: "owner" | "member") => void;
  className?: string;
}

export function MemberList({
  members,
  currentUserId,
  currentRole,
  onRemove,
  onUpdateRole,
  className = "",
}: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>멤버가 없습니다. 첫 번째 멤버를 초대해보세요!</p>
      </div>
    );
  }

  // Sort by role (owner first), then by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (a.role !== "owner" && b.role === "owner") return 1;
    return (a.userName || "").localeCompare(b.userName || "");
  });

  const canManage = currentRole === "owner";

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedMembers.map((member) => (
        <MemberItem
          key={member.userId}
          member={member}
          isCurrentUser={member.userId === currentUserId}
          canManage={canManage}
          onRemove={onRemove}
          onUpdateRole={onUpdateRole}
        />
      ))}
    </div>
  );
}
