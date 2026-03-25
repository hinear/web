-- Add GitHub integration fields to issues table
ALTER TABLE public.issues
  ADD COLUMN github_issue_id INTEGER,
  ADD COLUMN github_issue_number INTEGER,
  ADD COLUMN github_synced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN github_sync_status TEXT DEFAULT 'pending' CHECK (github_sync_status IN ('pending', 'synced', 'error'));

-- Add index for GitHub-enabled issues
CREATE INDEX issues_github_sync_status_idx
  ON public.issues (github_sync_status)
  WHERE github_issue_id IS NOT NULL;

-- Add index for GitHub issue lookups
CREATE INDEX issues_github_issue_id_idx
  ON public.issues (github_issue_id, github_issue_number)
  WHERE github_issue_id IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN public.issues.github_issue_id IS 'GitHub Issue internal ID';
COMMENT ON COLUMN public.issues.github_issue_number IS 'GitHub Issue number (displayed in UI)';
COMMENT ON COLUMN public.issues.github_synced_at IS 'Last successful sync timestamp with GitHub';
COMMENT ON COLUMN public.issues.github_sync_status IS 'Current sync status: pending, synced, or error';
