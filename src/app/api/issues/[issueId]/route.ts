import { type NextRequest, NextResponse } from "next/server";

import { loadIssueDetail } from "@/features/issues/lib/issue-detail-loader";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const data = await loadIssueDetail(
      projectId,
      issueId,
      `/projects/${projectId}?issueId=${issueId}`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading issue:", error);
    return NextResponse.json(
      { error: "Failed to load issue" },
      { status: 500 }
    );
  }
}
