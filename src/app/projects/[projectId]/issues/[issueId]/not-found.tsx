"use client";

import { useParams } from "next/navigation";

import { IssueDetailNotFoundScreen } from "@/features/issues/components/issue-detail-screen";
import {
  getProjectIssueCreatePath,
  getProjectPath,
} from "@/features/projects/lib/paths";

export default function IssueDetailNotFoundPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const boardHref = projectId ? getProjectPath(projectId) : "/";

  return (
    <IssueDetailNotFoundScreen
      boardHref={boardHref}
      createHref={projectId ? getProjectIssueCreatePath(projectId) : undefined}
    />
  );
}
