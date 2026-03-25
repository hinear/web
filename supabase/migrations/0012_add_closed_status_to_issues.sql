-- Add 'Closed' status to issues
-- This allows issues to be properly closed after being completed

-- Drop the existing check constraint
alter table public.issues
  drop constraint if exists issues_status_check;

-- Add new check constraint with 'Closed' status
alter table public.issues
  add constraint issues_status_check
  check (status in ('Triage', 'Backlog', 'Todo', 'In Progress', 'Done', 'Closed'));

-- Add comment to document the status values
comment on column public.issues.status is
'Issue status: Triage (분류 대기) → Backlog (백로그) → Todo (할 일) → In Progress (진행 중) → Done (완료) → Closed (닫힘)';
