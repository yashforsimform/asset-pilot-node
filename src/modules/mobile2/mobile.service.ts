import type { HandoverRequest, ItemCategory, Request, User } from "@prisma/client";
import { AppError } from "../../common/errors/app-error";
import type { ApproveRequestDto, CreateRequestDto, RejectRequestDto } from "./mobile.dto";
import {
  approveRequestByManager,
  createAssetRequest,
  findAssignmentForRequester,
  findCategoryById,
  findHandoversByItem,
  findManagerApprovals,
  findRequestById,
  findRequestsByRequester,
  findUserById,
  rejectRequestByManager,
  type ManagerApprovalRequest,
  type RequestWithCategoryAndItem,
} from "./mobile.repository";

export interface DeviceDetail {
  request: RequestWithCategoryAndItem;
  handoverRequests: HandoverRequest[];
}

function parseDateRange(requestedFromValue: string, requestedToValue: string): { requestedFrom: Date; requestedTo: Date } {
  const requestedFrom = new Date(requestedFromValue);
  const requestedTo = new Date(requestedToValue);

  if (
    Number.isNaN(requestedFrom.getTime()) ||
    Number.isNaN(requestedTo.getTime()) ||
    requestedTo <= requestedFrom
  ) {
    throw new AppError("requestedFrom must be before requestedTo", 400, "validation_error");
  }

  return { requestedFrom, requestedTo };
}

function assertManagerCanDecide(request: Request, managerId: string): void {
  if (
    request.managerId !== managerId ||
    request.requiresMgrApproval !== true ||
    request.mgrApprovalStatus !== "pending" ||
    request.status !== "pending_mgr_approval"
  ) {
    throw new AppError("Request is not pending manager approval for this manager", 400, "invalid_request_state");
  }
}

export async function getCurrentUser(userId: string): Promise<User> {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("Authenticated user not found", 401, "authenticated_user_not_found");
  }

  return user;
}

export async function getMyDevices(userId: string): Promise<RequestWithCategoryAndItem[]> {
  const user = await getCurrentUser(userId);
  return findRequestsByRequester(user.id);
}

export async function getDeviceDetail(userId: string, itemId: string): Promise<DeviceDetail> {
  const user = await getCurrentUser(userId);
  const request = await findAssignmentForRequester(user.id, itemId);

  if (!request) {
    throw new AppError("No matching device assignment found", 404, "assignment_not_found");
  }

  const handoverRequests = await findHandoversByItem(itemId);
  return { request, handoverRequests };
}

export async function createRequest(userId: string, dto: CreateRequestDto): Promise<RequestWithCategoryAndItem> {
  const user = await getCurrentUser(userId);
  const category: ItemCategory | null = await findCategoryById(dto.categoryId);

  if (!category) {
    throw new AppError("Category not found", 404, "category_not_found");
  }

  const { requestedFrom, requestedTo } = parseDateRange(dto.requestedFrom, dto.requestedTo);

  return createAssetRequest({
    requesterId: user.id,
    managerId: user.managerId ?? null,
    categoryId: category.id,
    requestedFrom,
    requestedTo,
    priority: dto.priority ?? "medium",
    note: dto.note ?? null,
    isWfh: dto.isWfh ?? false,
    requiresMgrApproval: category.requiresMgrApproval,
    mgrApprovalStatus: category.requiresMgrApproval ? "pending" : "not_required",
    status: category.requiresMgrApproval ? "pending_mgr_approval" : "pending_it_approval",
  });
}

export async function getApprovalsForManager(userId: string): Promise<ManagerApprovalRequest[]> {
  const user = await getCurrentUser(userId);
  return findManagerApprovals(user.id);
}

export async function approveRequest(userId: string, requestId: string, dto: ApproveRequestDto): Promise<ManagerApprovalRequest> {
  const user = await getCurrentUser(userId);
  const request = await findRequestById(requestId);

  if (!request) {
    throw new AppError("Request not found", 404, "request_not_found");
  }

  assertManagerCanDecide(request, user.id);
  return approveRequestByManager(request.id, dto.managerDecisionNote ?? null);
}

export async function rejectRequest(userId: string, requestId: string, dto: RejectRequestDto): Promise<ManagerApprovalRequest> {
  const user = await getCurrentUser(userId);
  const request = await findRequestById(requestId);

  if (!request) {
    throw new AppError("Request not found", 404, "request_not_found");
  }

  assertManagerCanDecide(request, user.id);
  return rejectRequestByManager(request.id, dto.managerDecisionNote ?? null, dto.rejectedReason ?? null);
}
