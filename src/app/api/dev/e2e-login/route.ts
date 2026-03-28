import { createHash } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { syncAuthenticatedProfile } from "@/lib/supabase/server-auth";
import {
  type AppSupabaseServerClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server-client";
import type { Database } from "@/lib/supabase/types";

const DEFAULT_EMAIL = "e2e@example.com";
const DEFAULT_PASSWORD = "codex-e2e-password";

function isDevLoginEnabled() {
  return process.env.NODE_ENV !== "production";
}

function buildProjectKey(userId: string) {
  return `E2E${userId.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function buildFallbackEmail(seed: string) {
  return `e2e+${seed}@example.com`;
}

async function signInWithPassword(
  request: NextRequest,
  response: NextResponse,
  email: string,
  password: string
) {
  const { anonKey, url } = getSupabasePublicEnv();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        for (const { name, options, value } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

async function ensureUser(
  request: NextRequest,
  response: NextResponse,
  serviceRole: AppSupabaseServerClient,
  requestedEmail: string,
  password: string
) {
  let email = requestedEmail;
  let signInResult = await signInWithPassword(
    request,
    response,
    email,
    password
  );

  if (!signInResult.error && signInResult.data.user) {
    await syncAuthenticatedProfile(serviceRole, signInResult.data.user);
    return {
      email,
      user: signInResult.data.user,
    };
  }

  const createInitialResult = await serviceRole.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      name: "Codex E2E User",
    },
  });

  if (!createInitialResult.error && createInitialResult.data.user) {
    await syncAuthenticatedProfile(serviceRole, createInitialResult.data.user);
    signInResult = await signInWithPassword(request, response, email, password);
  }

  if (!signInResult.error && signInResult.data.user) {
    return {
      email,
      user: signInResult.data.user,
    };
  }

  email = buildFallbackEmail(
    createHash("sha1").update(Date.now().toString()).digest("hex").slice(0, 10)
  );

  const fallbackCreateResult = await serviceRole.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      name: "Codex E2E User",
    },
  });

  if (fallbackCreateResult.error || !fallbackCreateResult.data.user) {
    throw new Error(
      fallbackCreateResult.error?.message ?? "Failed to create E2E user."
    );
  }

  await syncAuthenticatedProfile(serviceRole, fallbackCreateResult.data.user);

  signInResult = await signInWithPassword(request, response, email, password);

  if (signInResult.error || !signInResult.data.user) {
    throw new Error(signInResult.error?.message ?? "Failed to create session.");
  }

  return {
    email,
    user: signInResult.data.user,
  };
}

async function ensureFixtureProject(
  serviceRole: AppSupabaseServerClient,
  userId: string
) {
  const projectKey = buildProjectKey(userId);

  const { data: existingProject, error: projectLookupError } = await serviceRole
    .from("projects")
    .select("id, key")
    .eq("key", projectKey)
    .maybeSingle();

  if (projectLookupError) {
    throw new Error(projectLookupError.message);
  }

  if (existingProject) {
    await serviceRole.from("project_members").upsert(
      {
        project_id: existingProject.id,
        role: "owner",
        user_id: userId,
      },
      {
        onConflict: "project_id,user_id",
      }
    );

    return existingProject;
  }

  const { data: createdProject, error: createProjectError } = await serviceRole
    .from("projects")
    .insert({
      created_by: userId,
      key: projectKey,
      name: "Codex E2E Smoke",
      type: "personal",
    })
    .select("id, key")
    .single();

  if (createProjectError || !createdProject) {
    throw new Error(createProjectError?.message ?? "Failed to create project.");
  }

  const { error: membershipError } = await serviceRole
    .from("project_members")
    .upsert(
      {
        project_id: createdProject.id,
        role: "owner",
        user_id: userId,
      },
      {
        onConflict: "project_id,user_id",
      }
    );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  return createdProject;
}

async function ensureFixtureIssue(
  serviceRole: AppSupabaseServerClient,
  projectId: string,
  userId: string
) {
  const { data: existingIssue, error: issueLookupError } = await serviceRole
    .from("issues")
    .select("id")
    .eq("project_id", projectId)
    .eq("issue_number", 1)
    .maybeSingle();

  if (issueLookupError) {
    throw new Error(issueLookupError.message);
  }

  if (existingIssue) {
    return existingIssue;
  }

  const { data: createdIssue, error: createIssueError } = await serviceRole
    .from("issues")
    .insert({
      created_by: userId,
      description: "<p>Codex E2E smoke issue.</p>",
      priority: "Medium",
      project_id: projectId,
      status: "Todo",
      title: "Codex E2E smoke issue",
      updated_by: userId,
    })
    .select("id")
    .single();

  if (createIssueError || !createdIssue) {
    throw new Error(createIssueError?.message ?? "Failed to create issue.");
  }

  return createdIssue;
}

export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  const serviceRole = createServiceRoleSupabaseClient();
  const requestedEmail =
    request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ||
    DEFAULT_EMAIL;
  const password =
    request.nextUrl.searchParams.get("password")?.trim() || DEFAULT_PASSWORD;

  try {
    const { user } = await ensureUser(
      request,
      response,
      serviceRole,
      requestedEmail,
      password
    );
    const project = await ensureFixtureProject(serviceRole, user.id);
    const issue = await ensureFixtureIssue(serviceRole, project.id, user.id);

    const next =
      request.nextUrl.searchParams.get("next") ||
      `/projects/${project.id}?issueId=${issue.id}`;

    const redirectResponse = NextResponse.redirect(new URL(next, request.url));

    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }

    return redirectResponse;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare E2E login.",
      },
      { status: 500 }
    );
  }
}
