import { randomUUID } from 'crypto';

export interface ApiMeta {
    timestamp: string;
    request_id: string;
}

export interface ApiSuccessResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    meta: ApiMeta;
    success: true;
}

export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    error: {
        code: string;
        message: string;
        details: unknown[];
    };
    meta: ApiMeta;
    success: false;
}

function buildMeta(): ApiMeta {
    return {
        timestamp: new Date().toISOString(),
        request_id: randomUUID(),
    };
}

export function buildSuccessResponse<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
): ApiSuccessResponse<T> {
    return {
        statusCode: statusCode,
        data,
        message,
        meta: buildMeta(),
        success: true,
    };
}

export function buildErrorResponse(
    message: string,
    statusCode: number,
    code: string,
    details: unknown[] = [],
): ApiErrorResponse {
    return {
        statusCode: statusCode,
        message,
        error: {
            code,
            message,
            details,
        },
        meta: buildMeta(),
        success: false,
    };
}
