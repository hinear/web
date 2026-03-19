create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop policy if exists "projects_select_for_members" on public.projects;
create policy "projects_select_for_members"
  on public.projects
  for select
  using (created_by = (select auth.uid()) or public.is_project_member(id));

drop policy if exists "projects_insert_for_creator" on public.projects;
create policy "projects_insert_for_creator"
  on public.projects
  for insert
  with check (created_by = (select auth.uid()));

drop policy if exists "projects_update_for_owner" on public.projects;
create policy "projects_update_for_owner"
  on public.projects
  for update
  using (created_by = (select auth.uid()) or public.is_project_owner(id))
  with check (created_by = (select auth.uid()) or public.is_project_owner(id));

drop policy if exists "project_members_insert_for_owner" on public.project_members;
create policy "project_members_insert_for_owner"
  on public.project_members
  for insert
  with check (
    (
      exists (
        select 1
        from public.projects project
        where project.id = project_id
          and project.created_by = (select auth.uid())
      )
      and user_id = (select auth.uid())
      and role = 'owner'
    )
    or public.is_project_owner(project_id)
  );

create index if not exists projects_created_by_idx
  on public.projects (created_by);

create index if not exists project_members_user_id_idx
  on public.project_members (user_id);

create index if not exists project_invitations_invited_by_idx
  on public.project_invitations (invited_by);

create index if not exists project_invitations_accepted_by_idx
  on public.project_invitations (accepted_by);

create index if not exists issues_assignee_id_idx
  on public.issues (assignee_id);

create index if not exists issues_created_by_idx
  on public.issues (created_by);

create index if not exists issues_updated_by_idx
  on public.issues (updated_by);

create index if not exists comments_project_id_idx
  on public.comments (project_id);

create index if not exists comments_issue_project_idx
  on public.comments (issue_id, project_id);

create index if not exists comments_author_id_idx
  on public.comments (author_id);

create index if not exists activity_logs_project_id_idx
  on public.activity_logs (project_id);

create index if not exists activity_logs_issue_project_idx
  on public.activity_logs (issue_id, project_id);

create index if not exists activity_logs_actor_id_idx
  on public.activity_logs (actor_id);
