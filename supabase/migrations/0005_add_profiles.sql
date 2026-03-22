create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  email_normalized text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index profiles_email_normalized_idx
  on public.profiles (email_normalized);

create index profiles_display_name_idx
  on public.profiles (display_name);

create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_for_authenticated_users"
  on public.profiles
  for select
  using (auth.uid() is not null);

create policy "profiles_insert_for_self"
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy "profiles_update_for_self"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
