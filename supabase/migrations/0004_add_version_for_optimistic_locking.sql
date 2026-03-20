alter table public.issues
add column if not exists version integer not null default 1;

create index if not exists issues_version_idx
  on public.issues (id, version);
