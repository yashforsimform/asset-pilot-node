import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env, isLocalDatabaseUrl } from '../config/env';

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

const pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: isLocalDatabaseUrl(env.databaseUrl)
        ? false
        : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (!env.isProduction) {
    globalForPrisma.prisma = prisma;
}
