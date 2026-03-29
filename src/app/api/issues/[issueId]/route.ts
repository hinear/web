import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/app/api/_lib/response";
import { loadIssueDrawerDetail } from "@/features/issues/lib/issue-drawer-loader";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return apiError("projectId is required", 400);
    }

    const data = await loadIssueDrawerDetail(projectId, issueId);

    return apiSuccess(data);
  } catch (error) {
    console.error("Error loading issue:", error);
    return apiError("Failed to load issue", 500);
  }
}
