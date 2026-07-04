import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
});

export const env = envSchema.parse(process.env);
