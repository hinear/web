import {
  getRoleDescription,
  getRoleDisplayName,
} from "@/features/project-members/lib/role-manager";
import type { MemberRole } from "@/features/project-members/types";

interface RoleSelectorProps {
  value: MemberRole;
  onChange: (role: MemberRole) => void;
  disabled?: boolean;
  className?: string;
}

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: RoleSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor="role-select"
        className="block text-sm font-medium text-gray-700"
      >
        역할
      </label>
      <div className="space-y-2" id="role-select">
        {(["owner", "member"] as MemberRole[]).map((role) => (
          <label
            key={role}
            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
              value === role
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="role"
              value={role}
              checked={value === role}
              onChange={() => onChange(role)}
              disabled={disabled}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-gray-900">
                {getRoleDisplayName(role)}
              </div>
              <div className="text-sm text-gray-600">
                {getRoleDescription(role)}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
