import "server-only";

import type { IssueDetailData } from "../containers/load-issue-detail-container";

/**
 * Presenter: 이슈 상세 응답 포맷팅
 */
export const IssueDetailPresenter = {
  presentSuccess(data: IssueDetailData): Response {
    return Response.json(data.issue);
  },

  presentAuthRequired(): Response {
    return Response.json(
      {
        code: "AUTH_REQUIRED",
        error: "Authentication required.",
      },
      { status: 401 }
    );
  },

  presentError(error: Error & { code?: string }): Response {
    const code = error.code || "UNKNOWN";
    const message = error.message || "Failed to load issue detail.";

    const status = getErrorStatus(code);

    return Response.json(
      {
        code,
        error: message,
      },
      { status }
    );
  },
};

function getErrorStatus(code: string): number {
  const statusMap: Record<string, number> = {
    AUTH_REQUIRED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
  };

  return statusMap[code] || 500;
}
