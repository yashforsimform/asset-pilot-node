import { apiExamples } from './api-examples';

const authHeaderParameters = [
    { $ref: '#/components/parameters/headerUserId' },
    { $ref: '#/components/parameters/headerUserRole' },
    { $ref: '#/components/parameters/headerManagerId' },
    { $ref: '#/components/parameters/headerUserName' },
];

function pathUuidParam(name: string, example: string) {
    return {
        name,
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        example,
    };
}

function requestBody(schemaRef: string, examples: object) {
    return {
        required: true,
        content: {
            'application/json': {
                schema: { $ref: schemaRef },
                examples,
            },
        },
    };
}

function optionalRequestBody(schemaRef: string, examples: object) {
    return {
        required: false,
        content: {
            'application/json': {
                schema: { $ref: schemaRef },
                examples,
            },
        },
    };
}

function jsonResponse(description: string, examples: object) {
    return {
        description,
        content: {
            'application/json': {
                schema: { $ref: '#/components/schemas/ApiSuccess' },
                examples,
            },
        },
    };
}

function operationParameters(...parameters: object[]) {
    return [...authHeaderParameters, ...parameters];
}

export const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Asset Pilot Mobile API',
        version: '1.0.0',
        description:
            'Employee mobile API covering device list/detail, requests, approvals, extensions, returns, support, and handover workflows. Examples are based on dump.sql from 2026-07-04.',
    },
    servers: [
        {
            url: '/api/v1/mobile',
            description: 'Versioned mobile API',
        },
    ],
    tags: [
        { name: 'Health' },
        { name: 'My Requests' },
        { name: 'Requests' },
        { name: 'Devices' },
        { name: 'Manager' },
        { name: 'Extensions' },
        { name: 'Returns' },
        { name: 'Support' },
        { name: 'Handover' },
    ],
    security: [{ headerUserId: [] }],
    components: {
        securitySchemes: {
            headerUserId: {
                type: 'apiKey',
                in: 'header',
                name: 'x-user-id',
                description:
                    'Authenticated user id consumed by getAuthenticatedUserId().',
            },
        },
        parameters: {
            headerUserId: {
                name: 'x-user-id',
                in: 'header',
                required: true,
                schema: { type: 'string', format: 'uuid' },
                example: apiExamples.ids.defaultUserId,
                description:
                    'Required for authenticated mobile flows. Try Victor for employee device/support examples, Paul for manager approval examples, Alice for handover owner actions, and Bob for handover borrower actions.',
            },
            headerUserRole: {
                name: 'x-user-role',
                in: 'header',
                required: false,
                schema: {
                    type: 'string',
                    enum: ['employee', 'manager', 'it_admin'],
                    default: 'employee',
                },
                example: 'employee',
            },
            headerManagerId: {
                name: 'x-manager-id',
                in: 'header',
                required: false,
                schema: { type: 'string', format: 'uuid', nullable: true },
                example: apiExamples.users.victor.managerId,
            },
            headerUserName: {
                name: 'x-user-name',
                in: 'header',
                required: false,
                schema: { type: 'string', default: 'Demo User' },
                example: apiExamples.users.victor.name,
            },
        },
        schemas: {
            ApiMeta: {
                type: 'object',
                required: ['timestamp', 'request_id'],
                properties: {
                    timestamp: { type: 'string', format: 'date-time' },
                    request_id: { type: 'string', format: 'uuid' },
                },
            },
            ApiSuccess: {
                type: 'object',
                required: ['statusCode', 'data', 'message', 'meta', 'success'],
                properties: {
                    statusCode: { type: 'integer' },
                    data: {},
                    message: { type: 'string' },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                    success: { type: 'boolean', enum: [true] },
                },
            },
            ApiError: {
                type: 'object',
                required: ['statusCode', 'message', 'error', 'meta', 'success'],
                properties: {
                    statusCode: { type: 'integer' },
                    message: { type: 'string' },
                    error: {
                        type: 'object',
                        required: ['code', 'message', 'details'],
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                            details: { type: 'array', items: {} },
                        },
                    },
                    meta: { $ref: '#/components/schemas/ApiMeta' },
                    success: { type: 'boolean', enum: [false] },
                },
            },
            CreateRequestInput: {
                type: 'object',
                required: ['categoryId', 'requestedFrom', 'requestedTo'],
                properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    requestedFrom: { type: 'string', format: 'date-time' },
                    requestedTo: { type: 'string', format: 'date-time' },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                    },
                    note: { type: 'string' },
                    isWfh: { type: 'boolean' },
                },
            },
            CreateExtensionRequestInput: {
                type: 'object',
                required: ['extended_to'],
                properties: {
                    extended_to: { type: 'string', format: 'date-time' },
                },
            },
            ReturnDeviceInput: {
                type: 'object',
                required: ['return_tracking_url'],
                properties: {
                    return_tracking_url: { type: 'string', format: 'uri' },
                },
            },
            CreateSupportRequestInput: {
                type: 'object',
                required: ['type', 'description'],
                properties: {
                    type: {
                        type: 'string',
                        enum: ['update', 'damage', 'lost'],
                    },
                    description: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 5000,
                    },
                },
            },
            CreateHandoverRequestInput: {
                type: 'object',
                required: ['item_id'],
                properties: {
                    item_id: { type: 'string', format: 'uuid' },
                    requested_duration_hours: {
                        type: 'integer',
                        minimum: 1,
                    },
                },
            },
            ManagerApproveInput: {
                type: 'object',
                properties: {
                    managerDecisionNote: { type: 'string' },
                },
            },
            ManagerRejectInput: {
                type: 'object',
                properties: {
                    managerDecisionNote: { type: 'string' },
                    rejectedReason: { type: 'string' },
                },
            },
        },
        responses: {
            BadRequest: {
                description: 'Bad request',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
            Conflict: {
                description: 'Workflow state conflict',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ApiError' },
                    },
                },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                summary: 'Health check',
                tags: ['Health'],
                security: [],
                responses: {
                    '200': jsonResponse(
                        'Server is healthy',
                        apiExamples.responses.health,
                    ),
                },
            },
        },
        '/me/requests': {
            get: {
                summary: 'Screen 3 - My Requests',
                tags: ['My Requests'],
                parameters: operationParameters(),
                responses: {
                    '200': jsonResponse(
                        'My asset requests',
                        apiExamples.responses.myRequests,
                    ),
                },
            },
            post: {
                summary: 'Screen 3 - Create Request',
                tags: ['Requests'],
                parameters: operationParameters(),
                requestBody: requestBody(
                    '#/components/schemas/CreateRequestInput',
                    apiExamples.requestBodies.createRequest,
                ),
                responses: {
                    '201': jsonResponse(
                        'Request created',
                        apiExamples.responses.requestCreated,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/request': {
            get: {
                summary: 'Compatibility - Current User Requests',
                tags: ['My Requests'],
                parameters: operationParameters(),
                responses: {
                    '200': jsonResponse(
                        'Current user request list',
                        apiExamples.responses.myRequests,
                    ),
                },
            },
        },
        '/me/devices': {
            get: {
                summary: 'Screen 1 - My Devices',
                tags: ['Devices'],
                parameters: operationParameters(),
                responses: {
                    '200': jsonResponse(
                        'Assigned devices',
                        apiExamples.responses.myDevices,
                    ),
                },
            },
        },
        '/me/devices/{itemId}': {
            get: {
                summary:
                    'Screen 2 and Screen 8 - Device Detail / Handover lookup',
                tags: ['Devices', 'Handover'],
                parameters: operationParameters(
                    pathUuidParam('itemId', apiExamples.ids.itemId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Device detail',
                        apiExamples.responses.deviceDetail,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/borrower/device-details/{itemId}': {
            get: {
                summary: 'Borrower Device Details',
                tags: ['Devices'],
                parameters: operationParameters(
                    pathUuidParam('itemId', apiExamples.ids.itemId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Device detail',
                        apiExamples.responses.deviceDetail,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/manager/approvals': {
            get: {
                summary: 'Screen 4 - List Manager Pending Approvals',
                tags: ['Manager'],
                parameters: operationParameters(),
                responses: {
                    '200': jsonResponse(
                        'Pending approvals',
                        apiExamples.responses.managerApprovals,
                    ),
                },
            },
        },
        '/manager/requests/{requestId}/approve': {
            patch: {
                summary: 'Screen 4 - Approve Request',
                tags: ['Manager'],
                parameters: operationParameters(
                    pathUuidParam(
                        'requestId',
                        apiExamples.ids.managerApprovalRequestId,
                    ),
                ),
                requestBody: optionalRequestBody(
                    '#/components/schemas/ManagerApproveInput',
                    apiExamples.requestBodies.managerApprove,
                ),
                responses: {
                    '200': jsonResponse(
                        'Request approved',
                        apiExamples.responses.managerDecision,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/manager/requests/{requestId}/reject': {
            patch: {
                summary: 'Screen 4 - Reject Request',
                tags: ['Manager'],
                parameters: operationParameters(
                    pathUuidParam(
                        'requestId',
                        apiExamples.ids.managerApprovalRequestId,
                    ),
                ),
                requestBody: optionalRequestBody(
                    '#/components/schemas/ManagerRejectInput',
                    apiExamples.requestBodies.managerReject,
                ),
                responses: {
                    '200': jsonResponse(
                        'Request rejected',
                        apiExamples.responses.managerDecision,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/devices/{itemId}/extension-requests': {
            get: {
                summary: 'Screen 5 - List Device Extension Requests',
                tags: ['Extensions'],
                parameters: operationParameters(
                    pathUuidParam('itemId', apiExamples.items.boseHeadset.id),
                ),
                responses: {
                    '200': jsonResponse(
                        'Extension history',
                        apiExamples.responses.extensionRequests,
                    ),
                },
            },
            post: {
                summary: 'Screen 5 - Create Extension Request',
                tags: ['Extensions'],
                parameters: operationParameters(
                    pathUuidParam('itemId', apiExamples.items.dellXps.id),
                ),
                requestBody: requestBody(
                    '#/components/schemas/CreateExtensionRequestInput',
                    apiExamples.requestBodies.createExtensionRequest,
                ),
                responses: {
                    '201': jsonResponse(
                        'Extension created',
                        apiExamples.responses.extensionDetail,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/extension-requests/{id}': {
            get: {
                summary: 'Screen 5 - Extension Request Detail',
                tags: ['Extensions'],
                parameters: operationParameters(
                    pathUuidParam('id', apiExamples.ids.extensionRequestId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Extension detail',
                        apiExamples.responses.extensionDetail,
                    ),
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/devices/{itemId}/return': {
            post: {
                summary: 'Screen 6 - Initiate WFH Return',
                description:
                    'The current dump.sql has assigned devices, but no active assigned request that is both current-owned and isWfh=true. The provided body examples are valid; use this after creating or seeding a WFH assignment.',
                tags: ['Returns'],
                parameters: operationParameters(
                    pathUuidParam('itemId', apiExamples.items.dellXps.id),
                ),
                requestBody: requestBody(
                    '#/components/schemas/ReturnDeviceInput',
                    apiExamples.requestBodies.returnDevice,
                ),
                responses: {
                    '200': jsonResponse(
                        'Return initiated',
                        apiExamples.responses.returnInitiated,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
        },
        '/me/devices/{itemId}/support-requests': {
            post: {
                summary: 'Screen 7 - File Support Request',
                tags: ['Support'],
                parameters: operationParameters(
                    pathUuidParam('itemId', apiExamples.items.dellXps.id),
                ),
                requestBody: requestBody(
                    '#/components/schemas/CreateSupportRequestInput',
                    apiExamples.requestBodies.createSupportRequest,
                ),
                responses: {
                    '201': jsonResponse(
                        'Support request created',
                        apiExamples.responses.supportCreated,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/support-requests': {
            get: {
                summary: 'Screen 7 - List My Support Requests',
                tags: ['Support'],
                parameters: operationParameters({
                    name: 'status',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        enum: ['open', 'in_progress', 'resolved'],
                    },
                    examples: {
                        open: { summary: 'Open only', value: 'open' },
                        inProgress: {
                            summary: 'In progress only',
                            value: 'in_progress',
                        },
                        resolved: {
                            summary: 'Resolved only',
                            value: 'resolved',
                        },
                    },
                }),
                responses: {
                    '200': jsonResponse(
                        'Support requests',
                        apiExamples.responses.supportRequests,
                    ),
                },
            },
        },
        '/me/support-requests/{id}': {
            get: {
                summary: 'Screen 7 - Support Request Detail',
                tags: ['Support'],
                parameters: operationParameters(
                    pathUuidParam('id', apiExamples.ids.supportRequestId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Support request detail',
                        apiExamples.responses.supportDetail,
                    ),
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/handover-requests': {
            get: {
                summary: 'Screen 8 - List My Handover Requests',
                tags: ['Handover'],
                parameters: operationParameters({
                    name: 'as',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', enum: ['borrower', 'owner'] },
                    examples: {
                        borrower: {
                            summary: 'Current user as borrower',
                            value: 'borrower',
                        },
                        owner: {
                            summary: 'Current user as owner',
                            value: 'owner',
                        },
                    },
                }),
                responses: {
                    '200': jsonResponse(
                        'Handover requests',
                        apiExamples.responses.handoverRequests,
                    ),
                },
            },
            post: {
                summary: 'Screen 8 - Create Handover Request',
                tags: ['Handover'],
                parameters: operationParameters(),
                requestBody: requestBody(
                    '#/components/schemas/CreateHandoverRequestInput',
                    apiExamples.requestBodies.createHandoverRequest,
                ),
                responses: {
                    '201': jsonResponse(
                        'Handover request created',
                        apiExamples.responses.handoverCreated,
                    ),
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
        },
        '/me/handover-requests/{id}/accept': {
            patch: {
                summary: 'Screen 8 - Accept Handover Request',
                tags: ['Handover'],
                parameters: operationParameters(
                    pathUuidParam('id', apiExamples.ids.handoverRequestId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Handover accepted',
                        apiExamples.responses.handoverDecision,
                    ),
                    '404': { $ref: '#/components/responses/NotFound' },
                    '409': { $ref: '#/components/responses/Conflict' },
                },
            },
        },
        '/me/handover-requests/{id}/reject': {
            patch: {
                summary: 'Screen 8 - Reject Handover Request',
                tags: ['Handover'],
                parameters: operationParameters(
                    pathUuidParam('id', apiExamples.ids.handoverRequestId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Handover rejected',
                        apiExamples.responses.handoverDecision,
                    ),
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/handover-requests/{id}/cancel': {
            patch: {
                summary: 'Screen 8 - Cancel Handover Request',
                tags: ['Handover'],
                parameters: operationParameters(
                    pathUuidParam('id', apiExamples.ids.handoverRequestId),
                ),
                responses: {
                    '200': jsonResponse(
                        'Handover cancelled',
                        apiExamples.responses.handoverDecision,
                    ),
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/me/handover-requests/{id}/complete': {
            patch: {
                summary: 'Screen 8 - Complete Handover Request',
                tags: ['Handover'],
                parameters: operationParameters(
                    pathUuidParam(
                        'id',
                        apiExamples.ids.acceptedHandoverRequestId,
                    ),
                ),
                responses: {
                    '200': jsonResponse(
                        'Handover completed',
                        apiExamples.responses.handoverDecision,
                    ),
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
    },
} as const;
