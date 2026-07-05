import { z } from 'zod';

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
    priority: z.enum(['low', 'medium', 'high']).optional(),
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

export const extensionRequestIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const supportRequestIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const handoverRequestIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const createExtensionRequestSchema = z.object({
    extendedTo: z.coerce.date(),
});

export const returnDeviceSchema = z.object({
    returnTrackingUrl: z.string().url().max(2048),
});

export const createSupportRequestSchema = z.object({
    type: z.enum(['update', 'damage', 'lost']),
    description: z.string().trim().min(1).max(5000),
});

export const supportRequestsQuerySchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved']).optional(),
});

export const createHandoverRequestSchema = z.object({
    itemId: z.string().uuid(),
    requestedDurationHours: z.coerce.number().int().positive().optional(),
});

export const handoverRequestsQuerySchema = z.object({
    as: z.enum(['borrower', 'owner']),
});

export type ItemIdParams = z.infer<typeof itemIdParamsSchema>;
export type RequestIdParams = z.infer<typeof requestIdParamsSchema>;
export type EntityIdParams = z.infer<typeof extensionRequestIdParamsSchema>;
export type CreateRequestDto = z.infer<typeof createRequestSchema>;
export type ApproveRequestDto = z.infer<typeof approveRequestSchema>;
export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
export type CreateExtensionRequestDto = z.infer<
    typeof createExtensionRequestSchema
>;
export type ReturnDeviceDto = z.infer<typeof returnDeviceSchema>;
export type CreateSupportRequestDto = z.infer<
    typeof createSupportRequestSchema
>;
export type SupportRequestsQuery = z.infer<typeof supportRequestsQuerySchema>;
export type CreateHandoverRequestDto = z.infer<
    typeof createHandoverRequestSchema
>;
export type HandoverRequestsQuery = z.infer<typeof handoverRequestsQuerySchema>;
