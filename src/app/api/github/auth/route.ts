import { randomBytes } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GitHub OAuth Flow 시작
 * 앱 로그인 (Google 등)과 독립적으로 GitHub 연동을 위한 OAuth
 */
export async function GET(request: NextRequest) {
  const { GITHUB_CLIENT_ID, APP_ORIGIN } = process.env;

  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json(
      { success: false, error: "GitHub Client ID not configured" },
      { status: 500 }
    );
  }

  // CSRF 방지를 위한 state 생성
  const state = randomBytes(16).toString("hex");
  const projectId = request.nextUrl.searchParams.get("projectId") || "";

  // GitHub OAuth URL 생성
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${APP_ORIGIN}/api/github/callback`,
    scope: "repo admin:repo_hook",
    state: `${state}:${projectId}`,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  // state를 세션에 저장 (callback에서 검증용)
  const response = NextResponse.redirect(githubAuthUrl);
  response.cookies.set("github_oauth_state", `${state}:${projectId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
