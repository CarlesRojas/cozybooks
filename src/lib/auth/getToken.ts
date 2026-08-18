// The JWT that `convex/auth.config.ts` verifies, minted from the session cookie the
// request carries. Convex functions read the signed-in user off it — nothing passes a
// user id — so this is what makes an SSR read authenticated.
//
// better-auth runs in this process, so the session is read directly rather than proxied:
// `auth.api` is called with the incoming request's headers, which is where the cookie is.

import { auth } from "@/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// TEMPORARY DIAGNOSTICS — remove with the rest of the `[auth:` logging.
const describeToken = (token: string) => {
    try {
        const [, payload] = token.split(".");
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as Record<string, unknown>;
        return `sub=${String(claims.sub)} iss=${String(claims.iss)} aud=${String(claims.aud)} exp=${String(claims.exp)}`;
    } catch {
        return "unparseable";
    }
};

export const getToken = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getRequest();

    const cookie = headers.get("cookie") ?? "";
    const cookieNames = cookie
        .split(";")
        .map((part) => part.split("=")[0].trim())
        .filter((name) => name.startsWith("better-auth"));
    console.log(`[auth:getToken] cookies=${cookieNames.join(",") || "none"}`);

    // Was there a session at all, independently of whether a token can be minted from it?
    const session = await auth.api.getSession({ headers }).catch((error: unknown) => {
        console.log(`[auth:getToken] getSession THREW: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    });
    console.log(`[auth:getToken] session=${session?.user ? `yes (${session.user.id})` : "no"}`);

    // The `jwt` plugin's endpoint answers only for a live session, so a signed-out
    // request comes back empty rather than throwing — the common case on a cold visit.
    const result = await auth.api.getToken({ headers }).catch((error: unknown) => {
        console.log(`[auth:getToken] getToken THREW: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) console.log(error.stack.split("\n").slice(0, 6).join("\n"));
        return null;
    });

    if (result?.token) console.log(`[auth:getToken] minted len=${result.token.length} ${describeToken(result.token)}`);
    else console.log("[auth:getToken] no token");

    return result?.token ?? undefined;
});
