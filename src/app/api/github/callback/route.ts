import { type NextRequest, NextResponse } from "next/server";

/**
 * GitHub OAuth Callback 핸들러
 * GitHub에서 code를 받아서 access token으로 교환
 */
export async function GET(request: NextRequest) {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, APP_ORIGIN } = process.env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return NextResponse.json(
      { success: false, error: "GitHub credentials not configured" },
      { status: 500 }
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  // CSRF 검증: state 확인
  const storedState = request.cookies.get("github_oauth_state")?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/auth?error=github_oauth_failed", APP_ORIGIN || request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth?error=github_oauth_no_code", APP_ORIGIN || request.url)
    );
  }

  try {
    // GitHub에 access token 요청
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      throw new Error("Failed to exchange code for access token");
    }

    // state에서 projectId 추출
    const projectId = state.split(":")[1] || "";

    // access token을 쿠키에 임시 저장
    const response = NextResponse.redirect(
      new URL(
        `/projects/${projectId}/settings?github=select-repo`,
        APP_ORIGIN || request.url
      )
    );

    response.cookies.set("github_token_temp", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    // state 쿠키 삭제
    response.cookies.delete("github_oauth_state");

    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/auth?error=github_oauth_error", APP_ORIGIN || request.url)
    );
  }
}
