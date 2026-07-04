import express from 'express';
import { mobileRouter } from './modules/mobile/mobile.routes';
import { authenticateMiddleware } from './middlewares/authenticate';
import { errorHandler } from './middlewares/error-handler';
import { requestIdMiddleware } from './middlewares/request-id';
import { sendSuccess } from './common/utils/api-response';

export const app = express();

app.use(express.json());
app.use(requestIdMiddleware);

app.get('/health', (_req, res) => {
    sendSuccess(res, 200, { ok: true }, 'Server is healthy');
});

app.use('/api/v1', authenticateMiddleware, mobileRouter);

app.use(errorHandler);
