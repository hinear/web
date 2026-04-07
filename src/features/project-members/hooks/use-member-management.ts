import { useCallback, useState } from "react";
import type { MemberRole } from "../types";

interface UseMemberManagementOptions {
  onAddMember: (email: string, role: MemberRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: MemberRole) => Promise<void>;
}

export function useMemberManagement({
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}: UseMemberManagementOptions) {
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

  return {
    showAddForm,
    isSubmitting,
    handleAddMember,
    handleRemoveMember,
    handleUpdateRole,
    setShowAddForm,
  };
}
