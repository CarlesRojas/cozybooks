import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { httpAction } from "./_generated/server";
import { hashWidgetToken } from "./widget";
import { httpRouter } from "convex/server";

const http = httpRouter();

// The key set Convex itself verifies tokens against — `convex/auth.config.ts` points
// here.
//
// Public by design: a JWKS is public keys only. The private half stays in `jwks` and is
// encrypted with BETTER_AUTH_SECRET besides.
http.route({
    path: "/api/auth/jwks",
    method: "GET",
    handler: httpAction(async (ctx) => {
        const keys = await ctx.runQuery(internal.betterAuth.publicKeys, {});

        return new Response(JSON.stringify({ keys }), {
            headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
        });
    }),
});

// The Android home-screen widget, authenticated by a widget token minted in
// `widget.ts` and sent as a Bearer header; see there for why the widget can't use the
// better-auth session. Deliberately read-only: one GET, no writes a leaked token could do.

// lastUsedAt is only bookkeeping, so refresh it at most hourly instead of writing on
// every widget poll.
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

const authenticateWidget = async (ctx: ActionCtx, request: Request) => {
    const header = request.headers.get("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (!token) return null;

    const found = await ctx.runQuery(internal.widget.getUserByTokenHash, { tokenHash: await hashWidgetToken(token) });
    if (!found) return null;

    if (!found.lastUsedAt || Date.now() - found.lastUsedAt > TOUCH_INTERVAL_MS)
        await ctx.runMutation(internal.widget.touchToken, { tokenId: found.tokenId });

    return found.userId;
};

const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

http.route({
    path: "/widget/sections",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const userId = await authenticateWidget(ctx, request);
        if (!userId) return jsonResponse(401, { error: "Invalid or revoked widget token" });

        // The phone sends its own year bounds; without them, fall back to the UTC year.
        const params = new URL(request.url).searchParams;
        const now = new Date();
        const yearStart = Number(params.get("yearStart")) || Date.UTC(now.getUTCFullYear(), 0, 1);
        const yearEnd = Number(params.get("yearEnd")) || Date.UTC(now.getUTCFullYear() + 1, 0, 1);

        return jsonResponse(200, await ctx.runQuery(internal.widget.getWidgetSections, { userId, yearStart, yearEnd }));
    }),
});

export default http;
