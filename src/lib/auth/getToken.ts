// The JWT that `convex/auth.config.ts` verifies, minted from the session cookie the
// request carries. Convex functions read the signed-in user off it — nothing passes a
// user id any more — so this is what makes an SSR read authenticated.
//
// better-auth runs in this process, so the session is read directly rather than proxied:
// `auth.api` is called with the incoming request's headers, which is where the cookie is.

import { auth } from "@/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getToken = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getRequest();

    // The `jwt` plugin's endpoint answers only for a live session, so a signed-out
    // request comes back empty rather than throwing — the common case on a cold visit.
    const result = await auth.api.getToken({ headers }).catch(() => null);
    return result?.token ?? undefined;
});
