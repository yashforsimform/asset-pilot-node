import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ParsedQs } from 'qs';

export const asyncHandler =
    <
        P = Record<string, string>,
        ResBody = unknown,
        ReqBody = unknown,
        ReqQuery = ParsedQs,
    >(
        handler: (
            req: Request<P, ResBody, ReqBody, ReqQuery>,
            res: Response,
            next: NextFunction,
        ) => Promise<void>,
    ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
    (
        req: Request<P, ResBody, ReqBody, ReqQuery>,
        res: Response,
        next: NextFunction,
    ): void => {
        handler(req, res, next).catch(next);
    };
