-- Invite token lookup and accept functions
-- These functions use SECURITY DEFINER to bypass RLS for invite token operations
-- The token itself is the security mechanism (like a password reset token)

-- Function to get invitation by token (bypasses RLS)
create or replace function get_invitation_by_token(p_token text)
returns table (
  id uuid,
  project_id uuid,
  email text,
  role text,
  status text,
  token text,
  invited_by uuid,
  expires_at timestamptz,
  accepted_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    i.id,
    i.project_id,
    i.email,
    i.role,
    i.status,
    i.token,
    i.invited_by,
    i.expires_at,
    i.accepted_by,
    i.created_at,
    i.updated_at
  from public.project_invitations i
  where i.token = p_token;
end;
$$;

-- Function to accept project invitation (bypasses RLS)
create or replace function accept_invitation_by_token(
  p_token text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
  v_is_expired boolean;
  v_current_time timestamptz := now();
begin
  -- Get the invitation
  select * into v_invitation
  from public.project_invitations
  where token = p_token;

  if not found then
    return jsonb_build_object(
      'error', 'Invitation not found'
    );
  end if;

  -- Check if already accepted
  if v_invitation.status = 'accepted' then
    return jsonb_build_object(
      'id', v_invitation.id,
      'project_id', v_invitation.project_id,
      'status', v_invitation.status,
      'already_accepted', true
    );
  end if;

  -- Check if expired
  v_is_expired := v_invitation.expires_at <= v_current_time;

  if v_is_expired then
    -- Update status to expired
    update public.project_invitations
    set status = 'expired',
        updated_at = v_current_time
    where id = v_invitation.id;

    return jsonb_build_object(
      'id', v_invitation.id,
      'project_id', v_invitation.project_id,
      'status', 'expired'
    );
  end if;

  -- Add user as project member (ignore if already exists)
  insert into public.project_members (project_id, user_id, role)
  values (v_invitation.project_id, p_user_id, v_invitation.role)
  on conflict (project_id, user_id) do nothing;

  -- Update invitation status
  update public.project_invitations
  set status = 'accepted',
      accepted_by = p_user_id,
      updated_at = v_current_time
  where id = v_invitation.id;

  -- Return updated invitation
  return jsonb_build_object(
    'id', v_invitation.id,
    'project_id', v_invitation.project_id,
    'status', 'accepted'
  );
end;
$$;

-- Grant execute to authenticated users
grant execute on function get_invitation_by_token(text) to authenticated;
grant execute on function accept_invitation_by_token(text, uuid) to authenticated;

-- Add comment explaining security model
comment on function get_invitation_by_token(text) is 'Security definer function to lookup invitation by token. The token itself serves as the authorization mechanism (similar to password reset tokens).';
comment on function accept_invitation_by_token(text, uuid) is 'Security definer function to accept project invitation. Validates token, expiration, and adds user as project member.';
