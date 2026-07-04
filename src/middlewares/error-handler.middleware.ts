import type { ErrorRequestHandler } from 'express';
import { buildErrorResponse } from '../common/api-response';
import { AppError } from '../common/errors/app-error';
import { env } from '../config/env';

export const errorHandlerMiddleware: ErrorRequestHandler = (
    err,
    _req,
    res,
    _next,
): void => {
    if (err instanceof AppError) {
        const details = Array.isArray(err.details)
            ? err.details
            : err.details === undefined
              ? []
              : [err.details];

        res.status(err.statusCode).json(
            buildErrorResponse(err.message, err.statusCode, err.code, details),
        );
        return;
    }

    const message = env.isProduction
        ? 'Unexpected error'
        : err instanceof Error
          ? err.message
          : 'Unexpected error';
    res.status(500).json(
        buildErrorResponse(message, 500, 'internal_server_error'),
    );
};
