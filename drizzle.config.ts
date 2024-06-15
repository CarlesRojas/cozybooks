import { env } from '@/env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/server/database/schema',
    out: './src/server/database/migration',
    dialect: 'postgresql',
    dbCredentials: {
        url: env.DATABASE_URL
    },
    verbose: true,
    strict: true
});
