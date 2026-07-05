import { Router } from 'express';
import {
    acceptMyHandoverRequest,
    approveManagerRequest,
    cancelMyHandoverRequest,
    completeMyHandoverRequest,
    getHealth,
    getMyExtensionRequestDetail,
    getMyDeviceDetail,
    getMySupportRequestDetail,
    initiateDeviceReturn,
    listDeviceExtensionRequests,
    listMyHandoverRequests,
    listManagerApprovals,
    listMyDevices,
    listMySupportRequests,
    rejectMyHandoverRequest,
    rejectManagerRequest,
    submitExtensionRequest,
    submitHandoverRequest,
    submitRequest,
    submitSupportRequest,
    getMyRequest,
    listMyRequests,
    getItemCategory,
    login,
    deviceDetailsFromId,
    listEmployeeDevicesByManagerID,
} from './mobile.controller';
import {
    approveRequestSchema,
    createExtensionRequestSchema,
    createHandoverRequestSchema,
    createRequestSchema,
    createSupportRequestSchema,
    extensionRequestIdParamsSchema,
    handoverRequestIdParamsSchema,
    handoverRequestsQuerySchema,
    itemIdParamsSchema,
    rejectRequestSchema,
    requestIdParamsSchema,
    returnDeviceSchema,
    supportRequestIdParamsSchema,
    supportRequestsQuerySchema,
} from './mobile.dto';
import {
    validateBody,
    validateParams,
    validateQuery,
} from '../../middlewares/validate-request.middleware';

const router = Router();

router.get('/health', getHealth);

router.post('/login', login);

router.get('/items-category', getItemCategory);
router.get('/me/requests', listMyRequests);
router.get('/me/devices', listMyDevices);
// router.get('/me/assigned-devices', listMyDevices)
router.get(
    '/me/devices/:itemId',
    validateParams(itemIdParamsSchema),
    getMyDeviceDetail,
);
router.post('/me/requests', validateBody(createRequestSchema), submitRequest);
// router.get(
//     '/me/request',
//     //   validateBody({ query: listMyRequestsQuerySchema }),
//     getMyRequest,
// );

router.get('/manager/approvals', listManagerApprovals);
router.patch(
    '/manager/requests/:requestId/approve',
    validateParams(requestIdParamsSchema),
    validateBody(approveRequestSchema),
    approveManagerRequest,
);
router.patch(
    '/manager/requests/:requestId/reject',
    validateParams(requestIdParamsSchema),
    validateBody(rejectRequestSchema),
    rejectManagerRequest,
);
router.post(
    '/me/devices/:itemId/extension-requests',
    validateParams(itemIdParamsSchema),
    validateBody(createExtensionRequestSchema),
    submitExtensionRequest,
);
router.get(
    '/me/devices/:itemId/extension-requests',
    validateParams(itemIdParamsSchema),
    listDeviceExtensionRequests,
);

router.get('/manager/employee-devices', listEmployeeDevicesByManagerID);
router.get(
    '/me/extension-requests/:id',
    validateParams(extensionRequestIdParamsSchema),
    getMyExtensionRequestDetail,
);
router.post(
    '/me/devices/:itemId/return',
    validateParams(itemIdParamsSchema),
    validateBody(returnDeviceSchema),
    initiateDeviceReturn,
);
router.post(
    '/me/devices/:itemId/support-requests',
    validateParams(itemIdParamsSchema),
    validateBody(createSupportRequestSchema),
    submitSupportRequest,
);
router.get(
    '/me/support-requests',
    validateQuery(supportRequestsQuerySchema),
    listMySupportRequests,
);
router.get(
    '/me/support-requests/:id',
    validateParams(supportRequestIdParamsSchema),
    getMySupportRequestDetail,
);
router.get(
    '/borrower/device-details/:itemId',
    validateParams(itemIdParamsSchema),
    deviceDetailsFromId,
);
router.post(
    '/me/handover-requests',
    validateBody(createHandoverRequestSchema),
    submitHandoverRequest,
);
router.get(
    '/me/handover-requests',
    validateQuery(handoverRequestsQuerySchema),
    listMyHandoverRequests,
);
router.patch(
    '/me/handover-requests/:id/accept',
    validateParams(handoverRequestIdParamsSchema),
    acceptMyHandoverRequest,
);
router.patch(
    '/me/handover-requests/:id/reject',
    validateParams(handoverRequestIdParamsSchema),
    rejectMyHandoverRequest,
);
router.patch(
    '/me/handover-requests/:id/cancel',
    validateParams(handoverRequestIdParamsSchema),
    cancelMyHandoverRequest,
);
router.patch(
    '/me/handover-requests/:id/complete',
    validateParams(handoverRequestIdParamsSchema),
    completeMyHandoverRequest,
);

export default router;
