import { Router } from 'express';
import { asyncHandler } from '../../middlewares/async-handler';
import { validateRequest } from '../../middlewares/validate';
import {
    createExtensionRequestBodySchema,
    createHandoverRequestBodySchema,
    createSupportRequestBodySchema,
    itemIdParamSchema,
    listHandoverRequestsQuerySchema,
    returnDeviceBodySchema,
    supportRequestsQuerySchema,
    uuidParamSchema,
} from './mobile.dto';
import { MobileController } from './mobile.controller';
import { MobileRepository } from './mobile.repository';
import { MobileService } from './mobile.service';

const mobileRepository = new MobileRepository();
const mobileService = new MobileService(mobileRepository);
const mobileController = new MobileController(mobileService);

export const mobileRouter = Router();

mobileRouter.get('/me/devices', asyncHandler(mobileController.listMyDevices));
mobileRouter.get(
    '/me/devices/:itemId',
    validateRequest({ params: itemIdParamSchema }),
    asyncHandler(mobileController.getDeviceDetail),
);

mobileRouter.post(
    '/me/devices/:itemId/extension-requests',
    validateRequest({
        params: itemIdParamSchema,
        body: createExtensionRequestBodySchema,
    }),
    asyncHandler(mobileController.createExtensionRequest),
);
mobileRouter.get(
    '/me/devices/:itemId/extension-requests',
    validateRequest({ params: itemIdParamSchema }),
    asyncHandler(mobileController.listExtensionRequests),
);
mobileRouter.get(
    '/me/extension-requests/:id',
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(mobileController.getExtensionRequestDetail),
);

mobileRouter.post(
    '/me/devices/:itemId/return',
    validateRequest({
        params: itemIdParamSchema,
        body: returnDeviceBodySchema,
    }),
    asyncHandler(mobileController.initiateReturn),
);

mobileRouter.post(
    '/me/devices/:itemId/support-requests',
    validateRequest({
        params: itemIdParamSchema,
        body: createSupportRequestBodySchema,
    }),
    asyncHandler(mobileController.createSupportRequest),
);
mobileRouter.get(
    '/me/support-requests',
    validateRequest({ query: supportRequestsQuerySchema }),
    asyncHandler(mobileController.listSupportRequests),
);
mobileRouter.get(
    '/me/support-requests/:id',
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(mobileController.getSupportRequestDetail),
);

mobileRouter.post(
    '/me/handover-requests',
    validateRequest({ body: createHandoverRequestBodySchema }),
    asyncHandler(mobileController.createHandoverRequest),
);
mobileRouter.get(
    '/me/handover-requests',
    validateRequest({ query: listHandoverRequestsQuerySchema }),
    asyncHandler(mobileController.listHandoverRequests),
);
mobileRouter.patch(
    '/me/handover-requests/:id/accept',
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(mobileController.acceptHandoverRequest),
);
mobileRouter.patch(
    '/me/handover-requests/:id/reject',
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(mobileController.rejectHandoverRequest),
);
mobileRouter.patch(
    '/me/handover-requests/:id/cancel',
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(mobileController.cancelHandoverRequest),
);
mobileRouter.patch(
    '/me/handover-requests/:id/complete',
    validateRequest({ params: uuidParamSchema }),
    asyncHandler(mobileController.completeHandoverRequest),
);
