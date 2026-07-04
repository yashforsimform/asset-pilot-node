import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../common/errors/app-error';
import { sendSuccess } from '../../common/utils/api-response';
import type {
    CreateExtensionRequestBody,
    CreateHandoverRequestBody,
    CreateSupportRequestBody,
    ListHandoverRequestsQuery,
    ReturnDeviceBody,
    SupportRequestsQuery,
} from './mobile.dto';
import type { MobileService } from './mobile.service';

type IdParams = {
    id: string;
};

type ItemIdParams = {
    itemId: string;
};

const getUserId = (req: { user?: { id: string } }): string => {
    if (!req.user?.id) {
        throw new UnauthorizedError();
    }

    return req.user.id;
};

export class MobileController {
    public constructor(private readonly mobileService: MobileService) {}

    public listMyDevices = async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.listMyDevices(getUserId(req));
        sendSuccess(res, 200, data, 'Devices fetched successfully');
    };

    public getDeviceDetail = async (
        req: Request<ItemIdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.getDeviceDetail(
            req.params.itemId,
        );
        sendSuccess(res, 200, data, 'Device detail fetched successfully');
    };

    public createExtensionRequest = async (
        req: Request<ItemIdParams, unknown, CreateExtensionRequestBody>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.createExtensionRequest(
            getUserId(req),
            req.params.itemId,
            req.body.extended_to,
        );
        sendSuccess(res, 201, data, 'Extension request created successfully');
    };

    public listExtensionRequests = async (
        req: Request<ItemIdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.listExtensionRequests(
            getUserId(req),
            req.params.itemId,
        );
        sendSuccess(res, 200, data, 'Extension requests fetched successfully');
    };

    public getExtensionRequestDetail = async (
        req: Request<IdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.getExtensionRequestDetail(
            getUserId(req),
            req.params.id,
        );
        sendSuccess(
            res,
            200,
            data,
            'Extension request detail fetched successfully',
        );
    };

    public initiateReturn = async (
        req: Request<ItemIdParams, unknown, ReturnDeviceBody>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.initiateReturn(
            getUserId(req),
            req.params.itemId,
            req.body,
        );
        sendSuccess(res, 200, data, 'Return initiated successfully');
    };

    public createSupportRequest = async (
        req: Request<ItemIdParams, unknown, CreateSupportRequestBody>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.createSupportRequest(
            getUserId(req),
            req.params.itemId,
            req.body,
        );
        sendSuccess(res, 201, data, 'Support request created successfully');
    };

    public listSupportRequests = async (
        req: Request<unknown, unknown, unknown, SupportRequestsQuery>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.listSupportRequests(
            getUserId(req),
            req.query.status,
        );
        sendSuccess(res, 200, data, 'Support requests fetched successfully');
    };

    public getSupportRequestDetail = async (
        req: Request<IdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.getSupportRequestDetail(
            getUserId(req),
            req.params.id,
        );
        sendSuccess(
            res,
            200,
            data,
            'Support request detail fetched successfully',
        );
    };

    public createHandoverRequest = async (
        req: Request<unknown, unknown, CreateHandoverRequestBody>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.createHandoverRequest(
            getUserId(req),
            req.body,
        );
        sendSuccess(res, 201, data, 'Handover request created successfully');
    };

    public listHandoverRequests = async (
        req: Request<unknown, unknown, unknown, ListHandoverRequestsQuery>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.listHandoverRequests(
            getUserId(req),
            req.query.as,
        );
        sendSuccess(res, 200, data, 'Handover requests fetched successfully');
    };

    public acceptHandoverRequest = async (
        req: Request<IdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.acceptHandoverRequest(
            getUserId(req),
            req.params.id,
        );
        sendSuccess(res, 200, data, 'Handover request accepted successfully');
    };

    public rejectHandoverRequest = async (
        req: Request<IdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.rejectHandoverRequest(
            getUserId(req),
            req.params.id,
        );
        sendSuccess(res, 200, data, 'Handover request rejected successfully');
    };

    public cancelHandoverRequest = async (
        req: Request<IdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.cancelHandoverRequest(
            getUserId(req),
            req.params.id,
        );
        sendSuccess(res, 200, data, 'Handover request cancelled successfully');
    };

    public completeHandoverRequest = async (
        req: Request<IdParams>,
        res: Response,
    ): Promise<void> => {
        const data = await this.mobileService.completeHandoverRequest(
            getUserId(req),
            req.params.id,
        );
        sendSuccess(res, 200, data, 'Handover request completed successfully');
    };
}
