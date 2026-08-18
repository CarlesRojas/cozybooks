import { convexHttpClient } from "@/convex/http";
import { env } from "@/env";
import { convexAdapter } from "@/lib/auth/convexAdapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

if (!convexHttpClient) throw new Error("VITE_CONVEX_URL must be set: better-auth stores its data in Convex");

// better-auth rejects any state-changing request whose `Origin` isn't trusted, and by
// default it trusts exactly one: the origin of BETTER_AUTH_URL. Prod answers on both the
// apex and the `www.` host (the Android TWA targets `www.`), so whichever of the two
// BETTER_AUTH_URL happens to name, requests from the other came back as a 403
// `INVALID_ORIGIN` — which is what made "Sign out" look like it did nothing at all.
// Trust both spellings of the configured host rather than pinning one.
const trustedOrigins = () => {
    const { origin, protocol, host } = new URL(env.BETTER_AUTH_URL);
    const sibling = host.startsWith("www.") ? host.slice("www.".length) : `www.${host}`;
    return [origin, `${protocol}//${sibling}`];
};

export const auth = betterAuth({
    database: convexAdapter({ client: convexHttpClient, secret: env.BETTER_AUTH_SECRET }),

    // Explicit, so the base url can never be silently inferred from the incoming request.
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: trustedOrigins(),

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
