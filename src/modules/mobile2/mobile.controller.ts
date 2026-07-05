import type { Request, Response } from 'express';
import {
    buildErrorResponse,
    buildSuccessResponse,
} from '../../common/api-response';
import { AppError } from '../../common/errors/app-error';
import type {
    ApproveRequestDto,
    CreateExtensionRequestDto,
    CreateHandoverRequestDto,
    CreateRequestDto,
    CreateSupportRequestDto,
    EntityIdParams,
    HandoverRequestsQuery,
    ItemIdParams,
    RejectRequestDto,
    RequestIdParams,
    ReturnDeviceDto,
    SupportRequestsQuery,
} from './mobile.dto';
import {
    acceptHandoverRequest,
    approveRequest,
    cancelHandoverRequest,
    cancelRequestByUserId,
    completeHandoverRequest,
    completeNonWfhReturnService,
    createExtensionRequest,
    createHandoverRequest,
    createRequest,
    createSupportRequest,
    getApprovalsForManager,
    getDeviceDetail,
    getDeviceDetailsService,
    getExtensionRequestDetail,
    getItemCategoryService,
    getMyDevices,
    getMyRequestByUserId,
    getMyRequests,
    getSupportRequestDetail,
    getUserService,
    initiateReturn,
    listExtensionRequests,
    listEmployeeDevicesForManager,
    listHandoverRequests,
    listSupportRequests,
    rejectHandoverRequest,
    rejectRequest,
} from './mobile.service';

function getAuthenticatedUserId(req: { user?: { id: string } }): string {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError(
            'Authenticated user not found',
            401,
            'authenticated_user_not_found',
        );
    }

    return userId;
}

export function getHealth(_req: Request, res: Response): void {
    res.json(buildSuccessResponse({ status: 'ok' }, 'Server is healthy'));
}

export async function login(req: Request, res: Response) {
    const user = await getUserService(req.body.email);
    if (!user) {
        res.json(buildErrorResponse('User not found', 404, '404'));
    } else res.json(buildSuccessResponse(user, 'User loggedin'));
}

export async function getItemCategory(req: Request, res: Response) {
    const categories = await getItemCategoryService();
    res.json(buildSuccessResponse(categories, 'Fetched item category'));
}

export async function listMyDevices(
    req: Request,
    res: Response,
): Promise<void> {
    const devices = await getMyDevices(getAuthenticatedUserId(req));
    res.json(buildSuccessResponse(devices, 'Fetched assigned devices'));
}

export async function listMyRequests(
    req: Request,
    res: Response,
): Promise<void> {
    const requests = await getMyRequests(getAuthenticatedUserId(req));
    res.json(buildSuccessResponse(requests, 'My devices fetched successfully'));
}

export async function getMyRequest(req: Request, res: Response) {
    const detail = await getMyRequestByUserId(getAuthenticatedUserId(req));
    res.json(
        buildSuccessResponse(detail, 'List of request fetched successfully.'),
    );
}

export async function getMyDeviceDetail(
    req: Request<ItemIdParams>,
    res: Response,
): Promise<void> {
    const detail = await getDeviceDetail(
        getAuthenticatedUserId(req),
        req.params.itemId,
    );
    res.json(
        buildSuccessResponse(detail, 'Device detail fetched successfully'),
    );
}

export async function submitRequest(
    req: Request<Record<string, never>, unknown, CreateRequestDto>,
    res: Response,
): Promise<void> {
    const request = await createRequest(getAuthenticatedUserId(req), req.body);
    res.status(201).json(
        buildSuccessResponse(request, 'Request created successfully', 201),
    );
}

export async function listManagerApprovals(
    req: Request,
    res: Response,
): Promise<void> {
    const approvals = await getApprovalsForManager(getAuthenticatedUserId(req));
    res.json(
        buildSuccessResponse(
            approvals,
            'Manager approvals fetched successfully',
        ),
    );
}

export async function cancelRequest(
    req: Request<RequestIdParams>,
    res: Response,
) {
    const updated = await cancelRequestByUserId(
        getAuthenticatedUserId(req),
        req.params.requestId,
    );
    res.json(buildSuccessResponse(updated, 'Request cancelled'));
}

export async function approveManagerRequest(
    req: Request<RequestIdParams, unknown, ApproveRequestDto>,
    res: Response,
): Promise<void> {
    const updated = await approveRequest(
        getAuthenticatedUserId(req),
        req.params.requestId,
        req.body,
    );
    res.json(buildSuccessResponse(updated, 'Request approved successfully'));
}

export async function rejectManagerRequest(
    req: Request<RequestIdParams, unknown, RejectRequestDto>,
    res: Response,
): Promise<void> {
    const updated = await rejectRequest(
        getAuthenticatedUserId(req),
        req.params.requestId,
        req.body,
    );
    res.json(buildSuccessResponse(updated, 'Request rejected successfully'));
}

export async function submitExtensionRequest(
    req: Request<ItemIdParams, unknown, CreateExtensionRequestDto>,
    res: Response,
): Promise<void> {
    const extensionRequest = await createExtensionRequest(
        getAuthenticatedUserId(req),
        req.params.itemId,
        req.body,
    );
    res.status(201).json(
        buildSuccessResponse(
            extensionRequest,
            'Extension request created successfully',
            201,
        ),
    );
}

export async function listDeviceExtensionRequests(
    req: Request<ItemIdParams>,
    res: Response,
): Promise<void> {
    const extensionRequests = await listExtensionRequests(
        getAuthenticatedUserId(req),
        req.params.itemId,
    );
    res.json(
        buildSuccessResponse(
            extensionRequests,
            'Extension requests fetched successfully',
        ),
    );
}

export async function listEmployeeDevicesByManagerID(
    req: Request,
    res: Response,
): Promise<void> {
    const employeeDevices = await listEmployeeDevicesForManager(
        getAuthenticatedUserId(req),
    );
    res.json(
        buildSuccessResponse(
            employeeDevices,
            'Employee devices fetched successfully',
        ),
    );
}
export async function getMyExtensionRequestDetail(
    req: Request<EntityIdParams>,
    res: Response,
): Promise<void> {
    const extensionRequest = await getExtensionRequestDetail(
        getAuthenticatedUserId(req),
        req.params.id,
    );
    res.json(
        buildSuccessResponse(
            extensionRequest,
            'Extension request detail fetched successfully',
        ),
    );
}

export async function initiateDeviceReturn(
    req: Request<ItemIdParams, unknown, ReturnDeviceDto>,
    res: Response,
): Promise<void> {
    const result = await initiateReturn(
        getAuthenticatedUserId(req),
        req.params.itemId,
        req.body,
    );
    res.json(buildSuccessResponse(result, 'Return initiated successfully'));
}

export async function completeNonWfhDeviceReturn(
    req: Request<ItemIdParams>,
    res: Response,
): Promise<void> {
    const result = await completeNonWfhReturnService(
        getAuthenticatedUserId(req),
        req.params.itemId,
    );
    res.json(buildSuccessResponse(result, 'Device returned successfully'));
}

export async function submitSupportRequest(
    req: Request<ItemIdParams, unknown, CreateSupportRequestDto>,
    res: Response,
): Promise<void> {
    const supportRequest = await createSupportRequest(
        getAuthenticatedUserId(req),
        req.params.itemId,
        req.body,
    );
    res.status(201).json(
        buildSuccessResponse(
            supportRequest,
            'Support request created successfully',
            201,
        ),
    );
}

export async function listMySupportRequests(
    req: Request<unknown, unknown, unknown, SupportRequestsQuery>,
    res: Response,
): Promise<void> {
    const supportRequests = await listSupportRequests(
        getAuthenticatedUserId(req),
        req.query,
    );
    res.json(
        buildSuccessResponse(
            supportRequests,
            'Support requests fetched successfully',
        ),
    );
}

export async function getMySupportRequestDetail(
    req: Request<EntityIdParams>,
    res: Response,
): Promise<void> {
    const supportRequest = await getSupportRequestDetail(
        getAuthenticatedUserId(req),
        req.params.id,
    );
    res.json(
        buildSuccessResponse(
            supportRequest,
            'Support request detail fetched successfully',
        ),
    );
}

export async function submitHandoverRequest(
    req: Request<unknown, unknown, CreateHandoverRequestDto>,
    res: Response,
): Promise<void> {
    const handoverRequest = await createHandoverRequest(
        getAuthenticatedUserId(req),
        req.body,
    );
    res.status(201).json(
        buildSuccessResponse(
            handoverRequest,
            'Handover request created successfully',
            201,
        ),
    );
}

export async function deviceDetailsFromId(
    req: Request<ItemIdParams>,
    res: Response,
) {
    const details = await getDeviceDetailsService(req.params.itemId);
    res.json(buildSuccessResponse(details, 'Device details fetched'));
}

export async function listMyHandoverRequests(
    req: Request<unknown, unknown, unknown, HandoverRequestsQuery>,
    res: Response,
): Promise<void> {
    const handoverRequests = await listHandoverRequests(
        getAuthenticatedUserId(req),
        req.query,
    );
    res.json(
        buildSuccessResponse(
            handoverRequests,
            'Handover requests fetched successfully',
        ),
    );
}

export async function acceptMyHandoverRequest(
    req: Request<EntityIdParams>,
    res: Response,
): Promise<void> {
    const handoverRequest = await acceptHandoverRequest(
        getAuthenticatedUserId(req),
        req.params.id,
    );
    res.json(
        buildSuccessResponse(
            handoverRequest,
            'Handover request accepted successfully',
        ),
    );
}

export async function rejectMyHandoverRequest(
    req: Request<EntityIdParams>,
    res: Response,
): Promise<void> {
    const handoverRequest = await rejectHandoverRequest(
        getAuthenticatedUserId(req),
        req.params.id,
    );
    res.json(
        buildSuccessResponse(
            handoverRequest,
            'Handover request rejected successfully',
        ),
    );
}

export async function cancelMyHandoverRequest(
    req: Request<EntityIdParams>,
    res: Response,
): Promise<void> {
    const handoverRequest = await cancelHandoverRequest(
        getAuthenticatedUserId(req),
        req.params.id,
    );
    res.json(
        buildSuccessResponse(
            handoverRequest,
            'Handover request cancelled successfully',
        ),
    );
}

export async function completeMyHandoverRequest(
    req: Request<EntityIdParams>,
    res: Response,
): Promise<void> {
    const handoverRequest = await completeHandoverRequest(
        getAuthenticatedUserId(req),
        req.params.id,
    );
    res.json(
        buildSuccessResponse(
            handoverRequest,
            'Handover request completed successfully',
        ),
    );
}
