import { z } from 'zod';

export const uuidParamSchema = z.object({
    id: z.string().uuid(),
});

export const itemIdParamSchema = z.object({
    itemId: z.string().uuid(),
});

export const createExtensionRequestBodySchema = z.object({
    extended_to: z.coerce.date(),
});

export const returnDeviceBodySchema = z.object({
    return_tracking_url: z.string().url().max(2048),
});

export const createSupportRequestBodySchema = z.object({
    type: z.enum(['update', 'damage', 'lost']),
    description: z.string().trim().min(1).max(5000),
});

export const supportRequestsQuerySchema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved']).optional(),
});

export const createHandoverRequestBodySchema = z.object({
    item_id: z.string().uuid(),
    requested_duration_hours: z.coerce.number().int().positive().optional(),
});

export const listHandoverRequestsQuerySchema = z.object({
    as: z.enum(['borrower', 'owner']),
});

export type CreateExtensionRequestBody = z.infer<
    typeof createExtensionRequestBodySchema
>;
export type ReturnDeviceBody = z.infer<typeof returnDeviceBodySchema>;
export type CreateSupportRequestBody = z.infer<
    typeof createSupportRequestBodySchema
>;
export type SupportRequestsQuery = z.infer<typeof supportRequestsQuerySchema>;
export type CreateHandoverRequestBody = z.infer<
    typeof createHandoverRequestBodySchema
>;
export type ListHandoverRequestsQuery = z.infer<
    typeof listHandoverRequestsQuerySchema
>;
