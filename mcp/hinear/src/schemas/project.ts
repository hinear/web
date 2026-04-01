import { z } from "zod";
import { paginationLimitSchema } from "./common";

export const listProjectsInputSchema = {
  include_archived: z.boolean().optional(),
  limit: paginationLimitSchema,
};

export type ListProjectsInput = {
  include_archived?: boolean;
  limit?: number;
};
