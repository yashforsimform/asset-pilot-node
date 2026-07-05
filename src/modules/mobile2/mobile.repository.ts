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

const itemLookupInclude = {
    category: true,
    currentOwner: true,
} satisfies Prisma.ItemInclude;

const supportWithItemInclude = {
    item: true,
} satisfies Prisma.SupportRequestInclude;

const handoverWithItemInclude = {
    item: true,
} satisfies Prisma.HandoverRequestInclude;

export type RequestWithCategoryAndItem = Prisma.RequestGetPayload<{
    include: typeof requestWithCategoryAndItem;
}>;

export type ManagerApprovalRequest = Prisma.RequestGetPayload<{
    include: typeof managerApprovalInclude;
}>;

export type ItemLookup = Prisma.ItemGetPayload<{
    include: typeof itemLookupInclude;
}>;

export type SupportRequestWithItem = Prisma.SupportRequestGetPayload<{
    include: typeof supportWithItemInclude;
}>;

export type HandoverRequestWithItem = Prisma.HandoverRequestGetPayload<{
    include: typeof handoverWithItemInclude;
}>;

export type ExtensionRequestSummary = Pick<
    Prisma.ExtensionRequestGetPayload<object>,
    | 'id'
    | 'status'
    | 'currentAssignedTo'
    | 'extendedTo'
    | 'mgrApprovalStatus'
    | 'managerNote'
    | 'itNote'
    | 'createdAt'
>;

type TransactionClient = Prisma.TransactionClient;

async function writeDeviceLog(
    tx: TransactionClient,
    data: Prisma.DeviceLogUncheckedCreateInput,
): Promise<void> {
    await tx.deviceLog.create({ data });
}

function buildFallbackUser(id: string): User {
    return {
        id,
        name: 'Demo User',
        email: `${id}@demo.local`,
        role: 'employee',
        managerId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as User;
}

export async function findUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email },
        include: { manager: true },
    });
}

export async function findRequestByUserId(requestId: string, userId: string) {
    return await prisma.request.findFirst({
        where: {
            requesterId: userId,
            id: requestId,
            OR: [
                { status: 'pending_it_approval' },
                { status: 'pending_mgr_approval' },
                { status: 'requested' },
            ],
        },
    });
}

export async function cancelRequestById(requestId: string) {
    return await prisma.request.update({
        where: { id: requestId },
        data: { status: 'cancelled' },
    });
}

export async function getItemCategoryRepo() {
    return await prisma.itemCategory.findMany();
}

export async function findUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ?? buildFallbackUser(id);
}

export async function findMyRequestByUserId(userId: string) {
    return prisma.request.findMany({
        where: { requesterId: userId },
    });
}

export async function getMyDevicesByUserId(userId: string) {
    return prisma.request.findMany({
        where: {
            AND: [{ requesterId: userId }, { assignedItemId: { not: null } }],
        },
        include: {
            assignedItem: true,
        },
    });
    // return prisma.item.findMany({
    //     where: {
    //         currentOwnerId: userId,
    //     },
    // });
}

export async function findRequestsByRequester(
    requesterId: string,
): Promise<RequestWithCategoryAndItem[]> {
    return prisma.request.findMany({
        where: { requesterId },
        include: {
            category: true,
            assignedItem: true,
        },
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
            status: 'assigned',
        },
        include: requestWithCategoryAndItem,
        orderBy: { createdAt: 'desc' },
    });
}

export async function findItemLookupById(
    itemId: string,
): Promise<ItemLookup | null> {
    return prisma.item.findUnique({
        where: { id: itemId },
        include: itemLookupInclude,
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

export async function createExtensionRequestForDevice(
    userId: string,
    itemId: string,
    extendedTo: Date,
): Promise<Prisma.ExtensionRequestGetPayload<object>> {
    return prisma.$transaction(async (tx) => {
        const request = await tx.request.findFirst({
            where: {
                requesterId: userId,
                assignedItemId: itemId,
                status: 'assigned',
                assignedItem: { currentOwnerId: userId },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!request || !request.assignedTo) {
            throw new Error('ACTIVE_ASSIGNMENT_NOT_FOUND');
        }

        const extensionRequest = await tx.extensionRequest.create({
            data: {
                originalRequestId: request.id,
                requesterId: userId,
                currentAssignedTo: request.assignedTo,
                extendedTo,
                status: 'pending',
                requiresMgrApproval: request.requiresMgrApproval,
                managerId: request.managerId,
                mgrApprovalStatus: request.requiresMgrApproval
                    ? 'pending'
                    : 'not_required',
            },
        });

        await writeDeviceLog(tx, {
            itemId,
            eventType: 'extension_requested',
            actorId: userId,
            actorRole: 'employee',
            requestId: request.id,
            extensionRequestId: extensionRequest.id,
            metadata: {},
            isMilestone: false,
        });

        return extensionRequest;
    });
}

export async function findExtensionRequestsForDevice(
    userId: string,
    itemId: string,
): Promise<Prisma.ExtensionRequestGetPayload<object>[]> {
    const request = await prisma.request.findFirst({
        where: {
            requesterId: userId,
            assignedItemId: itemId,
            status: 'assigned',
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!request) {
        return [];
    }

    return prisma.extensionRequest.findMany({
        where: { originalRequestId: request.id },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getDeviceDetailRepo(deviceId: string) {
    return await prisma.item.findUnique({
        where: { id: deviceId },
    });
}

export async function findExtensionRequestDetail(
    userId: string,
    id: string,
): Promise<ExtensionRequestSummary | null> {
    return prisma.extensionRequest.findFirst({
        where: { id, requesterId: userId },
        select: {
            id: true,
            status: true,
            currentAssignedTo: true,
            extendedTo: true,
            mgrApprovalStatus: true,
            managerNote: true,
            itNote: true,
            createdAt: true,
        },
    });
}

export async function initiateWfhReturn(
    userId: string,
    itemId: string,
    returnTrackingUrl: string,
): Promise<{
    item: Prisma.ItemGetPayload<object>;
    request: Prisma.RequestGetPayload<object>;
}> {
    return prisma.$transaction(async (tx) => {
        const request = await tx.request.findFirst({
            where: {
                requesterId: userId,
                assignedItemId: itemId,
                status: 'assigned',
                assignedItem: { currentOwnerId: userId },
            },
            include: { assignedItem: true },
            orderBy: { createdAt: 'desc' },
        });

        if (!request || !request.assignedItem) {
            throw new Error('ACTIVE_ASSIGNMENT_NOT_FOUND');
        }

        if (!request.isWfh) {
            throw new Error('RETURN_REQUIRES_IT');
        }

        if (request.assignedItem.status !== 'assigned') {
            throw new Error('DEVICE_NOT_ASSIGNED');
        }

        const item = await tx.item.update({
            where: { id: itemId },
            data: { status: 'return_shipping_pending' },
        });
        const updatedRequest = await tx.request.update({
            where: { id: request.id },
            data: {
                returnTrackingUrl,
                returnInitiatedAt: new Date(),
            },
        });

        await writeDeviceLog(tx, {
            itemId,
            eventType: 'return_ship_initiated',
            actorId: userId,
            actorRole: 'employee',
            requestId: request.id,
            fromValue: 'assigned',
            toValue: 'return_shipping_pending',
            metadata: { return_tracking_url: returnTrackingUrl },
            isMilestone: false,
        });

        return { item, request: updatedRequest };
    });
}

export async function createSupportRequestForDevice(
    userId: string,
    itemId: string,
    type: 'update' | 'damage' | 'lost',
    description: string,
): Promise<Prisma.SupportRequestGetPayload<object>> {
    return prisma.$transaction(async (tx) => {
        const item = await tx.item.findFirst({
            where: { id: itemId, currentOwnerId: userId },
        });

        if (!item) {
            throw new Error('OWNED_ITEM_NOT_FOUND');
        }

        const request = await tx.request.findFirst({
            where: {
                requesterId: userId,
                assignedItemId: itemId,
                status: 'assigned',
            },
            orderBy: { createdAt: 'desc' },
        });

        const supportRequest = await tx.supportRequest.create({
            data: {
                itemId,
                requesterId: userId,
                requestId: request?.id ?? null,
                type,
                description,
                status: 'open',
                filedAt: new Date(),
            },
        });

        await writeDeviceLog(tx, {
            itemId,
            eventType: 'support_opened',
            actorId: userId,
            actorRole: 'employee',
            requestId: request?.id ?? null,
            supportRequestId: supportRequest.id,
            metadata: {},
            isMilestone: true,
        });

        return supportRequest;
    });
}

export async function findSupportRequestsByRequester(
    userId: string,
    status?: 'open' | 'in_progress' | 'resolved',
): Promise<SupportRequestWithItem[]> {
    return prisma.supportRequest.findMany({
        where: {
            requesterId: userId,
            ...(status ? { status } : {}),
        },
        include: supportWithItemInclude,
        orderBy: { filedAt: 'desc' },
    });
}

export async function findSupportRequestDetail(
    userId: string,
    id: string,
): Promise<SupportRequestWithItem | null> {
    return prisma.supportRequest.findFirst({
        where: { id, requesterId: userId },
        include: supportWithItemInclude,
    });
}

export async function createHandoverForItem(
    userId: string,
    itemId: string,
    requestedDurationHours?: number,
): Promise<Prisma.HandoverRequestGetPayload<object>> {
    return prisma.$transaction(async (tx) => {
        const item = await tx.item.findUnique({ where: { id: itemId } });

        if (!item || !item.currentOwnerId) {
            throw new Error('HANDOVER_ITEM_NOT_AVAILABLE');
        }

        if (item.currentOwnerId === userId) {
            throw new Error('CANNOT_HANDOVER_OWN_DEVICE');
        }

        const handoverRequest = await tx.handoverRequest.create({
            data: {
                itemId,
                ownerId: item.currentOwnerId,
                borrowerId: userId,
                requestedDurationHours: requestedDurationHours ?? null,
                status: 'requested',
                requestedAt: new Date(),
            },
        });

        await writeDeviceLog(tx, {
            itemId,
            eventType: 'handover_requested',
            actorId: userId,
            actorRole: 'employee',
            handoverRequestId: handoverRequest.id,
            metadata: {},
            isMilestone: false,
        });

        return handoverRequest;
    });
}

export async function findHandoverRequestsForUser(
    userId: string,
    actor: 'borrower' | 'owner',
): Promise<HandoverRequestWithItem[]> {
    return prisma.handoverRequest.findMany({
        where:
            actor === 'borrower' ? { borrowerId: userId } : { ownerId: userId },
        include: handoverWithItemInclude,
        orderBy: { requestedAt: 'desc' },
    });
}

export async function acceptHandoverForOwner(
    userId: string,
    id: string,
): Promise<Prisma.HandoverRequestGetPayload<object>> {
    return prisma.$transaction(async (tx) => {
        const handoverRequest = await tx.handoverRequest.findFirst({
            where: { id, ownerId: userId, status: 'requested' },
        });

        if (!handoverRequest) {
            throw new Error('HANDOVER_NOT_FOUND');
        }

        const accepted = await tx.handoverRequest.findFirst({
            where: {
                itemId: handoverRequest.itemId,
                status: 'accepted',
                id: { not: id },
            },
        });

        if (accepted) {
            throw new Error('ACTIVE_HANDOVER_EXISTS');
        }

        const updated = await tx.handoverRequest.update({
            where: { id },
            data: { status: 'accepted', decidedAt: new Date() },
        });

        await writeDeviceLog(tx, {
            itemId: handoverRequest.itemId,
            eventType: 'handover_accepted',
            actorId: userId,
            actorRole: 'employee',
            handoverRequestId: id,
            metadata: {},
            isMilestone: true,
        });

        return updated;
    });
}

export async function rejectHandoverForOwner(
    userId: string,
    id: string,
): Promise<Prisma.HandoverRequestGetPayload<object>> {
    return updateHandoverForUser(userId, id, 'owner', 'requested', {
        status: 'rejected',
        decidedAt: new Date(),
    });
}

export async function cancelHandoverForBorrower(
    userId: string,
    id: string,
): Promise<Prisma.HandoverRequestGetPayload<object>> {
    return updateHandoverForUser(userId, id, 'borrower', 'requested', {
        status: 'cancelled',
    });
}

export async function completeHandoverForOwner(
    userId: string,
    id: string,
): Promise<Prisma.HandoverRequestGetPayload<object>> {
    return updateHandoverForUser(userId, id, 'owner', 'accepted', {
        status: 'completed',
        completedAt: new Date(),
    });
}

async function updateHandoverForUser(
    userId: string,
    id: string,
    actor: 'borrower' | 'owner',
    requiredStatus: 'requested' | 'accepted',
    data: Prisma.HandoverRequestUncheckedUpdateInput,
): Promise<Prisma.HandoverRequestGetPayload<object>> {
    return prisma.$transaction(async (tx) => {
        const handoverRequest = await tx.handoverRequest.findFirst({
            where: {
                id,
                status: requiredStatus,
                ...(actor === 'borrower'
                    ? { borrowerId: userId }
                    : { ownerId: userId }),
            },
        });

        if (!handoverRequest) {
            throw new Error('HANDOVER_NOT_FOUND');
        }

        const updated = await tx.handoverRequest.update({
            where: { id },
            data,
        });

        const eventTypeByStatus = {
            rejected: 'handover_rejected',
            cancelled: 'handover_cancelled',
            completed: 'handover_completed',
        } as const;
        const status = String(data.status);
        const eventType =
            eventTypeByStatus[status as keyof typeof eventTypeByStatus];

        await writeDeviceLog(tx, {
            itemId: handoverRequest.itemId,
            eventType,
            actorId: userId,
            actorRole: 'employee',
            handoverRequestId: id,
            metadata: {},
            isMilestone: status === 'completed',
        });

        return updated;
    });
}
