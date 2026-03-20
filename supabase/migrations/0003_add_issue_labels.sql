create table public.labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  name_key text not null check (char_length(trim(name_key)) > 0),
  color text not null default '#6B7280' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, name_key)
);

create index labels_project_name_idx
  on public.labels (project_id, name);

create index labels_created_by_idx
  on public.labels (created_by);

create table public.issue_labels (
  issue_id uuid not null,
  project_id uuid not null,
  label_id uuid not null references public.labels (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (issue_id, label_id),
  foreign key (issue_id, project_id) references public.issues (id, project_id) on delete cascade,
  foreign key (project_id) references public.projects (id) on delete cascade
);

create index issue_labels_project_idx
  on public.issue_labels (project_id);

create index issue_labels_label_idx
  on public.issue_labels (label_id);

alter table public.labels enable row level security;
alter table public.issue_labels enable row level security;

create policy "labels_select_for_members"
  on public.labels
  for select
  using (public.is_project_member(project_id));

create policy "labels_insert_for_members"
  on public.labels
  for insert
  with check (
    public.is_project_member(project_id)
    and created_by = (select auth.uid())
  );

create policy "issue_labels_select_for_members"
  on public.issue_labels
  for select
  using (public.is_project_member(project_id));

create policy "issue_labels_insert_for_members"
  on public.issue_labels
  for insert
  with check (public.is_project_member(project_id));

create policy "issue_labels_delete_for_members"
  on public.issue_labels
  for delete
  using (public.is_project_member(project_id));
