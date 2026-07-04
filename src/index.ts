import { app } from './app';
import { env } from './config/env';
import { seedDatabase } from './lib/seed';

async function start(): Promise<void> {
    if (env.seedDb) {
        await seedDatabase();
    }

    app.listen(env.port, () => {
        console.info(`Asset Pilot API running on http://localhost:${env.port}`);
    });
}

start().catch((error) => {
    console.error(error);
    process.exit(1);
});
