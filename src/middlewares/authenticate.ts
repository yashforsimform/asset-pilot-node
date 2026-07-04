import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../common/errors/app-error';

const userIdSchema = z.string().uuid();

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}

export const authenticateMiddleware = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    const parsed = userIdSchema.safeParse(req.header('x-user-id'));

    if (!parsed.success) {
        next(new UnauthorizedError('Missing or invalid x-user-id header'));
        return;
    }

    req.user = {
        id: parsed.data,
    };
    next();
};
