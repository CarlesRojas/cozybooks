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

    // The session, cached in a signed cookie for five minutes, so reading it stops
    // costing a database round trip.
    //
    // Every server-side session read went to Convex, and each one cost *two*
    // `betterAuth.findMany` calls: better-auth looks a session up by token and then
    // joins the user, and this adapter declares no join support, so the factory falls
    // back to a second query. `getUser` runs in the root route's `beforeLoad`, which
    // TanStack re-runs on every navigation and every preload, and the blob routes ask
    // again per upload — so a session check was the busiest thing on the deployment.
    // Within the window the cookie itself is the answer.
    //
    // The cost is that a session revoked elsewhere outlives itself by up to the window
    // on other devices, which for a reading list is nothing. Signing out clears the
    // cookie along with the session, so the device that signed out never sees the lag.
    session: {
        cookieCache: { enabled: true, maxAge: 5 * 60 },
    },

    plugins: [tanstackStartCookies()],
});
