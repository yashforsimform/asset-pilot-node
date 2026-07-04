import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppError } from '../common/errors/app-error';
import { env } from '../config/env';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function securityHeadersMiddleware(
    _req: Request,
    res: Response,
    next: NextFunction,
): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()',
    );
    next();
}

export function corsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const origin = req.header('origin');
    const allowedOrigin =
        origin &&
        (env.corsOrigins.length === 0 || env.corsOrigins.includes(origin))
            ? origin
            : null;

    if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Vary', 'Origin');
    }

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, x-user-id, x-user-role, x-manager-id, x-user-name',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
}

export const rateLimitMiddleware: RequestHandler = (req, _res, next): void => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const bucket = requestBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
        next();
        return;
    }

    bucket.count += 1;

    if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
        next(new AppError('Too many requests', 429, 'rate_limit_exceeded'));
        return;
    }

    next();
};
