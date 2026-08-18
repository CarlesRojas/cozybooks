import { convexHttpClient } from "@/convex/http";
import { env } from "@/env";
import { convexAdapter } from "@/lib/auth/convexAdapter";
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
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

// The `aud` claim Convex requires. Must stay in step with `applicationID` in
// `convex/auth.config.ts`; it is spelled out in both places rather than shared, because
// that file is bundled into the Convex deployment and must not pull this one in with it.
const CONVEX_AUDIENCE = "convex";

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
    // costing a database round trip. Every session read went to Convex as *two*
    // `betterAuth.findMany` calls — better-auth looks the session up by token and then
    // joins the user, and this adapter declares no join support — and the token
    // endpoint reads the session on every mint. Within the window the cookie is the
    // answer.
    //
    // The cost is that a session revoked elsewhere outlives itself by up to the window
    // on other devices, which for a reading list is nothing. Signing out clears the
    // cookie along with the session, so the device that signed out never sees the lag.
    session: {
        cookieCache: { enabled: true, maxAge: 5 * 60 },
    },

    // `tanstackStartCookies` last, as it requires.
    plugins: [
        jwt({
            // Both defaults are wrong for Convex. The key pair defaults to EdDSA, and
            // Convex verifies RS256 and ES256 only; the audience defaults to `baseURL`,
            // and Convex checks it against the `applicationID` in
            // `convex/auth.config.ts`. A token that misses either comes back as
            // `NoAuthProvider`.
            jwks: { keyPairConfig: { alg: "RS256", modulusLength: 2048 } },
            // An hour rather than the default fifteen minutes. The token only
            // authenticates the Convex socket, and Convex re-asks `/api/auth/token` as
            // expiry nears — every mint validating the session and reading the signing
            // key — so its lifetime sets how often every open tab pays that round trip.
            jwt: { issuer: env.BETTER_AUTH_URL, audience: CONVEX_AUDIENCE, expirationTime: "1h" },
            // The plugin otherwise mints a token on every `/api/auth/get-session` and
            // hangs it off a `set-auth-jwt` response header — a signature and a key read
            // per session check, for a header nothing here reads: the socket's token
            // comes from `/api/auth/token`, asked for by `src/convex/provider.tsx`, and
            // `authClient` is built without the client plugin that would pick it up.
            disableSettingJwtHeader: true,
        }),
        tanstackStartCookies(),
    ],
});
