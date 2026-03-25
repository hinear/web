/**
 * Issues domain - Issue tracking and management
 */

// Actions
export { createIssueAction } from "./actions/create-issue-action";
// Components
export * from "./components";

// Contracts
export type {
  Assignee,
  BoardIssue,
  CreateCommentInput,
  CreateIssueInput,
  IssueDetail,
  IssuesRepository,
  UpdateIssueInput,
} from "./contracts";

export { isConflictError } from "./contracts";

// Lib - State machine
export {
  assertValidStatusTransition,
  getRecommendedNextStatus,
  getStatusBadgeColor,
  getStatusDescription,
  getStatusDisplayName,
  getValidNextStatuses,
  isActiveStatus,
  isCompletedStatus,
  isTerminalStatus,
  isValidStatusTransition,
  VALID_TRANSITIONS,
} from "./lib/issue-state-machine";
// Lib - Validation
export {
  assertValidCreateIssueInput,
  assertValidUpdateIssueInput,
  type ValidationError,
  validateCreateIssueInput,
  validateUpdateIssueInput,
} from "./lib/issue-validation";
// Lib - Labels
export { createLabelKey, getLabelColor } from "./lib/labels";

// Lib - Error handling
export {
  createPostgrestRepositoryError,
  createRepositoryError,
} from "./lib/repository-errors";
export { ServerIssuesRepository } from "./repositories/server-issues-repository";
// Repository
export { SupabaseIssuesRepository } from "./repositories/supabase-issues-repository";
// Types
export type {
  ActivityLogEntry,
  Comment,
  ConflictError,
  Issue,
  IssuePriority,
  IssueStatus,
  Label,
} from "./types";
export { ISSUE_PRIORITIES, ISSUE_STATUSES } from "./types";
