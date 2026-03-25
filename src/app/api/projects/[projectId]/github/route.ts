import { type NextRequest, NextResponse } from "next/server";
import { GitHubIntegrationRepository } from "@/features/projects/repositories/github-integration-repository";
import { GitHubApiClient } from "@/lib/github/api-client";
import {
  createGitHubInstallationClientForRepository,
  isGitHubAppConfigured,
} from "@/lib/github/app-auth";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";
import { createRequestSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const actorId = await requireAuthenticatedActorId();
  const { projectId } = await params;
  const supabase = await createRequestSupabaseServerClient();

  // Check if user is project owner
  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", actorId)
    .single();

  if (!member || member.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        error: "Only project owners can manage GitHub integration",
      },
      { status: 403 }
    );
  }

  const repository = new GitHubIntegrationRepository(supabase);
  const settings = await repository.getGitHubIntegration(projectId);

  return NextResponse.json({ success: true, settings });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const actorId = await requireAuthenticatedActorId();
  const { projectId } = await params;
  const body = await request.json();
  const supabase = await createRequestSupabaseServerClient();

  // Check if user is project owner
  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", actorId)
    .single();

  if (!member || member.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        error: "Only project owners can manage GitHub integration",
      },
      { status: 403 }
    );
  }

  // Get GitHub token from temporary cookie
  const token = request.cookies.get("github_token_temp")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "GitHub authentication required" },
      { status: 401 }
    );
  }

  const { repoOwner, repoName } = body;

  if (!repoOwner || !repoName) {
    return NextResponse.json(
      { success: false, error: "Repository owner and name are required" },
      { status: 400 }
    );
  }

  try {
    if (!isGitHubAppConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GitHub App credentials are not configured on the server (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY)",
        },
        { status: 500 }
      );
    }

    const githubClient = new GitHubApiClient(token);

    // Verify repository exists and user has access
    await githubClient.getRepository(repoOwner, repoName);
    // Also verify GitHub App installation has access to this repository.
    const appClient = await createGitHubInstallationClientForRepository(
      repoOwner,
      repoName
    );
    if (!appClient) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GitHub App credentials are not configured on the server (GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY)",
        },
        { status: 500 }
      );
    }
    await appClient.getRepository(repoOwner, repoName);

    // Update project settings
    const repository = new GitHubIntegrationRepository(supabase);
    await repository.updateGitHubIntegration({
      projectId,
      enabled: true,
      repoOwner,
      repoName,
    });

    // Clear temporary cookies
    const response = NextResponse.json({
      success: true,
      settings: {
        enabled: true,
        repoOwner,
        repoName,
        connected: true,
      },
    });

    response.cookies.delete("github_token_temp");
    response.cookies.delete("github_project_temp");

    return response;
  } catch (error) {
    console.error("GitHub integration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect repository",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const actorId = await requireAuthenticatedActorId();
  const { projectId } = await params;
  const supabase = await createRequestSupabaseServerClient();

  // Check if user is project owner
  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", actorId)
    .single();

  if (!member || member.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        error: "Only project owners can manage GitHub integration",
      },
      { status: 403 }
    );
  }

  try {
    const repository = new GitHubIntegrationRepository(supabase);
    await repository.disconnectGitHubIntegration(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect GitHub integration:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to disconnect repository",
      },
      { status: 500 }
    );
  }
}
