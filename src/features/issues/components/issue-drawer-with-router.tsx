"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { IssueDetailDrawerScreen } from "@/features/issues/components/issue-drawer-screen";
import type { ActivityLogEntry, Issue } from "@/features/issues/types";

interface IssueDetailDrawerWithRouterProps {
  activityLog?: ActivityLogEntry[];
  assigneeOptions: Array<{
    label: string;
    value: string;
  }>;
  boardHref: string;
  fullPageHref: string;
  issue: Issue;
  memberNamesById?: Record<string, string>;
}

export function IssueDetailDrawerWithRouter({
  activityLog,
  assigneeOptions,
  boardHref,
  fullPageHref,
  issue,
  memberNamesById,
}: IssueDetailDrawerWithRouterProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push(boardHref);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop overlay */}
      <motion.button
        onClick={handleClose}
        className="absolute inset-0 cursor-default bg-[rgba(15,23,42,0.36)] backdrop-blur-sm"
        aria-label="Close drawer"
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Drawer container */}
      <motion.div
        className="relative ml-auto h-full w-full max-w-[688px]"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
      >
        <IssueDetailDrawerScreen
          activityLog={activityLog}
          assigneeOptions={assigneeOptions}
          boardHref={boardHref}
          fullPageHref={fullPageHref}
          issue={issue}
          memberNamesById={memberNamesById}
          onClose={handleClose}
        />
      </motion.div>
    </div>
  );
}
