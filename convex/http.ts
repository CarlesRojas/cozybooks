import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
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

export default http;
