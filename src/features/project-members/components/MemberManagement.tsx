import { useCallback, useState } from "react";
import { Button } from "@/components/atoms/Button";
import type {
  MemberRole,
  ProjectMemberWithUser,
} from "@/features/project-members/types";
import { AddMemberForm } from "./AddMemberForm";
import { MemberList } from "./MemberList";

interface MemberManagementProps {
  members: ProjectMemberWithUser[];
  currentUserId: string;
  currentRole: MemberRole;
  projectId: string;
  onAddMember: (email: string, role: MemberRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: MemberRole) => Promise<void>;
  className?: string;
}

export function MemberManagement({
  members,
  currentUserId,
  currentRole,
  projectId: _projectId,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  className = "",
}: MemberManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = useCallback(
    async (email: string, role: MemberRole) => {
      setIsSubmitting(true);
      try {
        await onAddMember(email, role);
        setShowAddForm(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onAddMember]
  );

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      if (!confirm("정말 이 멤버를 제거하시겠습니까?")) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onRemoveMember(userId);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onRemoveMember]
  );

  const handleUpdateRole = useCallback(
    async (userId: string, role: MemberRole) => {
      const action = role === "owner" ? "소유자로" : "멤버로";
      if (!confirm(`정말 ${action} 변경하시겠습니까?`)) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onUpdateRole(userId, role);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onUpdateRole]
  );

  const canManage = currentRole === "owner";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">멤버</h3>
          <p className="text-sm text-gray-600">총 {members.length}명의 멤버</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isSubmitting}
          >
            {showAddForm ? "취소" : "멤버 추가"}
          </Button>
        )}
      </div>

      {/* Add member form */}
      {showAddForm && canManage && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <AddMemberForm
            onSubmit={handleAddMember}
            onCancel={() => setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Member list */}
      <MemberList
        members={members}
        currentUserId={currentUserId}
        currentRole={currentRole}
        onRemove={canManage ? handleRemoveMember : undefined}
        onUpdateRole={canManage ? handleUpdateRole : undefined}
      />
    </div>
  );
}
