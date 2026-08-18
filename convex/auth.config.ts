import type { AuthConfig } from "convex/server";

// Convex verifies the JWT that better-auth issues, so `ctx.auth.getUserIdentity()`
// works inside Convex functions and ownership is enforced there rather than asserted by
// whoever is calling. Every function that used to take a `userId` argument reads it from
// the identity now — see `convex/lib/auth.ts`.
//
// `issuer` is the app's own origin, because that is what signs the token: better-auth
// runs in the app server, see `src/lib/auth/index.ts`. BETTER_AUTH_URL therefore has to
// be set on this deployment too (`npx convex env set BETTER_AUTH_URL ...`, and again
// with --prod), since this file is evaluated here.
//
// `jwks` is *not* the app's `/api/auth/jwks`, though better-auth serves one there. This
// deployment is what fetches the key set, and it cannot reach `localhost` in
// development, so it serves the keys to itself from `convex/http.ts` instead.
//
// `applicationID` is the `aud` claim; `src/lib/auth/index.ts` stamps it, and pins the
// key pair to RS256 — Convex verifies RS256 and ES256 only.
export default {
    providers: [
        {
            type: "customJwt",
            issuer: process.env.BETTER_AUTH_URL!,
            jwks: `${process.env.CONVEX_SITE_URL}/api/auth/jwks`,
            applicationID: "convex",
            algorithm: "RS256",
        },
    ],
} satisfies AuthConfig;
