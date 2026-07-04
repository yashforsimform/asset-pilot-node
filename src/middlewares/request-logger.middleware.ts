import type { NextFunction, Request, Response } from 'express';

export function requestLoggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const startedAt = Date.now();

    res.on('finish', () => {
        const payload = {
            level: 'info',
            event: 'http_request',
            method: req.method,
            path: req.originalUrl,
            status_code: res.statusCode,
            duration_ms: Date.now() - startedAt,
        };

        console.info(JSON.stringify(payload));
    });

    next();
}
