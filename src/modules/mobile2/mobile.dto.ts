import { z } from "zod";

export const itemIdParamsSchema = z.object({
  itemId: z.string().uuid(),
});

export const requestIdParamsSchema = z.object({
  requestId: z.string().uuid(),
});

export const createRequestSchema = z.object({
  categoryId: z.string().uuid(),
  requestedFrom: z.string(),
  requestedTo: z.string(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  note: z.string().optional(),
  isWfh: z.boolean().optional(),
});

export const approveRequestSchema = z.object({
  managerDecisionNote: z.string().optional(),
});

export const rejectRequestSchema = z.object({
  managerDecisionNote: z.string().optional(),
  rejectedReason: z.string().optional(),
});

export type ItemIdParams = z.infer<typeof itemIdParamsSchema>;
export type RequestIdParams = z.infer<typeof requestIdParamsSchema>;
export type CreateRequestDto = z.infer<typeof createRequestSchema>;
export type ApproveRequestDto = z.infer<typeof approveRequestSchema>;
export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
