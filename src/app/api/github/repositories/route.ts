import { type NextRequest, NextResponse } from "next/server";
import { GitHubApiClient } from "@/lib/github/api-client";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";

export async function GET(request: NextRequest) {
  await requireAuthenticatedActorId();

  const token = request.cookies.get("github_token_temp")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "GitHub authentication required" },
      { status: 401 }
    );
  }

  try {
    const githubClient = new GitHubApiClient(token);
    const repos = await githubClient.listUserRepositories();

    const repositories = repos.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
    }));

    return NextResponse.json({ success: true, repositories });
  } catch (error) {
    console.error("Failed to load repositories:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load repositories",
      },
      { status: 500 }
    );
  }
}
