import "server-only";

/**
 * Presenter: 푸시 구독 응답 포맷팅
 */
export const PushSubscriptionPresenter = {
  presentSuccess(): Response {
    return Response.json({ success: true, message: "Subscribed successfully" });
  },

  presentAuthRequired(): Response {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  },

  presentError(error: Error & { code?: string }): Response {
    const message = error.message || "Failed to subscribe";

    return Response.json({ success: false, error: message }, { status: 500 });
  },

  presentValidationError(message: string): Response {
    return Response.json({ success: false, error: message }, { status: 400 });
  },
};
