import { z } from "zod";
import {
  issuePrioritySchema,
  issueStatusSchema,
  paginationLimitSchema,
} from "./common";

export const searchIssuesInputSchema = {
  project_id: z.string().min(1),
  query: z.string().optional(),
  status: z.array(issueStatusSchema).optional(),
  priority: z.array(issuePrioritySchema).optional(),
  assignee_id: z.string().optional(),
  label_ids: z.array(z.string().min(1)).optional(),
  due_before: z.string().optional(),
  due_after: z.string().optional(),
  limit: paginationLimitSchema,
};

export const getIssueDetailInputSchema = {
  issue_id: z.string().min(1),
  include_comments: z.boolean().optional(),
  include_activity: z.boolean().optional(),
  comment_limit: paginationLimitSchema,
  activity_limit: paginationLimitSchema,
};

export const createIssueInputSchema = {
  project_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assignee_id: z.string().optional(),
  labels: z.array(z.string().min(1)).optional(),
  due_date: z.string().optional(),
};

export const updateIssueStatusInputSchema = {
  issue_id: z.string().min(1),
  status: issueStatusSchema,
  reason: z.string().optional(),
  comment_on_change: z.string().optional(),
};

export type SearchIssuesInput = z.infer<
  z.ZodObject<typeof searchIssuesInputSchema>
>;
export type GetIssueDetailInput = z.infer<
  z.ZodObject<typeof getIssueDetailInputSchema>
>;
export type CreateIssueInput = z.infer<
  z.ZodObject<typeof createIssueInputSchema>
>;
export type UpdateIssueStatusInput = z.infer<
  z.ZodObject<typeof updateIssueStatusInputSchema>
>;
