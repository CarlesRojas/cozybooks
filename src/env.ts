import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
        GOOGLE_BOOKS_API_KEY: z.string().min(1),
        NEXTAUTH_SECRET: z.string().min(1), // Create using `openssl rand -base64 32`
        NEXTAUTH_URL: z.string().url(),
        DATABASE_URL: z.string().url(),
    },
    client: {},
    runtimeEnv: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        DATABASE_URL: process.env.DATABASE_URL,
    },
});
