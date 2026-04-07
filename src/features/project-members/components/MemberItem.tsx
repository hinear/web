import {
  getRoleBadgeColor,
  getRoleDisplayName,
} from "@/features/project-members/lib/role-manager";
import type { ProjectMemberWithUser } from "@/features/project-members/types";

interface MemberItemProps {
  member: ProjectMemberWithUser;
  isCurrentUser?: boolean;
  canManage?: boolean;
  onRemove?: (userId: string) => void;
  onUpdateRole?: (userId: string, role: "owner" | "member") => void;
}

export function MemberItem({
  member,
  isCurrentUser = false,
  canManage = false,
  onRemove,
  onUpdateRole,
}: MemberItemProps) {
  const roleColor = getRoleBadgeColor(member.role);
  const roleLabel = getRoleDisplayName(member.role);

  const canRemoveMember =
    canManage && !isCurrentUser && member.role !== "owner";
  const canUpdateRole = canManage && !isCurrentUser;

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      {/* User info */}
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
          {member.userAvatarUrl ? (
            <img
              src={member.userAvatarUrl}
              alt={member.userName || "User"}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{member.userName?.charAt(0).toUpperCase() || "?"}</span>
          )}
        </div>

        {/* Name and email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {member.userName || "알 수 없음"}
            </span>
            {isCurrentUser ? (
              <span className="text-xs text-gray-500">(나)</span>
            ) : null}
          </div>
          {member.userEmail ? (
            <div className="text-sm text-gray-500 truncate">
              {member.userEmail}
            </div>
          ) : null}
        </div>

        {/* Role badge */}
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${roleColor}`}
        >
          {roleLabel}
        </span>
      </div>

      {/* Actions */}
      {canRemoveMember || canUpdateRole ? (
        <div className="flex items-center gap-2 ml-4">
          {canUpdateRole && onUpdateRole ? (
            <button
              type="button"
              onClick={() =>
                onUpdateRole(
                  member.userId,
                  member.role === "owner" ? "member" : "owner"
                )
              }
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
              title={member.role === "owner" ? "멤버로 변경" : "소유자로 변경"}
            >
              {member.role === "owner" ? "멤버로" : "소유자로"}
            </button>
          ) : null}
          {canRemoveMember && onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(member.userId)}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
              title="제거"
            >
              제거
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
