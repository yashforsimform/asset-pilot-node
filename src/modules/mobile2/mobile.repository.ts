import type { Prisma, Request, User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const requestWithCategoryAndItem = {
    category: true,
    assignedItem: true,
} satisfies Prisma.RequestInclude;

const managerApprovalInclude = {
    category: true,
    requester: true,
    assignedItem: true,
} satisfies Prisma.RequestInclude;

export type RequestWithCategoryAndItem = Prisma.RequestGetPayload<{
    include: typeof requestWithCategoryAndItem;
}>;

export type ManagerApprovalRequest = Prisma.RequestGetPayload<{
    include: typeof managerApprovalInclude;
}>;

export async function findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
}

export async function findRequestsByRequester(
    requesterId: string,
): Promise<RequestWithCategoryAndItem[]> {
    return prisma.request.findMany({
        where: { requesterId },
        include: requestWithCategoryAndItem,
        orderBy: { createdAt: 'desc' },
    });
}

export async function findAssignmentForRequester(
    requesterId: string,
    itemId: string,
): Promise<RequestWithCategoryAndItem | null> {
    return prisma.request.findFirst({
        where: {
            requesterId,
            assignedItemId: itemId,
        },
        include: requestWithCategoryAndItem,
    });
}

export async function findHandoversByItem(
    itemId: string,
): Promise<Prisma.HandoverRequestGetPayload<object>[]> {
    return prisma.handoverRequest.findMany({
        where: { itemId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function findCategoryById(
    id: string,
): Promise<Prisma.ItemCategoryGetPayload<object> | null> {
    return prisma.itemCategory.findUnique({ where: { id } });
}

export async function createAssetRequest(
    data: Prisma.RequestUncheckedCreateInput,
): Promise<RequestWithCategoryAndItem> {
    return prisma.request.create({
        data,
        include: requestWithCategoryAndItem,
    });
}

export async function findManagerApprovals(
    managerId: string,
): Promise<ManagerApprovalRequest[]> {
    return prisma.request.findMany({
        where: {
            managerId,
            requiresMgrApproval: true,
            mgrApprovalStatus: 'pending',
            status: 'pending_mgr_approval',
        },
        include: managerApprovalInclude,
        orderBy: { createdAt: 'asc' },
    });
}

export async function findRequestById(id: string): Promise<Request | null> {
    return prisma.request.findUnique({ where: { id } });
}

export async function approveRequestByManager(
    id: string,
    managerDecisionNote: string | null,
): Promise<ManagerApprovalRequest> {
    return prisma.request.update({
        where: { id },
        data: {
            mgrApprovalStatus: 'approved',
            managerDecisionNote,
            managerDecidedAt: new Date(),
            status: 'pending_it_approval',
        },
        include: managerApprovalInclude,
    });
}

export async function rejectRequestByManager(
    id: string,
    managerDecisionNote: string | null,
    rejectedReason: string | null,
): Promise<ManagerApprovalRequest> {
    return prisma.request.update({
        where: { id },
        data: {
            mgrApprovalStatus: 'rejected',
            rejectedBy: 'manager',
            rejectedReason,
            managerDecisionNote,
            managerDecidedAt: new Date(),
            status: 'rejected',
        },
        include: managerApprovalInclude,
    });
}
