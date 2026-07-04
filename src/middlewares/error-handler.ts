import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/app-error';
import { sendError } from '../common/utils/api-response';

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof ZodError) {
        sendError(
            res,
            400,
            'VALIDATION_ERROR',
            'Validation failed',
            err.issues,
        );
        return;
    }

    if (err instanceof AppError) {
        sendError(res, err.statusCode, err.code, err.message, err.details);
        return;
    }

    sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
};
