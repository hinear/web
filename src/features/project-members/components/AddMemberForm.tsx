import { type FormEvent, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Field } from "@/components/atoms/Field";

interface AddMemberFormProps {
  onSubmit: (email: string, role: "owner" | "member") => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function AddMemberForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = "",
}: AddMemberFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member">("member");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (email.trim().length === 0) return;

    await onSubmit(email.trim(), role);
    setEmail("");
    setRole("member");
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Email input */}
      <div>
        <label
          htmlFor="member-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          이메일 주소
        </label>
        <Field
          id="member-email"
          disabled={isSubmitting}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      {/* Role selection */}
      <div>
        <label
          htmlFor="member-role"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          역할
        </label>
        <select
          id="member-role"
          value={role}
          onChange={(e) => setRole(e.target.value as "owner" | "member")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        >
          <option value="member">멤버</option>
          <option value="owner">소유자</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {role === "owner"
            ? "소유자: 모든 권한 보유 (멤버 관리, 설정 변경 포함)"
            : "멤버: 읽기 및 쓰기 권한"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          disabled={email.trim().length === 0 || isSubmitting}
        >
          {isSubmitting ? "추가 중..." : "멤버 추가"}
        </Button>
      </div>
    </form>
  );
}
