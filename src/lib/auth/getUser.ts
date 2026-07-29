// Resolves the current session user and their Google access token. better-auth persists
// both to Convex; the token comes from the Google OAuth grant and is refreshed on demand.

import { auth } from "@/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getRequest();

    const session = await auth.api.getSession({ headers });
    if (!session) return { user: null, googleToken: null };

    try {
        const accessToken = await auth.api.getAccessToken({ body: { providerId: "google" }, headers });
        return { user: session.user, googleToken: accessToken.accessToken };
    } catch (error) {
        // Reported as "no user" on purpose: every Google-backed feature needs this token,
        // and the whole app is behind `_protected`, so a session without one is treated as
        // signed out. Re-authenticating is also what fixes it — it mints a fresh grant.
        // The reason has to be logged, though: an unconsented scope, a revoked grant and a
        // missing refresh token all land here and are otherwise indistinguishable.
        console.error("Could not get a Google access token for the current session", error);
    }

    return { user: null, googleToken: null };
});
