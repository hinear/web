"use client";

import { AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IssueDetailDrawerWithRouter } from "@/features/issues/components/issue-drawer-with-router";
import type { ActivityLogEntry, Issue } from "@/features/issues/types";

interface ModalData {
  activityLog: ActivityLogEntry[];
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

    async function loadModalData() {
      setIsLoading(true);
      try {
        // Use existing API route
        const response = await fetch(
          `/api/issues/${issueId}?projectId=${projectId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load issue");
        }

        const data = await response.json();

        setModalData({
          activityLog: data.activityLog || [],
          assigneeOptions: [
            { label: "Unassigned", value: "" },
            ...(data.assigneeOptions || []),
          ],
          issue: data.issue,
          memberNamesById: data.memberNamesById || {},
          projectId,
          issueId,
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

  const handleClose = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <AnimatePresence initial={false} mode="sync">
      {modalData && !isLoading && (
        <IssueDetailDrawerWithRouter
          key={modalData.issueId}
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
