import { convexHttpClient } from "@/convex/http";
import { env } from "@/env";
import { convexAdapter } from "@/lib/auth/convexAdapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

if (!convexHttpClient) throw new Error("VITE_CONVEX_URL must be set: better-auth stores its data in Convex");

export const auth = betterAuth({
    database: convexAdapter({ client: convexHttpClient, secret: env.BETTER_AUTH_SECRET }),

    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,

            // The app mirrors library changes onto the user's Google "My Library" shelves
            // and reads the "Books for you" shelf. Both need the Books scope: Google's
            // default `openid`/`email`/`profile` token is identity-only, and every
            // `mylibrary` endpoint rejects it.
            scope: ["https://www.googleapis.com/auth/books"],

            // Without offline access Google issues no refresh token, so the access token
            // can't outlive its first hour and `getAccessToken` fails from then on.
            accessType: "offline",

            // Google only re-issues a refresh token when it actually re-prompts, so
            // accounts that consented before the scope above existed would otherwise
            // keep their old identity-only grant.
            prompt: "consent",
        },
    },

    plugins: [tanstackStartCookies()],
});
