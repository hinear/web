drop policy if exists "issues_delete_for_members" on public.issues;

create policy "issues_delete_for_members"
  on public.issues
  for delete
  using (public.is_project_member(project_id));
