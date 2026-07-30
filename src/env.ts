import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),
        // Required: keyless Google Books requests share a global quota that is routinely
        // exhausted, so the app never runs without a key. Must also be set on the Convex
        // deployment (`npx convex env set GOOGLE_BOOKS_API_KEY ...`), where the Books
        // calls actually run.
        GOOGLE_BOOKS_API_KEY: z.string().min(1),
        BETTER_AUTH_SECRET: z.string().min(1), // Create using `openssl rand -base64 32`. Must also be set on the Convex deployment.
        BETTER_AUTH_URL: z.string().url(),
        // Only needed for the legacy src/server code and `pnpm convex:export`.
        DATABASE_URL: z.string().url().optional(),
    },

    client: {},

    clientPrefix: "VITE_",
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
