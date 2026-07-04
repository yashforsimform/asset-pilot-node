import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    SEED_DB: z.enum(['true', 'false']).default('false'),
    CORS_ORIGINS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    throw new Error(
        `Invalid environment configuration: ${parsedEnv.error.message}`,
    );
}

const rawEnv = parsedEnv.data;

export const env = {
    nodeEnv: rawEnv.NODE_ENV,
    port: rawEnv.PORT,
    databaseUrl: rawEnv.DATABASE_URL,
    seedDb: rawEnv.SEED_DB === 'true',
    corsOrigins:
        rawEnv.CORS_ORIGINS?.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean) ?? [],
    isProduction: rawEnv.NODE_ENV === 'production',
};

export function isLocalDatabaseUrl(databaseUrl: string): boolean {
    const url = new URL(databaseUrl);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
}
