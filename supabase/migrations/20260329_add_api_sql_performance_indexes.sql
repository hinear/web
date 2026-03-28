-- Feature: 009-api-sql-performance
-- Purpose: align indexes with current API pagination, search, and filter patterns

-- Project list pagination reads memberships by user and sorts through joined projects.
-- This composite index reduces the member lookup and improves join locality.
create index if not exists project_members_user_project_idx
  on public.project_members (user_id, project_id);

-- Cursor pagination and filtered issue lists sort by created_at then id.
create index if not exists issues_project_created_id_idx
  on public.issues (project_id, created_at asc, id asc);

-- Status-filtered issue cursor pages use the same ordering.
create index if not exists issues_project_status_created_id_idx
  on public.issues (project_id, status, created_at asc, id asc);

-- Priority-filtered lists benefit from a matching composite index.
create index if not exists issues_project_priority_created_id_idx
  on public.issues (project_id, priority, created_at asc, id asc);

-- Assignee filters are always scoped by project in application queries.
create index if not exists issues_project_assignee_created_id_idx
  on public.issues (project_id, assignee_id, created_at asc, id asc)
  where assignee_id is not null;

-- Label resolution always looks up labels within a project by issue_id.
create index if not exists issue_labels_project_issue_idx
  on public.issue_labels (project_id, issue_id);

-- Text search currently uses ilike on title/description.
-- A trigram GIN index is the lowest-effort win before introducing full-text search.
create extension if not exists pg_trgm;

create index if not exists issues_title_description_trgm_idx
  on public.issues
  using gin ((coalesce(title, '') || ' ' || coalesce(description, '')) gin_trgm_ops);

analyze public.project_members;
analyze public.issues;
analyze public.issue_labels;
