import { prisma } from '../../config/prisma';
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from '../../common/errors/app-error';

export type Row = Record<string, unknown>;

type PrismaDelegate = {
    findFirst(args: Row): Promise<Row | null>;
    findMany(args: Row): Promise<Row[]>;
    create(args: Row): Promise<Row>;
    update(args: Row): Promise<Row>;
};

type PrismaTransaction = {
    $transaction<T>(handler: (tx: PrismaTransaction) => Promise<T>): Promise<T>;
} & Record<string, PrismaDelegate>;

type DeviceLogInput = {
    itemId: string;
    eventType: string;
    actorId: string;
    requestId?: string | undefined;
    supportRequestId?: string | undefined;
    extensionRequestId?: string | undefined;
    handoverRequestId?: string | undefined;
    fromValue?: string | undefined;
    toValue?: string | undefined;
    metadata?: Row | undefined;
    isMilestone: boolean;
};

const db = prisma as PrismaTransaction;

const delegate = (client: PrismaTransaction, name: string): PrismaDelegate => {
    const modelDelegate = client[name];

    if (!modelDelegate) {
        throw new Error(`Prisma model delegate "${name}" is not available`);
    }

    return modelDelegate;
};

export class MobileRepository {
    public async withTransaction<T>(
        handler: (client: PrismaTransaction) => Promise<T>,
    ): Promise<T> {
        return db.$transaction(handler);
    }

    public async listMyDevices(userId: string): Promise<Row[]> {
        const requests = await delegate(db, 'request').findMany({
            where: { requester_id: userId },
            orderBy: { created_at: 'desc' },
        });

        return Promise.all(
            requests.map(async (request) => {
                const itemId = request.assigned_item_id;
                const categoryId = request.category_id;
                const item =
                    typeof itemId === 'string'
                        ? await this.findItemById(db, itemId)
                        : null;
                const category =
                    typeof categoryId === 'string'
                        ? await this.findCategoryById(db, categoryId)
                        : null;

                return {
                    ...request,
                    item_name: item?.name ?? null,
                    serial_no: item?.serial_no ?? null,
                    item_status: item?.status ?? null,
                    category_name: category?.name ?? null,
                };
            }),
        );
    }

    public async getDeviceDetail(itemId: string): Promise<Row> {
        const item = await this.getAssignedItem(db, itemId);
        const categoryId = String(item.category_id);
        const category = await this.findCategoryById(db, categoryId);
        const currentOwnerId = item.current_owner_id;
        const currentOwner =
            typeof currentOwnerId === 'string'
                ? await this.findUserById(db, currentOwnerId)
                : null;

        const handoverRequests = await delegate(
            db,
            'handover_request',
        ).findMany({
            where: { item_id: itemId },
            orderBy: { created_at: 'desc' },
        });

        return {
            item: {
                ...item,
                category_name: category?.name ?? null,
                current_owner_name: currentOwner?.name ?? null,
            },
            handover_requests: handoverRequests,
        };
    }

    public async createExtensionRequest(
        client: PrismaTransaction,
        userId: string,
        itemId: string,
        extendedTo: Date,
    ): Promise<Row> {
        const item = await this.getOwnedItem(client, userId, itemId);
        const request = await this.getActiveAssignedRequest(
            client,
            itemId,
            userId,
        );

        if (!request.assigned_to) {
            throw new BadRequestError(
                'Active request does not have an assigned_to date',
            );
        }

        const assignedTo = new Date(String(request.assigned_to));
        if (extendedTo <= assignedTo) {
            throw new BadRequestError(
                'extended_to must be greater than the current assigned_to date',
            );
        }

        const requiresManagerApproval = request.requires_mgr_approval === true;
        const extensionRequest = await delegate(
            client,
            'extension_request',
        ).create({
            data: {
                original_request_id: request.id,
                requester_id: userId,
                current_assigned_to: request.assigned_to,
                extended_to: extendedTo,
                status: 'pending',
                requires_mgr_approval: requiresManagerApproval,
                manager_id: request.manager_id,
                mgr_approval_status: requiresManagerApproval
                    ? 'pending'
                    : 'not_required',
            },
        });

        await this.insertDeviceLog(client, {
            itemId,
            eventType: 'extension_requested',
            actorId: userId,
            requestId: String(request.id),
            extensionRequestId: String(extensionRequest.id),
            isMilestone: false,
        });

        return {
            ...extensionRequest,
            item,
        };
    }

    public async listExtensionRequests(
        userId: string,
        itemId: string,
    ): Promise<Row[]> {
        const request = await this.getActiveAssignedRequest(db, itemId, userId);

        return delegate(db, 'extension_request').findMany({
            where: { original_request_id: request.id },
            orderBy: { created_at: 'desc' },
        });
    }

    public async getExtensionRequestDetail(
        userId: string,
        id: string,
    ): Promise<Row> {
        const extensionRequest = await delegate(
            db,
            'extension_request',
        ).findFirst({
            where: { id, requester_id: userId },
            select: {
                id: true,
                status: true,
                current_assigned_to: true,
                extended_to: true,
                mgr_approval_status: true,
                manager_note: true,
                it_note: true,
                created_at: true,
            },
        });

        if (!extensionRequest) {
            throw new NotFoundError('Extension request not found');
        }

        return {
            ...extensionRequest,
            manager_decision_note: extensionRequest.manager_note,
        };
    }

    public async initiateReturn(
        client: PrismaTransaction,
        userId: string,
        itemId: string,
        returnTrackingUrl: string,
    ): Promise<Row> {
        const item = await this.getOwnedItem(client, userId, itemId);
        const request = await this.getActiveAssignedRequest(
            client,
            itemId,
            userId,
        );

        if (request.is_wfh !== true) {
            throw new BadRequestError(
                'Return for this device must be initiated by IT.',
            );
        }

        if (item.status !== 'assigned') {
            throw new ConflictError('Device is not in assigned status');
        }

        const updatedItem = await delegate(client, 'item').update({
            where: { id: itemId },
            data: { status: 'return_shipping_pending' },
        });
        const updatedRequest = await delegate(client, 'request').update({
            where: { id: request.id },
            data: {
                return_tracking_url: returnTrackingUrl,
                return_initiated_at: new Date(),
            },
        });

        await this.insertDeviceLog(client, {
            itemId,
            eventType: 'return_ship_initiated',
            actorId: userId,
            requestId: String(request.id),
            fromValue: 'assigned',
            toValue: 'return_shipping_pending',
            metadata: { return_tracking_url: returnTrackingUrl },
            isMilestone: false,
        });

        return {
            item: updatedItem,
            request: updatedRequest,
        };
    }

    public async createSupportRequest(
        client: PrismaTransaction,
        userId: string,
        itemId: string,
        type: string,
        description: string,
    ): Promise<Row> {
        await this.getOwnedItem(client, userId, itemId);
        const request = await this.findActiveAssignedRequest(
            client,
            itemId,
            userId,
        );

        const supportRequest = await delegate(client, 'support_request').create(
            {
                data: {
                    item_id: itemId,
                    requester_id: userId,
                    request_id: request?.id ?? null,
                    type,
                    description,
                    status: 'open',
                    filed_at: new Date(),
                },
            },
        );

        await this.insertDeviceLog(client, {
            itemId,
            eventType: 'support_opened',
            actorId: userId,
            requestId:
                request?.id === undefined ? undefined : String(request.id),
            supportRequestId: String(supportRequest.id),
            isMilestone: true,
        });

        return supportRequest;
    }

    public async listSupportRequests(
        userId: string,
        status?: string,
    ): Promise<Row[]> {
        const supportRequests = await delegate(db, 'support_request').findMany({
            where: {
                requester_id: userId,
                ...(status ? { status } : {}),
            },
            orderBy: { filed_at: 'desc' },
        });

        return Promise.all(
            supportRequests.map(async (supportRequest) => {
                const item = await this.findItemById(
                    db,
                    String(supportRequest.item_id),
                );

                return {
                    ...supportRequest,
                    item_name: item?.name ?? null,
                };
            }),
        );
    }

    public async getSupportRequestDetail(
        userId: string,
        id: string,
    ): Promise<Row> {
        const supportRequest = await delegate(db, 'support_request').findFirst({
            where: { id, requester_id: userId },
        });

        if (!supportRequest) {
            throw new NotFoundError('Support request not found');
        }

        const item = await this.findItemById(
            db,
            String(supportRequest.item_id),
        );

        return {
            ...supportRequest,
            item_name: item?.name ?? null,
        };
    }

    public async createHandoverRequest(
        client: PrismaTransaction,
        userId: string,
        itemId: string,
        requestedDurationHours: number | undefined,
    ): Promise<Row> {
        const item = await this.getAssignedItem(client, itemId);
        const ownerId = item.current_owner_id;

        if (ownerId === userId) {
            throw new BadRequestError("You can't request your own device");
        }

        const handoverRequest = await delegate(
            client,
            'handover_request',
        ).create({
            data: {
                item_id: itemId,
                owner_id: ownerId,
                borrower_id: userId,
                requested_duration_hours: requestedDurationHours ?? null,
                status: 'requested',
                requested_at: new Date(),
            },
        });

        await this.insertDeviceLog(client, {
            itemId,
            eventType: 'handover_requested',
            actorId: userId,
            handoverRequestId: String(handoverRequest.id),
            isMilestone: false,
        });

        return handoverRequest;
    }

    public async listHandoverRequests(
        userId: string,
        actor: 'borrower' | 'owner',
    ): Promise<Row[]> {
        const userColumn = actor === 'borrower' ? 'borrower_id' : 'owner_id';
        const handoverRequests = await delegate(
            db,
            'handover_request',
        ).findMany({
            where: { [userColumn]: userId },
            orderBy: { requested_at: 'desc' },
        });

        return Promise.all(
            handoverRequests.map(async (handoverRequest) => {
                const item = await this.findItemById(
                    db,
                    String(handoverRequest.item_id),
                );

                return {
                    ...handoverRequest,
                    item_name: item?.name ?? null,
                };
            }),
        );
    }

    public async acceptHandoverRequest(
        client: PrismaTransaction,
        userId: string,
        id: string,
    ): Promise<Row> {
        const handoverRequest = await this.getHandoverForOwner(
            client,
            userId,
            id,
            'requested',
        );
        const acceptedRequest = await delegate(
            client,
            'handover_request',
        ).findFirst({
            where: {
                item_id: handoverRequest.item_id,
                status: 'accepted',
                id: { not: id },
            },
        });

        if (acceptedRequest) {
            throw new ConflictError(
                'Another accepted handover already exists for this device',
            );
        }

        const updatedHandoverRequest = await delegate(
            client,
            'handover_request',
        ).update({
            where: { id },
            data: {
                status: 'accepted',
                decided_at: new Date(),
            },
        });

        await this.insertDeviceLog(client, {
            itemId: String(handoverRequest.item_id),
            eventType: 'handover_accepted',
            actorId: userId,
            handoverRequestId: id,
            isMilestone: true,
        });

        return updatedHandoverRequest;
    }

    public async rejectHandoverRequest(
        client: PrismaTransaction,
        userId: string,
        id: string,
    ): Promise<Row> {
        const handoverRequest = await this.getHandoverForOwner(
            client,
            userId,
            id,
            'requested',
        );
        const updatedHandoverRequest = await delegate(
            client,
            'handover_request',
        ).update({
            where: { id },
            data: {
                status: 'rejected',
                decided_at: new Date(),
            },
        });

        await this.insertDeviceLog(client, {
            itemId: String(handoverRequest.item_id),
            eventType: 'handover_rejected',
            actorId: userId,
            handoverRequestId: id,
            isMilestone: false,
        });

        return updatedHandoverRequest;
    }

    public async cancelHandoverRequest(
        client: PrismaTransaction,
        userId: string,
        id: string,
    ): Promise<Row> {
        const handoverRequest = await this.getHandoverForBorrower(
            client,
            userId,
            id,
            'requested',
        );
        const updatedHandoverRequest = await delegate(
            client,
            'handover_request',
        ).update({
            where: { id },
            data: { status: 'cancelled' },
        });

        await this.insertDeviceLog(client, {
            itemId: String(handoverRequest.item_id),
            eventType: 'handover_cancelled',
            actorId: userId,
            handoverRequestId: id,
            isMilestone: false,
        });

        return updatedHandoverRequest;
    }

    public async completeHandoverRequest(
        client: PrismaTransaction,
        userId: string,
        id: string,
    ): Promise<Row> {
        const handoverRequest = await this.getHandoverForOwner(
            client,
            userId,
            id,
            'accepted',
        );
        const updatedHandoverRequest = await delegate(
            client,
            'handover_request',
        ).update({
            where: { id },
            data: {
                status: 'completed',
                completed_at: new Date(),
            },
        });

        await this.insertDeviceLog(client, {
            itemId: String(handoverRequest.item_id),
            eventType: 'handover_completed',
            actorId: userId,
            handoverRequestId: id,
            isMilestone: true,
        });

        return updatedHandoverRequest;
    }

    private async getOwnedItem(
        client: PrismaTransaction,
        userId: string,
        itemId: string,
    ): Promise<Row> {
        const item = await delegate(client, 'item').findFirst({
            where: { id: itemId, current_owner_id: userId },
        });

        if (!item) {
            throw new NotFoundError(
                'Assigned device not found for current user',
            );
        }

        return item;
    }

    private async getAssignedItem(
        client: PrismaTransaction,
        itemId: string,
    ): Promise<Row> {
        const item = await this.findItemById(client, itemId);

        if (!item) {
            throw new NotFoundError('Device not found');
        }

        if (item.current_owner_id === null) {
            throw new BadRequestError(
                'Device is not assigned, handover not possible',
            );
        }

        return item;
    }

    private async getActiveAssignedRequest(
        client: PrismaTransaction,
        itemId: string,
        userId: string,
    ): Promise<Row> {
        const request = await this.findActiveAssignedRequest(
            client,
            itemId,
            userId,
        );

        if (!request) {
            throw new NotFoundError('Active assigned request not found');
        }

        return request;
    }

    private async findActiveAssignedRequest(
        client: PrismaTransaction,
        itemId: string,
        userId: string,
    ): Promise<Row | null> {
        return delegate(client, 'request').findFirst({
            where: {
                assigned_item_id: itemId,
                requester_id: userId,
                status: 'assigned',
            },
            orderBy: { created_at: 'desc' },
        });
    }

    private async getHandoverForOwner(
        client: PrismaTransaction,
        userId: string,
        id: string,
        status: string,
    ): Promise<Row> {
        const handoverRequest = await delegate(
            client,
            'handover_request',
        ).findFirst({
            where: { id, owner_id: userId, status },
        });

        if (!handoverRequest) {
            throw new NotFoundError(
                'Handover request not found for owner in required status',
            );
        }

        return handoverRequest;
    }

    private async getHandoverForBorrower(
        client: PrismaTransaction,
        userId: string,
        id: string,
        status: string,
    ): Promise<Row> {
        const handoverRequest = await delegate(
            client,
            'handover_request',
        ).findFirst({
            where: { id, borrower_id: userId, status },
        });

        if (!handoverRequest) {
            throw new NotFoundError(
                'Handover request not found for borrower in required status',
            );
        }

        return handoverRequest;
    }

    private async findItemById(
        client: PrismaTransaction,
        id: string,
    ): Promise<Row | null> {
        return delegate(client, 'item').findFirst({ where: { id } });
    }

    private async findCategoryById(
        client: PrismaTransaction,
        id: string,
    ): Promise<Row | null> {
        return delegate(client, 'item_category').findFirst({ where: { id } });
    }

    private async findUserById(
        client: PrismaTransaction,
        id: string,
    ): Promise<Row | null> {
        return delegate(client, 'user').findFirst({ where: { id } });
    }

    private async insertDeviceLog(
        client: PrismaTransaction,
        input: DeviceLogInput,
    ): Promise<void> {
        await delegate(client, 'device_log').create({
            data: {
                item_id: input.itemId,
                event_type: input.eventType,
                actor_id: input.actorId,
                actor_role: 'employee',
                request_id: input.requestId ?? null,
                support_request_id: input.supportRequestId ?? null,
                extension_request_id: input.extensionRequestId ?? null,
                handover_request_id: input.handoverRequestId ?? null,
                from_value: input.fromValue ?? null,
                to_value: input.toValue ?? null,
                metadata: input.metadata ?? {},
                is_milestone: input.isMilestone,
                occurred_at: new Date(),
            },
        });
    }
}
