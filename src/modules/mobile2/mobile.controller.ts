import type { Request, Response } from 'express';
import { buildSuccessResponse } from '../../common/api-response';
import { AppError } from '../../common/errors/app-error';
import type {
    ApproveRequestDto,
    CreateRequestDto,
    ItemIdParams,
    RejectRequestDto,
    RequestIdParams,
} from './mobile.dto';
import {
    approveRequest,
    createRequest,
    getApprovalsForManager,
    getDeviceDetail,
    getMyDevices,
    rejectRequest,
} from './mobile.service';

function getAuthenticatedUserId(req: Request): string {
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

export async function listMyDevices(
    req: Request,
    res: Response,
): Promise<void> {
    const requests = await getMyDevices(getAuthenticatedUserId(req));
    res.json(buildSuccessResponse(requests, 'My devices fetched successfully'));
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
