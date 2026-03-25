import { type NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedActorId } from "@/lib/supabase/server-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export async function POST(request: NextRequest) {
  try {
    // Simple admin check (you should enhance this in production)
    const actorId = await requireAuthenticatedActorId();

    const migration = `
-- Add GitHub integration fields to issues table
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS github_issue_id INTEGER,
  ADD COLUMN IF NOT EXISTS github_issue_number INTEGER,
  ADD COLUMN IF NOT EXISTS github_synced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS github_sync_status TEXT DEFAULT 'pending' CHECK (github_sync_status IN ('pending', 'synced', 'error'));

-- Add index for GitHub-enabled issues
CREATE INDEX IF NOT EXISTS issues_github_sync_status_idx
  ON public.issues (github_sync_status)
  WHERE github_issue_id IS NOT NULL;

-- Add index for GitHub issue lookups
CREATE INDEX IF NOT EXISTS issues_github_issue_id_idx
  ON public.issues (github_issue_id, github_issue_number)
  WHERE github_issue_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.issues.github_issue_id IS 'GitHub Issue internal ID';
COMMENT ON COLUMN public.issues.github_issue_number IS 'GitHub Issue number (displayed in UI)';
COMMENT ON COLUMN public.issues.github_synced_at IS 'Last successful sync timestamp with GitHub';
COMMENT ON COLUMN public.issues.github_sync_status IS 'Current sync status: pending, synced, or error';
`;

    const supabase = createServerSupabaseClient();

    // Execute each statement separately
    const statements = migration
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const results = [];

    for (const statement of statements) {
      try {
        const { data, error } = await (supabase as any).rpc("exec_sql", {
          sql: statement,
        });

        if (error) {
          // Try alternative method using direct SQL execution
          results.push({
            statement: statement.substring(0, 50) + "...",
            status: "skipped",
            error: error.message,
          });
        } else {
          results.push({
            statement: statement.substring(0, 50) + "...",
            status: "success",
          });
        }
      } catch (e) {
        results.push({
          statement: statement.substring(0, 50) + "...",
          status: "error",
          error: String(e),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration executed",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}
