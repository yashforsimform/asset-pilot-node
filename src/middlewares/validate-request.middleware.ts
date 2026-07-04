import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../common/errors/app-error';

function validationError(details: unknown[]): AppError {
    return new AppError(
        'Invalid request payload',
        400,
        'validation_error',
        details,
    );
}

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
    return (req, _res, next): void => {
        const parsed = schema.safeParse(req.body);

        if (!parsed.success) {
            next(validationError(parsed.error.issues));
            return;
        }

        req.body = parsed.data;
        next();
    };
}

export function validateParams<T>(schema: ZodType<T>): RequestHandler {
    return (req, _res, next): void => {
        const parsed = schema.safeParse(req.params);

        if (!parsed.success) {
            next(validationError(parsed.error.issues));
            return;
        }

        req.params = parsed.data as typeof req.params;
        next();
    };
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
    return (req, _res, next): void => {
        const parsed = schema.safeParse(req.query);

        if (!parsed.success) {
            next(validationError(parsed.error.issues));
            return;
        }

        // req.query = parsed.data as typeof req.query;
        next();
    };
}
