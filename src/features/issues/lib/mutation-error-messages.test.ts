import { describe, expect, it } from "vitest";

import {
  getMutationErrorCode,
  getMutationErrorFallbackMessage,
  getMutationErrorMessage,
  getMutationErrorStatus,
  inferMutationErrorCode,
} from "@/features/issues/lib/mutation-error-messages";
import { createRepositoryError } from "@/features/issues/lib/repository-errors";

describe("mutation-error-messages", () => {
  it("maps auth failures to a session-expired message", () => {
    expect(
      getMutationErrorMessage({
        actionLabel: "issue",
        code: "AUTH_REQUIRED",
        status: 401,
      })
    ).toBe("Your session expired. Sign in again and retry.");

    expect(
      getMutationErrorMessage({
        actionLabel: "board",
        code: "AUTH_REQUIRED",
        status: 401,
      })
    ).toBe("Your session expired. Sign in again, then refresh the board.");
  });

  it("maps validation failures to field-specific messages", () => {
    expect(
      getMutationErrorMessage({
        actionLabel: "issue",
        code: "INVALID_TITLE",
        status: 422,
      })
    ).toBe("Enter a title before saving.");

    expect(
      getMutationErrorMessage({
        actionLabel: "comment",
        code: "INVALID_COMMENT_BODY",
        status: 422,
      })
    ).toBe("Enter a comment before posting.");
  });

  it("maps not-found and forbidden failures to actionable messages", () => {
    expect(
      getMutationErrorMessage({
        actionLabel: "issue",
        code: "ISSUE_NOT_FOUND",
        status: 404,
      })
    ).toBe(
      "This issue no longer exists. Return to the board and refresh your list."
    );

    expect(
      getMutationErrorMessage({
        actionLabel: "issue",
        code: "FORBIDDEN",
        status: 403,
      })
    ).toBe(
      "You no longer have access to this issue. Return to the board and refresh."
    );

    expect(
      getMutationErrorMessage({
        actionLabel: "board",
        code: "ISSUE_NOT_FOUND",
        status: 404,
      })
    ).toBe(
      "This issue no longer exists. Refresh the board to load the latest list."
    );
  });

  it("extracts code and fallback messages from error payloads", () => {
    expect(
      getMutationErrorCode({
        code: "INVALID_TITLE",
        error: "Issue title is required.",
      })
    ).toBe("INVALID_TITLE");
    expect(
      getMutationErrorFallbackMessage({
        code: "INVALID_TITLE",
        error: "Issue title is required.",
      })
    ).toBe("Issue title is required.");
  });

  it("infers repository permission and not-found failures", () => {
    expect(
      inferMutationErrorCode(
        createRepositoryError(
          "FORBIDDEN",
          "Failed to update issue: new row violates row-level security policy"
        )
      )
    ).toBe("FORBIDDEN");
    expect(
      inferMutationErrorCode(
        createRepositoryError("ISSUE_NOT_FOUND", "Issue not found.")
      )
    ).toBe("ISSUE_NOT_FOUND");
    expect(
      inferMutationErrorCode(
        new Error(
          "Failed to update issue: new row violates row-level security policy"
        )
      )
    ).toBe("FORBIDDEN");
    expect(inferMutationErrorCode(new Error("Issue not found."))).toBe(
      "ISSUE_NOT_FOUND"
    );
    expect(getMutationErrorStatus("FORBIDDEN")).toBe(403);
  });
});
