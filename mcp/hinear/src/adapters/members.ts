import { resolveSession } from "../lib/auth";
import { createMcpActorSupabaseClient } from "../lib/supabase";
import type {
  Invitation,
  InviteMemberInput,
  ListMembersInput,
  Member,
  RemoveMemberInput,
  UpdateMemberRoleInput,
} from "../schemas/member";

/**
 * List all members for a project
 */
export async function listMembers(input: ListMembersInput): Promise<{
  members: Member[];
  total: number;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
        id,
        role,
        created_at,
        profiles (
          id,
          display_name,
          email
        )
      `
    )
    .eq("project_id", input.project_id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list members: ${error.message}`);
  }

  const members = (data || []).map((row: any) => ({
    id: row.id,
    role: row.role,
    profile: row.profiles || {
      id: "",
      display_name: null,
      email: null,
    },
    created_at: row.created_at,
  })) as Member[];

  return {
    members,
    total: members.length,
  };
}

/**
 * Invite a new member to the project
 */
export async function inviteMember(input: InviteMemberInput): Promise<{
  invitation: Invitation;
  invite_url: string;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // Generate invitation token
  const token = Buffer.from(
    `${input.project_id}-${input.email}-${Date.now()}`
  ).toString("base64url");

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      project_id: input.project_id,
      email: input.email.toLowerCase(),
      role: input.role,
      token,
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate invitation
    if (error.code === "23505") {
      throw new Error("INVITATION_EXISTS");
    }
    throw new Error(`Failed to invite member: ${error.message}`);
  }

  // Generate invite URL (using APP_ORIGIN from env)
  const appOrigin =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    "http://localhost:3000";
  const inviteUrl = `${appOrigin}/invitations/${token}`;

  return {
    invitation: data as Invitation,
    invite_url: inviteUrl,
  };
}

/**
 * Update member role
 */
export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<{
  member: Member;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // First check if member exists and get current role
  const { data: currentMember, error: fetchError } = await supabase
    .from("project_members")
    .select("role")
    .eq("id", input.member_id)
    .single();

  if (fetchError || !currentMember) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  // Check if role is the same
  if (currentMember.role === input.role) {
    throw new Error("SAME_ROLE");
  }

  // Update role
  const { data, error } = await supabase
    .from("project_members")
    .update({ role: input.role })
    .eq("id", input.member_id)
    .select(
      `
        id,
        role,
        created_at,
        profiles (
          id,
          display_name,
          email
        )
      `
    )
    .single();

  if (error || !data) {
    throw new Error("MEMBER_NOT_FOUND");
  }

  const member = {
    id: data.id,
    role: data.role,
    profile: data.profiles?.[0] || {
      id: "",
      display_name: null,
      email: null,
    },
    created_at: data.created_at,
  } as Member;

  return {
    member,
  };
}

/**
 * Remove a member or revoke an invitation
 */
export async function removeMember(input: RemoveMemberInput): Promise<{
  success: boolean;
  type: "member" | "invitation";
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  // Try to delete as member first
  const { error: memberError } = await supabase
    .from("project_members")
    .delete()
    .eq("id", input.member_id);

  if (!memberError) {
    return {
      success: true,
      type: "member",
    };
  }

  // If not found as member, try as invitation
  const { error: invitationError } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", input.member_id)
    .eq("status", "pending");

  if (!invitationError) {
    return {
      success: true,
      type: "invitation",
    };
  }

  // Both failed
  throw new Error("MEMBER_NOT_FOUND");
}
