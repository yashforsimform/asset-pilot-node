import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

type ApiMeta = {
    timestamp: string;
    request_id: string;
};

type ApiSuccess<T> = {
    status_code: number;
    data: T;
    message: string;
    meta: ApiMeta;
    success: true;
};

type ApiError = {
    status_code: number;
    message: string;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta: ApiMeta;
    success: false;
};

const getRequestId = (res: Response): string => {
    const requestId = res.locals.requestId;
    return typeof requestId === 'string' ? requestId : randomUUID();
};

export const sendSuccess = <T>(
    res: Response,
    statusCode: number,
    data: T,
    message: string,
): void => {
    const body: ApiSuccess<T> = {
        status_code: statusCode,
        data,
        message,
        meta: {
            timestamp: new Date().toISOString(),
            request_id: getRequestId(res),
        },
        success: true,
    };

    res.status(statusCode).json(body);
};

export const sendError = (
    res: Response,
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
): void => {
    const body: ApiError = {
        status_code: statusCode,
        message,
        error: {
            code,
            message,
            ...(details === undefined ? {} : { details }),
        },
        meta: {
            timestamp: new Date().toISOString(),
            request_id: getRequestId(res),
        },
        success: false,
    };

    res.status(statusCode).json(body);
};
