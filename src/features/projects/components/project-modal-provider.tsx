"use client";

import { AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IssueDetailDrawerWithRouter } from "@/features/issues/components/issue-drawer-with-router";
import type { ActivityLogEntry, Issue, Label } from "@/features/issues/types";

interface ModalData {
  activityLog: ActivityLogEntry[];
  availableLabels: Label[];
  assigneeOptions: Array<{ label: string; value: string }>;
  issue: Issue;
  memberNamesById: Record<string, string>;
  projectId: string;
  issueId: string;
}

export function ProjectModalProvider({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const issueId = searchParams.get("issueId");
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch issue data when issueId changes
  useEffect(() => {
    if (!issueId) {
      setModalData(null);
      return;
    }

    const currentIssueId = issueId;

    async function loadModalData() {
      setIsLoading(true);
      try {
        // Use existing API route
        const response = await fetch(
          `/api/issues/${currentIssueId}?projectId=${projectId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load issue");
        }

        const data = await response.json();

        setModalData({
          activityLog: data.activityLog || [],
          availableLabels: data.availableLabels || [],
          assigneeOptions: [
            { label: "Unassigned", value: "" },
            ...(data.assigneeOptions || []),
          ],
          issue: data.issue,
          memberNamesById: data.memberNamesById || {},
          projectId,
          issueId: currentIssueId,
        });
      } catch (error) {
        console.error("Failed to load issue:", error);
        // Close modal on error
        router.push(`/projects/${projectId}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadModalData();
  }, [issueId, projectId, router]);

  return (
    <AnimatePresence initial={false} mode="sync">
      {modalData && !isLoading && (
        <IssueDetailDrawerWithRouter
          key={modalData.issueId}
          availableLabels={modalData.availableLabels}
          boardHref={`/projects/${projectId}`}
          fullPageHref={`/projects/${projectId}/issues/${modalData.issueId}?view=full`}
          activityLog={modalData.activityLog}
          assigneeOptions={modalData.assigneeOptions}
          issue={modalData.issue}
          memberNamesById={modalData.memberNamesById}
        />
      )}
    </AnimatePresence>
  );
}
