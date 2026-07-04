import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type RequestSchemas = {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
};

export const validateRequest =
    (schemas: RequestSchemas) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        if (schemas.params) {
            req.params = schemas.params.parse(req.params) as typeof req.params;
        }

        if (schemas.query) {
            req.query = schemas.query.parse(req.query) as typeof req.query;
        }

        if (schemas.body) {
            req.body = schemas.body.parse(req.body) as typeof req.body;
        }

        next();
    };
