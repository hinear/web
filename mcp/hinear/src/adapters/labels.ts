import { resolveSession } from "../lib/auth";
import { createMcpActorSupabaseClient } from "../lib/supabase";
import type {
  CreateLabelInput,
  DeleteLabelInput,
  Label,
  ListLabelsInput,
  UpdateLabelInput,
} from "../schemas/label";

/**
 * List all labels for a project
 */
export async function listLabels(input: ListLabelsInput): Promise<{
  labels: Label[];
  total: number;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  const { data, error } = await supabase
    .from("labels")
    .select("*")
    .eq("project_id", input.project_id)
    .order("name");

  if (error) {
    throw new Error(`Failed to list labels: ${error.message}`);
  }

  return {
    labels: (data || []) as Label[],
    total: data?.length || 0,
  };
}

/**
 * Create a new label
 */
export async function createLabel(input: CreateLabelInput): Promise<{
  label: Label;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  const { data, error } = await supabase
    .from("labels")
    .insert({
      project_id: input.project_id,
      name: input.name,
      color: input.color,
      description: input.description || null,
    })
    .select()
    .single();

  if (error) {
    // Check for duplicate key error
    if (error.code === "23505") {
      throw new Error("LABEL_ALREADY_EXISTS");
    }
    throw new Error(`Failed to create label: ${error.message}`);
  }

  return {
    label: data as Label,
  };
}

/**
 * Update an existing label
 */
export async function updateLabel(input: UpdateLabelInput): Promise<{
  label: Label;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.color !== undefined) {
    updateData.color = input.color;
  }
  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  const { data, error } = await supabase
    .from("labels")
    .update(updateData)
    .eq("id", input.label_id)
    .select()
    .single();

  if (error || !data) {
    throw new Error("LABEL_NOT_FOUND");
  }

  return {
    label: data as Label,
  };
}

/**
 * Delete a label
 */
export async function deleteLabel(input: DeleteLabelInput): Promise<{
  success: boolean;
}> {
  const session = resolveSession();
  const supabase = createMcpActorSupabaseClient(session);

  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", input.label_id);

  if (error) {
    throw new Error("LABEL_NOT_FOUND");
  }

  return {
    success: true,
  };
}
