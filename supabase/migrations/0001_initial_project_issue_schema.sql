create extension if not exists pgcrypto;

create type public.project_type as enum ('personal', 'team');
create type public.project_member_role as enum ('owner', 'member');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[A-Z][A-Z0-9]+$'),
  name text not null check (char_length(trim(name)) > 0),
  type public.project_type not null,
  issue_seq integer not null default 0 check (issue_seq >= 0),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.project_member_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create unique index project_members_owner_once_idx
  on public.project_members (project_id)
  where role = 'owner';

create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role public.project_member_role not null default 'member' check (role = 'member'),
  invited_by uuid not null references auth.users (id) on delete cascade,
  status public.invitation_status not null default 'pending',
  token text not null unique,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index project_invitations_pending_email_idx
  on public.project_invitations (project_id, lower(email))
  where status = 'pending';

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  issue_number integer not null,
  identifier text not null,
  title text not null check (char_length(trim(title)) > 0),
  status text not null default 'Triage' check (status in ('Triage', 'Backlog', 'Todo', 'In Progress', 'Done')),
  priority text not null default 'No Priority' check (priority in ('No Priority', 'Low', 'Medium', 'High', 'Urgent')),
  assignee_id uuid references auth.users (id) on delete set null,
  description text not null default '',
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, project_id),
  unique (project_id, issue_number),
  unique (project_id, identifier)
);

create index issues_project_created_at_idx
  on public.issues (project_id, created_at desc);

create index issues_project_status_idx
  on public.issues (project_id, status);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null,
  project_id uuid not null,
  author_id uuid not null references auth.users (id) on delete restrict,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (issue_id, project_id) references public.issues (id, project_id) on delete cascade,
  foreign key (project_id) references public.projects (id) on delete cascade
);

create index comments_issue_created_at_idx
  on public.comments (issue_id, created_at asc);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null,
  project_id uuid not null,
  actor_id uuid not null references auth.users (id) on delete restrict,
  type text not null,
  field text,
  from_value jsonb,
  to_value jsonb,
  summary text not null,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (issue_id, project_id) references public.issues (id, project_id) on delete cascade,
  foreign key (project_id) references public.projects (id) on delete cascade
);

create index activity_logs_issue_created_at_idx
  on public.activity_logs (issue_id, created_at desc);

create or replace function public.assign_issue_identifier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_key text;
  next_issue_number integer;
begin
  update public.projects
  set issue_seq = issue_seq + 1,
      updated_at = timezone('utc', now())
  where id = new.project_id
  returning key, issue_seq into project_key, next_issue_number;

  if project_key is null then
    raise exception 'Project % not found while assigning identifier', new.project_id;
  end if;

  new.issue_number := next_issue_number;
  new.identifier := format('%s-%s', project_key, next_issue_number);

  return new;
end;
$$;

create trigger projects_touch_updated_at
before update on public.projects
for each row
execute function public.touch_updated_at();

create trigger issues_touch_updated_at
before update on public.issues
for each row
execute function public.touch_updated_at();

create trigger issues_assign_identifier
before insert on public.issues
for each row
execute function public.assign_issue_identifier();

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members project_member
    where project_member.project_id = target_project_id
      and project_member.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members project_member
    where project_member.project_id = target_project_id
      and project_member.user_id = auth.uid()
      and project_member.role = 'owner'
  );
$$;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invitations enable row level security;
alter table public.issues enable row level security;
alter table public.comments enable row level security;
alter table public.activity_logs enable row level security;

create policy "projects_select_for_members"
  on public.projects
  for select
  using (created_by = auth.uid() or public.is_project_member(id));

create policy "projects_insert_for_creator"
  on public.projects
  for insert
  with check (created_by = auth.uid());

create policy "projects_update_for_owner"
  on public.projects
  for update
  using (created_by = auth.uid() or public.is_project_owner(id))
  with check (created_by = auth.uid() or public.is_project_owner(id));

create policy "project_members_select_for_members"
  on public.project_members
  for select
  using (public.is_project_member(project_id));

create policy "project_members_insert_for_owner"
  on public.project_members
  for insert
  with check (
    (
      exists (
        select 1
        from public.projects project
        where project.id = project_id
          and project.created_by = auth.uid()
      )
      and user_id = auth.uid()
      and role = 'owner'
    )
    or public.is_project_owner(project_id)
  );

create policy "project_members_delete_for_owner"
  on public.project_members
  for delete
  using (public.is_project_owner(project_id));

create policy "project_invitations_select_for_owner"
  on public.project_invitations
  for select
  using (public.is_project_owner(project_id));

create policy "project_invitations_insert_for_owner"
  on public.project_invitations
  for insert
  with check (public.is_project_owner(project_id));

create policy "project_invitations_update_for_owner"
  on public.project_invitations
  for update
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

create policy "issues_select_for_members"
  on public.issues
  for select
  using (public.is_project_member(project_id));

create policy "issues_insert_for_members"
  on public.issues
  for insert
  with check (public.is_project_member(project_id));

create policy "issues_update_for_members"
  on public.issues
  for update
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "comments_select_for_members"
  on public.comments
  for select
  using (public.is_project_member(project_id));

create policy "comments_insert_for_members"
  on public.comments
  for insert
  with check (public.is_project_member(project_id));

create policy "activity_logs_select_for_members"
  on public.activity_logs
  for select
  using (public.is_project_member(project_id));

create policy "activity_logs_insert_for_members"
  on public.activity_logs
  for insert
  with check (public.is_project_member(project_id));
