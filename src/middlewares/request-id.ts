import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const incomingRequestId = req.header('x-request-id');
    res.locals.requestId =
        incomingRequestId && incomingRequestId.trim() !== ''
            ? incomingRequestId
            : randomUUID();
    next();
};
