import express from "express";
import mobileRouter from "./modules/mobile/mobile.routes";
import authenticateMiddleware from "./middlewares/auth.middleware";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { requestLoggerMiddleware } from "./middlewares/request-logger.middleware";
import {
  corsMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
} from "./middlewares/security.middleware";

export function createApp(): express.Express {
  const app = express();

  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(express.json());
  app.use(authenticateMiddleware);

  app.use("/api/v1/mobile", mobileRouter);
  app.use("/", mobileRouter);

  app.use(errorHandlerMiddleware);

  return app;
}

export const app = createApp();
