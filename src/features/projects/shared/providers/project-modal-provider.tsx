"use client";

import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  fetchIssueDetail,
  getCachedIssueDetail,
} from "@/features/issues/lib/issue-detail-client-cache";
import { updateIssueDrawerUrl } from "@/features/issues/lib/issue-drawer-url";
import type { ActivityLogEntry, Issue, Label } from "@/features/issues/types";

function DrawerLoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.36)] backdrop-blur-sm" />
      <div className="relative ml-auto h-full w-full max-w-[688px]">
        <aside className="pointer-events-auto my-6 mr-6 flex h-[calc(100vh-48px)] w-full flex-col gap-4 overflow-hidden rounded-[16px] border border-[#E6E8EC] bg-white p-6 shadow-[0_0_60px_-12px_rgba(15,23,42,0.25)]">
          <div className="h-6 w-40 animate-pulse rounded bg-[#E6E8EC]" />
          <div className="h-12 w-full animate-pulse rounded-[12px] bg-[#F3F4F6]" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 animate-pulse rounded-[12px] bg-[#F8FAFC]" />
            <div className="h-20 animate-pulse rounded-[12px] bg-[#F8FAFC]" />
            <div className="h-20 animate-pulse rounded-[12px] bg-[#F8FAFC]" />
            <div className="h-20 animate-pulse rounded-[12px] bg-[#F8FAFC]" />
          </div>
          <div className="h-48 animate-pulse rounded-[16px] bg-[#F8FAFC]" />
          <div className="h-36 animate-pulse rounded-[16px] bg-[#F8FAFC]" />
        </aside>
      </div>
    </div>
  );
}

const IssueDetailDrawerWithRouter = dynamic(
  () =>
    import("@/features/issues/detail/screens/issue-drawer-with-router").then(
      (module) => ({
        default: module.IssueDetailDrawerWithRouter,
      })
    ),
  {
    loading: DrawerLoadingFallback,
    ssr: false,
  }
);

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const issueId = searchParams.get("issueId");
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const closeDrawer = useCallback(() => {
    updateIssueDrawerUrl(pathname, searchParams, null, "replace");
  }, [pathname, searchParams]);

  // Fetch issue data when issueId changes
  useEffect(() => {
    if (!issueId) {
      setIsLoading(false);
      setModalData(null);
      return;
    }

    let isActive = true;
    const currentIssueId = issueId;
    const cached = getCachedIssueDetail(projectId, currentIssueId);
    setIsLoading(!cached);
    void import("@/features/issues/detail/screens/issue-drawer-with-router");

    if (cached) {
      setModalData({
        activityLog: cached.activityLog,
        availableLabels: cached.availableLabels,
        assigneeOptions: [
          { label: "Unassigned", value: "" },
          ...cached.assigneeOptions,
        ],
        issue: cached.issue,
        memberNamesById: cached.memberNamesById,
        projectId,
        issueId: currentIssueId,
      });
    }

    async function loadModalData() {
      try {
        const data = await fetchIssueDetail(projectId, currentIssueId);

        if (!isActive) {
          return;
        }

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
        setIsLoading(false);
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error("Failed to load issue:", error);
        setIsLoading(false);
        closeDrawer();
      }
    }

    loadModalData();

    return () => {
      isActive = false;
    };
  }, [closeDrawer, issueId, projectId]);

  if (issueId && (isLoading || !modalData)) {
    return <DrawerLoadingFallback />;
  }

  return (
    modalData && (
      <IssueDetailDrawerWithRouter
        availableLabels={modalData.availableLabels}
        boardHref={`/projects/${projectId}`}
        fullPageHref={`/projects/${projectId}/issues/${modalData.issueId}?view=full`}
        activityLog={modalData.activityLog}
        assigneeOptions={modalData.assigneeOptions}
        issue={modalData.issue}
        memberNamesById={modalData.memberNamesById}
        onClose={closeDrawer}
      />
    )
  );
}
