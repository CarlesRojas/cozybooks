import { createEnv } from "@t3-oss/env-core";
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

    clientPrefix: "VITE_",
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
