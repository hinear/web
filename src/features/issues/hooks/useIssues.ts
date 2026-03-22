"use client";

import { useEffect, useState } from "react";

import {
  getMutationErrorCode,
  getMutationErrorFallbackMessage,
  getMutationErrorMessage,
} from "@/features/issues/lib/mutation-error-messages";
import type { Issue } from "@/specs/issue-detail.contract";

type IssueUpdateInput = Partial<
  Pick<Issue, "description" | "priority" | "status" | "title">
> & {
  assigneeId?: string | null;
};

function getIssueListPayload(value: unknown): Issue[] {
  if (
    value &&
    typeof value === "object" &&
    "issues" in value &&
    Array.isArray((value as { issues?: unknown }).issues)
  ) {
    return (value as { issues: Issue[] }).issues;
  }

  return [];
}

function getUpdatedIssuePayload(value: unknown): Issue | null {
  if (value && typeof value === "object" && "issue" in value) {
    return (value as { issue: Issue }).issue;
  }

  return null;
}

export function useIssues(projectId: string) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mutationError, setMutationError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/internal/projects/${projectId}/issues`);
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getMutationErrorMessage({
              actionLabel: "board",
              code: getMutationErrorCode(payload),
              fallbackMessage: getMutationErrorFallbackMessage(payload),
              status: response.status,
            })
          );
        }

        setIssues(getIssueListPayload(payload));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    }

    fetchIssues();
  }, [projectId]);

  const updateIssue = async (issueId: string, updates: IssueUpdateInput) => {
    try {
      setMutationError(null);
      const response = await fetch(`/internal/issues/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getMutationErrorMessage({
            actionLabel: "board",
            code: getMutationErrorCode(payload),
            fallbackMessage: getMutationErrorFallbackMessage(payload),
            status: response.status,
          })
        );
      }

      const updatedIssue = getUpdatedIssuePayload(payload);

      if (updatedIssue) {
        setIssues((prev) =>
          prev.map((issue) => (issue.id === issueId ? updatedIssue : issue))
        );
      }

      return updatedIssue ?? undefined;
    } catch (err) {
      setMutationError(err instanceof Error ? err : new Error("Unknown error"));
      throw err;
    }
  };

  return { issues, loading, error, mutationError, updateIssue };
}
