import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../common/errors/app-error';
import type { AuthUser } from './auth.middleware';

const userIdSchema = z.string().uuid();

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
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

    const name = req.header('x-user-name');

    req.user = {
        id: parsed.data,
        role: req.header('x-user-role') ?? 'employee',
        managerId: req.header('x-manager-id') ?? null,
        ...(name === undefined ? {} : { name }),
    };
    next();
};
