import express from 'express';
import docsRouter from './docs/docs.routes';
import mobile2Router from './modules/mobile2/mobile.routes';
import authenticateMiddleware from './middlewares/auth.middleware';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware';
import {
    corsMiddleware,
    rateLimitMiddleware,
    securityHeadersMiddleware,
} from './middlewares/security.middleware';

export function createApp(): express.Express {
    const app = express();

    app.use(securityHeadersMiddleware);
    app.use(corsMiddleware);
    app.use(rateLimitMiddleware);
    app.use(requestLoggerMiddleware);
    app.use(express.json());
    app.use(docsRouter);
    app.use(authenticateMiddleware);

    app.use('/api/v1/mobile', mobile2Router);
    app.use('/', mobile2Router);

    app.use(errorHandlerMiddleware);

    return app;
}

export const app = createApp();
