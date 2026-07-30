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
            // Identity-only: the deprecated Google "My Library" integration is gone, so
            // no feature needs the Books scope (or the offline/consent settings that
            // existed to keep its token refreshable).
        },
    },

    plugins: [tanstackStartCookies()],
});
