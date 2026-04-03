/**
 * Issue state machine
 * Validates status transitions for issues
 */

import type { IssueStatus } from "../types";

/**
 * Valid status transitions
 * Defines which statuses can be changed to which other statuses
 */
export const VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Triage: ["Backlog", "Todo", "Canceled"],
  Backlog: ["Todo", "In Progress", "Canceled"],
  Todo: ["In Progress", "Done", "Canceled"],
  "In Progress": ["In Review", "Todo", "Canceled"],
  "In Review": ["Done", "Todo", "Canceled"],
  Done: ["Closed"], // 완료 후 닫기만 가능
  Closed: ["In Progress"], // 재오픈 시 다시 진행 중으로
  Canceled: [], // 취소된 이슈는 상태 변경 불가
} as const;

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  fromStatus: IssueStatus,
  toStatus: IssueStatus
): boolean {
  // Same status is always valid (no change)
  if (fromStatus === toStatus) {
    return true;
  }

  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Get all valid next statuses for a given status
 */
export function getValidNextStatuses(
  currentStatus: IssueStatus
): IssueStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Validate a status transition and throw if invalid
 */
export function assertValidStatusTransition(
  fromStatus: IssueStatus,
  toStatus: IssueStatus,
  context: string = "상태 변경"
): void {
  if (!isValidStatusTransition(fromStatus, toStatus)) {
    const validStatuses = getValidNextStatuses(fromStatus);
    throw new Error(
      `${context}: ${fromStatus}에서 ${toStatus}(으)로 변경할 수 없습니다. ` +
        `유효한 다음 상태: ${validStatuses.join(", ")}`
    );
  }
}

/**
 * Get status display name in Korean
 */
export function getStatusDisplayName(status: IssueStatus): string {
  const displayNames: Record<IssueStatus, string> = {
    Triage: "분류 대기",
    Backlog: "백로그",
    Todo: "할 일",
    "In Progress": "진행 중",
    "In Review": "리뷰 중",
    Done: "완료",
    Closed: "닫힘",
    Canceled: "취소됨",
  };

  return displayNames[status];
}

/**
 * Get status description
 */
export function getStatusDescription(status: IssueStatus): string {
  const descriptions: Record<IssueStatus, string> = {
    Triage: "이슈를 분류하고 우선순위를 정하는 단계",
    Backlog: "진행 예정인 이슈 (아직 할 일로 할당되지 않음)",
    Todo: "진행해야 할 이슈",
    "In Progress": "현재 작업 중인 이슈",
    "In Review": "리뷰 중인 이슈",
    Done: "작업이 완료된 이슈 (검토 또는 닫기 대기)",
    Closed: "닫힌 이슈 (더 이상 작업 없음)",
    Canceled: "취소된 이슈 (진행되지 않음)",
  };

  return descriptions[status];
}

/**
 * Get status badge color for UI
 */
export function getStatusBadgeColor(status: IssueStatus): string {
  const colors: Record<IssueStatus, string> = {
    Triage: "bg-gray-100 text-gray-800 border-gray-200",
    Backlog: "bg-purple-100 text-purple-800 border-purple-200",
    Todo: "bg-blue-100 text-blue-800 border-blue-200",
    "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "In Review": "bg-orange-100 text-orange-800 border-orange-200",
    Done: "bg-green-100 text-green-800 border-green-200",
    Closed: "bg-gray-800 text-white border-gray-900",
    Canceled: "bg-red-50 text-red-700 border-red-200",
  };

  return colors[status];
}

/**
 * Check if status is a terminal state (no further transitions)
 */
export function isTerminalStatus(status: IssueStatus): boolean {
  return getValidNextStatuses(status).length === 0;
}

/**
 * Check if status is active (being worked on)
 */
export function isActiveStatus(status: IssueStatus): boolean {
  return ["Todo", "In Progress", "In Review"].includes(status);
}

/**
 * Check if status is completed (but may need closing)
 */
export function isCompletedStatus(status: IssueStatus): boolean {
  return ["Done", "Closed", "Canceled"].includes(status);
}

/**
 * Get the recommended next status for workflow
 */
export function getRecommendedNextStatus(
  currentStatus: IssueStatus
): IssueStatus | null {
  const recommendations: Partial<Record<IssueStatus, IssueStatus>> = {
    Triage: "Todo",
    Backlog: "Todo",
    Todo: "In Progress",
    "In Progress": "In Review",
    "In Review": "Done",
    Done: "Closed",
  };

  return recommendations[currentStatus] ?? null;
}
