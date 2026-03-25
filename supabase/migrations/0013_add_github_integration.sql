-- Add GitHub integration fields to projects table
ALTER TABLE public.projects
  ADD COLUMN github_repo_owner TEXT,
  ADD COLUMN github_repo_name TEXT,
  ADD COLUMN github_integration_enabled BOOLEAN DEFAULT false;

-- Add index for GitHub-enabled projects
CREATE INDEX projects_github_enabled_idx
  ON public.projects (id)
  WHERE github_integration_enabled = true;

-- Comments for documentation
COMMENT ON COLUMN public.projects.github_repo_owner IS 'GitHub repository owner (username or organization)';
COMMENT ON COLUMN public.projects.github_repo_name IS 'GitHub repository name';
COMMENT ON COLUMN public.projects.github_integration_enabled IS 'Whether GitHub integration is active for this project';
