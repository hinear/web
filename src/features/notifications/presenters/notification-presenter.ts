import "server-only";

/**
 * Presenter: 알림 응답 포맷팅
 */
export const NotificationPresenter = {
  presentSuccess(data: { sent: number; failed: number }): Response {
    return Response.json({
      success: true,
      sent: data.sent,
      failed: data.failed,
    });
  },

  presentNoTargetUsers(): Response {
    return Response.json({
      success: true,
      sent: 0,
      failed: 0,
      message: "No target users",
    });
  },

  presentError(_error: Error): Response {
    return Response.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  },
};
