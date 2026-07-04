import { Router } from "express";
import {
  approveManagerRequest,
  getHealth,
  getMyDeviceDetail,
  listManagerApprovals,
  listMyDevices,
  rejectManagerRequest,
  submitRequest,
} from "./mobile.controller";
import {
  approveRequestSchema,
  createRequestSchema,
  itemIdParamsSchema,
  rejectRequestSchema,
  requestIdParamsSchema,
} from "./mobile.dto";
import { validateBody, validateParams } from "../../middlewares/validate-request.middleware";

const router = Router();

router.get("/health", getHealth);
router.get("/me/devices", listMyDevices);
router.get("/me/devices/:itemId", validateParams(itemIdParamsSchema), getMyDeviceDetail);
router.post("/me/requests", validateBody(createRequestSchema), submitRequest);
router.get("/manager/approvals", listManagerApprovals);
router.patch(
  "/manager/requests/:requestId/approve",
  validateParams(requestIdParamsSchema),
  validateBody(approveRequestSchema),
  approveManagerRequest,
);
router.patch(
  "/manager/requests/:requestId/reject",
  validateParams(requestIdParamsSchema),
  validateBody(rejectRequestSchema),
  rejectManagerRequest,
);

export default router;
