import express from "express";
import mobileRouter from "./routes/mobile";
import authMiddleware from "./middleware/auth";
import { seedDatabase } from "./lib/seed";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(authMiddleware);
app.use("/", mobileRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : "Unexpected error";
  res.status(500).json({
    status_code: 500,
    message,
    error: {
      code: "internal_server_error",
      message,
      details: [],
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
    },
    success: false,
  });
});

async function start() {
  if (process.env.SEED_DB === "true") {
    await seedDatabase();
  }

  app.listen(port, () => {
    console.log(`Asset Pilot API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
