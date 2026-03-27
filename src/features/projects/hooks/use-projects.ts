"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProjectInput,
  DeleteProjectInput,
  UpdateProjectInput,
} from "@/features/projects/contracts";
import { createProjectsRepository } from "@/features/projects/repositories/supabase-projects-repository";
import {
  cacheTimes,
  queryKeys,
  staleTimes,
} from "@/lib/react-query/query-client";
import { useSupabaseClient } from "@/lib/supabase/use-supabase-client";

/**
 * React Query hooks for project operations
 * Feature: 003-performance-audit (User Story 2: Optimization)
 *
 * Provides cached and optimized data fetching for projects
 */

export function useProjects() {
  const supabase = useSupabaseClient();
  const repository = createProjectsRepository(supabase);

  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => repository.listProjects(),
    staleTime: staleTimes.project,
    gcTime: cacheTimes.project,
  });
}

export function useProject(projectId: string) {
  const supabase = useSupabaseClient();
  const repository = createProjectsRepository(supabase);

  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => repository.getProjectById(projectId),
    staleTime: staleTimes.project,
    gcTime: cacheTimes.project,
    enabled: !!projectId,
  });
}

export function useProjectMembers(projectId: string) {
  const supabase = useSupabaseClient();
  const repository = createProjectsRepository(supabase);

  return useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: () => repository.listProjectMembers(projectId),
    staleTime: staleTimes.projectMembers,
    gcTime: cacheTimes.projectMembers,
    enabled: !!projectId,
  });
}

export function useProjectInvitations(projectId: string) {
  const supabase = useSupabaseClient();
  const repository = createProjectsRepository(supabase);

  return useQuery({
    queryKey: queryKeys.projects.invitations(projectId),
    queryFn: () => repository.listPendingProjectInvitations(projectId),
    staleTime: staleTimes.projectInvitations,
    gcTime: cacheTimes.projectInvitations,
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const repository = createProjectsRepository(supabase);

  return useMutation({
    mutationFn: (input: CreateProjectInput) => repository.createProject(input),
    onSuccess: () => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useUpdateProject() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const repository = createProjectsRepository(supabase);

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => repository.updateProject(input),
    onSuccess: (data, variables) => {
      // Update the specific project cache
      queryClient.setQueryData(
        queryKeys.projects.detail(variables.projectId),
        data
      );
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

export function useDeleteProject() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const repository = createProjectsRepository(supabase);

  return useMutation({
    mutationFn: (input: DeleteProjectInput) => repository.deleteProject(input),
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}
