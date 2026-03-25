/**
 * ProjectMembers domain - Project membership and access control
 */

// Actions
export { addMemberAction } from "./actions/add-member-action";
export { checkAccessAction } from "./actions/check-access-action";
export { getMemberRoleAction } from "./actions/get-member-role-action";
export { listMembersAction } from "./actions/list-members-action";
export { removeMemberAction } from "./actions/remove-member-action";
export { updateRoleAction } from "./actions/update-role-action";
// Components
export {
  AddMemberForm,
  MemberItem,
  MemberList,
  MemberManagement,
  RoleSelector,
} from "./components";
// Contracts
export type {
  AddMemberInput,
  CheckAccessInput,
  GetMemberRoleInput,
  ListMembersInput,
  ListUserProjectsInput,
  Project,
  ProjectMembersRepository,
  RemoveMemberInput,
  UpdateRoleInput,
} from "./contracts";
export {
  type AccessDecision,
  canAddMember,
  canDeleteIssue,
  canEditIssue,
  canModifyProjectSettings,
  canRemoveMember,
  canUpdateMemberRole,
  canViewProject,
  checkAllPermissions,
  checkPermission,
} from "./lib/access-control";
// Lib
export {
  assertValidAddMemberInput,
  assertValidRemoveMemberInput,
  assertValidUpdateRoleInput,
  type ValidationError,
  validateAddMemberInput,
  validateRemoveMemberInput,
  validateRoleTransition,
  validateUpdateRoleInput,
} from "./lib/membership-validation";
export {
  canChangeSettings,
  canDelete,
  canManageMembers,
  canPerformAction,
  canRead,
  canWrite,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  PERMISSION_MATRIX,
  requirePermission,
  roleHasPermission,
} from "./lib/permission-checker";
export {
  canDemoteFromOwner,
  canPromoteToOwner,
  compareRoles,
  getAllRoles,
  getRoleBadgeColor,
  getRoleDescription,
  getRoleDisplayName,
  hasHigherAuthority,
  isValidRole,
  isValidRoleTransition,
  VALID_ROLE_TRANSITIONS,
} from "./lib/role-manager";
// Repository
export { SupabaseProjectMembersRepository } from "./repositories/SupabaseProjectMembersRepository";
// Types
export type {
  MemberPermissions,
  MemberRole,
  Permission,
  ProjectMember,
  ProjectMemberWithUser,
} from "./types";
export { getPermissions, hasPermission, ROLE_PERMISSIONS } from "./types";
