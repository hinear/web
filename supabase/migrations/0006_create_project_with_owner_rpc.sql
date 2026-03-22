create or replace function public.create_project_with_owner(
  project_key text,
  project_name text,
  project_type public.project_type
)
returns public.projects
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  created_project public.projects;
begin
  insert into public.projects (
    key,
    name,
    type,
    created_by
  )
  values (
    upper(trim(project_key)),
    trim(project_name),
    project_type,
    auth.uid()
  )
  returning * into created_project;

  insert into public.project_members (
    project_id,
    user_id,
    role
  )
  values (
    created_project.id,
    auth.uid(),
    'owner'
  );

  return created_project;
end;
$$;

grant execute on function public.create_project_with_owner(text, text, public.project_type)
to authenticated;
