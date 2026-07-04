import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = Router();

const createRequestSchema = z.object({
  categoryId: z.string().uuid(),
  requestedFrom: z.string(),
  requestedTo: z.string(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  note: z.string().optional(),
  isWfh: z.boolean().optional(),
});

function buildSuccessResponse<T>(data: T, message = "Success", statusCode = 200) {
  return {
    status_code: statusCode,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
    },
    success: true,
  };
}

function buildErrorResponse(message: string, statusCode = 400, details?: unknown[]) {
  return {
    status_code: statusCode,
    message,
    error: {
      code: "validation_error",
      message,
      details: details ?? [],
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
    },
    success: false,
  };
}

async function getCurrentUser(req: Request) {
  const userId = req.user?.id ?? "11111111-1111-1111-1111-111111111111";
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("Authenticated user not found");
  }

  return user;
}

router.get("/health", (_req, res) => {
  res.json(buildSuccessResponse({ status: "ok" }, "Server is healthy"));
});

router.get("/me/devices", async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const requests = await prisma.request.findMany({
      where: { requesterId: user.id },
      include: {
        category: true,
        assignedItem: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(buildSuccessResponse(requests, "My devices fetched successfully"));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error instanceof Error ? error.message : "Unable to fetch devices", 500));
  }
});

router.get("/me/devices/:itemId", async (req: Request, res: Response) => {
  try {
    const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;

    if (!itemId) {
      res.status(400).json(buildErrorResponse("Item id is required", 400));
      return;
    }

    const user = await getCurrentUser(req);
    const request = await prisma.request.findFirst({
      where: {
        requesterId: user.id,
        assignedItemId: itemId,
      },
      include: {
        category: true,
        assignedItem: true,
      },
    });

    if (!request) {
      res.status(404).json(buildErrorResponse("No matching device assignment found", 404));
      return;
    }

    const handoverRequests = await prisma.handoverRequest.findMany({
      where: { itemId },
      orderBy: { createdAt: "desc" },
    });

    res.json(buildSuccessResponse({ request, handoverRequests }, "Device detail fetched successfully"));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error instanceof Error ? error.message : "Unable to fetch device detail", 500));
  }
});

router.post("/me/requests", async (req: Request, res: Response) => {
  try {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(buildErrorResponse("Invalid request payload", 400, parsed.error.issues));
      return;
    }

    const user = await getCurrentUser(req);
    const category = await prisma.itemCategory.findUnique({ where: { id: parsed.data.categoryId } });

    if (!category) {
      res.status(404).json(buildErrorResponse("Category not found", 404));
      return;
    }

    const requestedFrom = new Date(parsed.data.requestedFrom);
    const requestedTo = new Date(parsed.data.requestedTo);

    if (Number.isNaN(requestedFrom.getTime()) || Number.isNaN(requestedTo.getTime()) || requestedTo <= requestedFrom) {
      res.status(400).json(buildErrorResponse("requestedFrom must be before requestedTo", 400));
      return;
    }

    const request = await prisma.request.create({
      data: {
        requesterId: user.id,
        managerId: user.managerId ?? null,
        categoryId: category.id,
        requestedFrom,
        requestedTo,
        priority: (parsed.data.priority ?? "medium") as "low" | "medium" | "high",
        note: parsed.data.note ?? null,
        isWfh: parsed.data.isWfh ?? false,
        requiresMgrApproval: category.requiresMgrApproval,
        mgrApprovalStatus: category.requiresMgrApproval ? "pending" : "not_required",
        status: category.requiresMgrApproval ? "pending_mgr_approval" : "pending_it_approval",
      },
      include: {
        category: true,
        assignedItem: true,
      },
    });

    res.status(201).json(buildSuccessResponse(request, "Request created successfully", 201));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error instanceof Error ? error.message : "Unable to create request", 500));
  }
});

router.get("/manager/approvals", async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    const approvals = await prisma.request.findMany({
      where: {
        managerId: user.id,
        requiresMgrApproval: true,
        mgrApprovalStatus: "pending",
        status: "pending_mgr_approval",
      },
      include: {
        category: true,
        requester: true,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(buildSuccessResponse(approvals, "Manager approvals fetched successfully"));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error instanceof Error ? error.message : "Unable to fetch approvals", 500));
  }
});

router.patch("/manager/requests/:requestId/approve", async (req: Request, res: Response) => {
  try {
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    if (!requestId) {
      res.status(400).json(buildErrorResponse("Request id is required", 400));
      return;
    }

    const user = await getCurrentUser(req);
    const existingRequest = await prisma.request.findUnique({ where: { id: requestId } });

    if (!existingRequest) {
      res.status(404).json(buildErrorResponse("Request not found", 404));
      return;
    }

    if (existingRequest.managerId !== user.id || existingRequest.requiresMgrApproval !== true || existingRequest.mgrApprovalStatus !== "pending" || existingRequest.status !== "pending_mgr_approval") {
      res.status(400).json(buildErrorResponse("Request is not pending manager approval for this manager", 400));
      return;
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        mgrApprovalStatus: "approved",
        managerDecisionNote: req.body?.managerDecisionNote ?? null,
        managerDecidedAt: new Date(),
        status: "pending_it_approval",
      },
      include: {
        category: true,
        requester: true,
        assignedItem: true,
      },
    });

    res.json(buildSuccessResponse(updated, "Request approved successfully"));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error instanceof Error ? error.message : "Unable to approve request", 500));
  }
});

router.patch("/manager/requests/:requestId/reject", async (req: Request, res: Response) => {
  try {
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    if (!requestId) {
      res.status(400).json(buildErrorResponse("Request id is required", 400));
      return;
    }

    const user = await getCurrentUser(req);
    const existingRequest = await prisma.request.findUnique({ where: { id: requestId } });

    if (!existingRequest) {
      res.status(404).json(buildErrorResponse("Request not found", 404));
      return;
    }

    if (existingRequest.managerId !== user.id || existingRequest.requiresMgrApproval !== true || existingRequest.mgrApprovalStatus !== "pending" || existingRequest.status !== "pending_mgr_approval") {
      res.status(400).json(buildErrorResponse("Request is not pending manager approval for this manager", 400));
      return;
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        mgrApprovalStatus: "rejected",
        rejectedBy: "manager",
        rejectedReason: req.body?.rejectedReason ?? null,
        managerDecisionNote: req.body?.managerDecisionNote ?? null,
        managerDecidedAt: new Date(),
        status: "rejected",
      },
      include: {
        category: true,
        requester: true,
        assignedItem: true,
      },
    });

    res.json(buildSuccessResponse(updated, "Request rejected successfully"));
  } catch (error) {
    res.status(500).json(buildErrorResponse(error instanceof Error ? error.message : "Unable to reject request", 500));
  }
});

export default router;
