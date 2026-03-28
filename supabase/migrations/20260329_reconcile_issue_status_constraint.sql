-- Reconcile issue status constraint so both historical terminal states remain valid.
-- This is needed because some environments applied the canceled-status change outside
-- of the checked-in migration sequence, while others still need Closed support.

alter table public.issues
  drop constraint if exists issues_status_check;

alter table public.issues
  add constraint issues_status_check
  check (
    status in (
      'Triage',
      'Backlog',
      'Todo',
      'In Progress',
      'Done',
      'Canceled',
      'Closed'
    )
  );

comment on column public.issues.status is
'Issue status: Triage (분류 대기) -> Backlog (백로그) -> Todo (할 일) -> In Progress (진행 중) -> Done (완료) -> Canceled (취소) -> Closed (닫힘)';
