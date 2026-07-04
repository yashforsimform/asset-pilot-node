import type {
    HandoverRequest,
    ItemCategory,
    Request,
    SupportStatus,
    User,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import type {
    ApproveRequestDto,
    CreateExtensionRequestDto,
    CreateHandoverRequestDto,
    CreateRequestDto,
    CreateSupportRequestDto,
    HandoverRequestsQuery,
    RejectRequestDto,
    ReturnDeviceDto,
    SupportRequestsQuery,
} from './mobile.dto';
import {
    acceptHandoverForOwner,
    approveRequestByManager,
    cancelHandoverForBorrower,
    completeHandoverForOwner,
    createAssetRequest,
    createExtensionRequestForDevice,
    createHandoverForItem,
    createSupportRequestForDevice,
    findAssignmentForRequester,
    findCategoryById,
    findExtensionRequestDetail,
    findExtensionRequestsForDevice,
    findHandoverRequestsForUser,
    findHandoversByItem,
    findItemLookupById,
    findManagerApprovals,
    findMyRequestByUserId,
    findRequestById,
    findRequestsByRequester,
    findSupportRequestDetail,
    findSupportRequestsByRequester,
    findUserByEmail,
    findUserById,
    getItemCategoryRepo,
    getMyDevicesByUserId,
    initiateWfhReturn,
    rejectHandoverForOwner,
    rejectRequestByManager,
    type ExtensionRequestSummary,
    type HandoverRequestWithItem,
    type ItemLookup,
    type ManagerApprovalRequest,
    type RequestWithCategoryAndItem,
    type SupportRequestWithItem,
} from './mobile.repository';

export interface DeviceDetail {
    request: RequestWithCategoryAndItem | null;
    item: ItemLookup | null;
    handoverRequests: HandoverRequest[];
}

function parseDateRange(
    requestedFromValue: string,
    requestedToValue: string,
): { requestedFrom: Date; requestedTo: Date } {
    const requestedFrom = new Date(requestedFromValue);
    const requestedTo = new Date(requestedToValue);

    if (
        Number.isNaN(requestedFrom.getTime()) ||
        Number.isNaN(requestedTo.getTime()) ||
        requestedTo <= requestedFrom
    ) {
        throw new AppError(
            'requestedFrom must be before requestedTo',
            400,
            'validation_error',
        );
    }

    return { requestedFrom, requestedTo };
}

function assertManagerCanDecide(request: Request, managerId: string): void {
    if (
        request.managerId !== managerId ||
        request.requiresMgrApproval !== true ||
        request.mgrApprovalStatus !== 'pending' ||
        request.status !== 'pending_mgr_approval'
    ) {
        throw new AppError(
            'Request is not pending manager approval for this manager',
            400,
            'invalid_request_state',
        );
    }
}

function mapWorkflowError(error: unknown): never {
    if (!(error instanceof Error)) {
        throw error;
    }

    const mapped: Record<string, AppError> = {
        ACTIVE_ASSIGNMENT_NOT_FOUND: new AppError(
            'Active assigned request not found',
            404,
            'active_assignment_not_found',
        ),
        RETURN_REQUIRES_IT: new AppError(
            'Return for this device must be initiated by IT.',
            400,
            'return_requires_it',
        ),
        DEVICE_NOT_ASSIGNED: new AppError(
            'Device is not in assigned status',
            409,
            'device_not_assigned',
        ),
        OWNED_ITEM_NOT_FOUND: new AppError(
            'Assigned device not found for current user',
            404,
            'assigned_device_not_found',
        ),
        HANDOVER_ITEM_NOT_AVAILABLE: new AppError(
            'Device is not assigned, handover not possible',
            400,
            'handover_item_not_available',
        ),
        CANNOT_HANDOVER_OWN_DEVICE: new AppError(
            "You can't request your own device",
            400,
            'cannot_handover_own_device',
        ),
        HANDOVER_NOT_FOUND: new AppError(
            'Handover request not found in required state',
            404,
            'handover_request_not_found',
        ),
        ACTIVE_HANDOVER_EXISTS: new AppError(
            'Another accepted handover already exists for this device',
            409,
            'active_handover_exists',
        ),
    };

    throw mapped[error.message] ?? error;
}

export async function getUserService(email: string) {
    return await findUserByEmail(email);
}

export async function getMyRequestByUserId(userId: string) {
    const user = await findUserById(userId);
    if (!user) {
        throw new AppError(
            'Authenticated user not found',
            401,
            'authenticated_user_not_found',
        );
    }
    return findMyRequestByUserId(userId);
}

export async function getCurrentUser(userId: string): Promise<User> {
    const user = await findUserById(userId);

    if (!user) {
        throw new AppError(
            'Authenticated user not found',
            401,
            'authenticated_user_not_found',
        );
    }

    return user;
}

export async function getItemCategoryService() {
    return getItemCategoryRepo();
}

export async function getMyRequests(
    userId: string,
): Promise<RequestWithCategoryAndItem[]> {
    const user = await getCurrentUser(userId);
    if (!user) {
        throw new AppError(
            'Authenticated user not found',
            401,
            'authenticated_user_not_found',
        );
    }
    return findRequestsByRequester(user.id);
}

export async function getMyDevices(userId: string) {
    const user = await getCurrentUser(userId);
    if (!user) {
        throw new AppError(
            'Authenticated user not found',
            401,
            'authenticated_user_not_found',
        );
    }
    const response = await getMyDevicesByUserId(userId);
    const data = response.map((req) => {
        const { assignedItem, ...re } = req;
        return {
            ...assignedItem,
            ...re,
        };
    });
    return data;
}

export async function getDeviceDetail(
    userId: string,
    itemId: string,
): Promise<DeviceDetail> {
    await getCurrentUser(userId);
    const request = await findAssignmentForRequester(userId, itemId);
    const item =
        request?.assignedItem === null || request?.assignedItem === undefined
            ? await findItemLookupById(itemId)
            : await findItemLookupById(itemId);

    if (!item) {
        throw new AppError('Device not found', 404, 'device_not_found');
    }

    if (!request && !item.currentOwnerId) {
        throw new AppError(
            'Device is not assigned, handover not possible',
            400,
            'handover_item_not_available',
        );
    }

    const handoverRequests = await findHandoversByItem(itemId);
    return { request, item, handoverRequests };
}

export async function createRequest(
    userId: string,
    dto: CreateRequestDto,
): Promise<RequestWithCategoryAndItem> {
    const user = await getCurrentUser(userId);
    const category: ItemCategory | null = await findCategoryById(
        dto.categoryId,
    );

    if (!category) {
        throw new AppError('Category not found', 404, 'category_not_found');
    }

    const { requestedFrom, requestedTo } = parseDateRange(
        dto.requestedFrom,
        dto.requestedTo,
    );

    return createAssetRequest({
        requesterId: user.id,
        managerId: user.managerId ?? null,
        categoryId: category.id,
        requestedFrom,
        requestedTo,
        priority: dto.priority ?? 'medium',
        note: dto.note ?? null,
        isWfh: dto.isWfh ?? false,
        requiresMgrApproval: category.requiresMgrApproval,
        mgrApprovalStatus: category.requiresMgrApproval
            ? 'pending'
            : 'not_required',
        status: category.requiresMgrApproval
            ? 'pending_mgr_approval'
            : 'pending_it_approval',
    });
}

export async function getApprovalsForManager(
    userId: string,
): Promise<ManagerApprovalRequest[]> {
    const user = await getCurrentUser(userId);
    return findManagerApprovals(user.id);
}

export async function approveRequest(
    userId: string,
    requestId: string,
    dto: ApproveRequestDto,
): Promise<ManagerApprovalRequest> {
    const user = await getCurrentUser(userId);
    const request = await findRequestById(requestId);

    if (!request) {
        throw new AppError('Request not found', 404, 'request_not_found');
    }

    assertManagerCanDecide(request, user.id);
    return approveRequestByManager(request.id, dto.managerDecisionNote ?? null);
}

export async function rejectRequest(
    userId: string,
    requestId: string,
    dto: RejectRequestDto,
): Promise<ManagerApprovalRequest> {
    const user = await getCurrentUser(userId);
    const request = await findRequestById(requestId);

    if (!request) {
        throw new AppError('Request not found', 404, 'request_not_found');
    }

    assertManagerCanDecide(request, user.id);
    return rejectRequestByManager(
        request.id,
        dto.managerDecisionNote ?? null,
        dto.rejectedReason ?? null,
    );
}

export async function createExtensionRequest(
    userId: string,
    itemId: string,
    dto: CreateExtensionRequestDto,
): Promise<unknown> {
    try {
        const activeRequest = await findAssignmentForRequester(userId, itemId);

        if (!activeRequest?.assignedTo) {
            throw new Error('ACTIVE_ASSIGNMENT_NOT_FOUND');
        }

        if (dto.extended_to <= activeRequest.assignedTo) {
            throw new AppError(
                'extended_to must be greater than the current assigned_to date',
                400,
                'invalid_extension_date',
            );
        }

        return await createExtensionRequestForDevice(
            userId,
            itemId,
            dto.extended_to,
        );
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function listExtensionRequests(
    userId: string,
    itemId: string,
): Promise<unknown[]> {
    await getCurrentUser(userId);
    return findExtensionRequestsForDevice(userId, itemId);
}

export async function getExtensionRequestDetail(
    userId: string,
    id: string,
): Promise<ExtensionRequestSummary> {
    await getCurrentUser(userId);
    const extensionRequest = await findExtensionRequestDetail(userId, id);

    if (!extensionRequest) {
        throw new AppError(
            'Extension request not found',
            404,
            'extension_request_not_found',
        );
    }

    return extensionRequest;
}

export async function initiateReturn(
    userId: string,
    itemId: string,
    dto: ReturnDeviceDto,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await initiateWfhReturn(userId, itemId, dto.return_tracking_url);
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function createSupportRequest(
    userId: string,
    itemId: string,
    dto: CreateSupportRequestDto,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await createSupportRequestForDevice(
            userId,
            itemId,
            dto.type,
            dto.description,
        );
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function listSupportRequests(
    userId: string,
    query: SupportRequestsQuery,
): Promise<SupportRequestWithItem[]> {
    await getCurrentUser(userId);
    return findSupportRequestsByRequester(
        userId,
        query.status as SupportStatus | undefined,
    );
}

export async function getSupportRequestDetail(
    userId: string,
    id: string,
): Promise<SupportRequestWithItem> {
    await getCurrentUser(userId);
    const supportRequest = await findSupportRequestDetail(userId, id);

    if (!supportRequest) {
        throw new AppError(
            'Support request not found',
            404,
            'support_request_not_found',
        );
    }

    return supportRequest;
}

export async function createHandoverRequest(
    userId: string,
    dto: CreateHandoverRequestDto,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await createHandoverForItem(
            userId,
            dto.item_id,
            dto.requested_duration_hours,
        );
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function listHandoverRequests(
    userId: string,
    query: HandoverRequestsQuery,
): Promise<HandoverRequestWithItem[]> {
    await getCurrentUser(userId);
    return findHandoverRequestsForUser(userId, query.as);
}

export async function acceptHandoverRequest(
    userId: string,
    id: string,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await acceptHandoverForOwner(userId, id);
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function rejectHandoverRequest(
    userId: string,
    id: string,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await rejectHandoverForOwner(userId, id);
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function cancelHandoverRequest(
    userId: string,
    id: string,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await cancelHandoverForBorrower(userId, id);
    } catch (error) {
        mapWorkflowError(error);
    }
}

export async function completeHandoverRequest(
    userId: string,
    id: string,
): Promise<unknown> {
    try {
        await getCurrentUser(userId);
        return await completeHandoverForOwner(userId, id);
    } catch (error) {
        mapWorkflowError(error);
    }
}
