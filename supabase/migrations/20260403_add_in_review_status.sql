-- Add "In Review" status to issues status constraint
alter table issues drop constraint issues_status_check;
alter table issues add constraint issues_status_check
  check (
    status in (
      'Triage',
      'Backlog',
      'Todo',
      'In Progress',
      'In Review',
      'Done',
      'Closed',
      'Canceled'
    )
  );
