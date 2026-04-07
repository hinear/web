import type { CollisionDetection } from "@dnd-kit/core";
import { pointerWithin } from "@dnd-kit/core";

import type { IssueStatus } from "@/specs/issue-detail.contract";

/** Kanban column statuses. Does not include "Closed" since closed issues are not shown on the board. */
const COLUMNS: IssueStatus[] = [
  "Triage",
  "Backlog",
  "Todo",
  "In Progress",
  "Done",
  "Canceled",
];

export { COLUMNS };

export function mergeIssuesPreservingOrder<T extends { id: string }>(
  previous: T[],
  next: T[]
): T[] {
  const nextById = new Map(next.map((issue) => [issue.id, issue]));
  const ordered = previous
    .map((issue) => nextById.get(issue.id))
    .filter((issue): issue is T => Boolean(issue));
  const seen = new Set(ordered.map((issue) => issue.id));

  for (const issue of next) {
    if (!seen.has(issue.id)) {
      ordered.push(issue);
    }
  }

  return ordered;
}

export function isColumnId(id: string): id is IssueStatus {
  return COLUMNS.includes(id as IssueStatus);
}

export const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  return pointerCollisions.filter((collision) => {
    const { id } = collision;
    return isColumnId(id as string);
  });
};
