"use client";

import { useEffect, useState } from "react";
import type { Issue } from "@/specs/issue-detail.contract";

type IssueUpdateInput = Partial<
  Pick<Issue, "description" | "priority" | "status" | "title">
> & {
  assigneeId?: string | null;
};

export function useIssues(projectId: string) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/internal/projects/${projectId}/issues`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required.");
          }

          throw new Error(`Failed to fetch issues: ${response.statusText}`);
        }

        const data = await response.json();
        setIssues(data.issues || []);
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
      const response = await fetch(`/internal/issues/${issueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required.");
        }

        throw new Error(`Failed to update issue: ${response.statusText}`);
      }

      const data = await response.json();
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? data.issue : issue))
      );

      return data.issue;
    } catch (err) {
      console.error("Error updating issue:", err);
      throw err;
    }
  };

  return { issues, loading, error, updateIssue };
}
