// Counterpart of `src/server/repo/rating.ts`. Whose rating comes from the verified
// token — see `convex/lib/auth.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId, requireUserId } from "./lib/auth";
import { getRatingEntry } from "./lib/model";

// Counterpart of `createRating` (which was already an upsert).
export const set = mutation({
    args: { bookId: v.string(), rating: v.number() },
    handler: async (ctx, { bookId, rating }) => {
        const userId = await requireUserId(ctx);

        const existing = await getRatingEntry(ctx, { userId, bookId });
        if (existing) await ctx.db.patch(existing._id, { rating });
        else await ctx.db.insert("ratings", { userId, bookId, rating });
    },
});

// Counterpart of `deleteRating`.
export const remove = mutation({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const userId = await requireUserId(ctx);

        const existing = await getRatingEntry(ctx, { userId, bookId });
        if (existing) await ctx.db.delete(existing._id);
    },
});

// Counterpart of `getRating`. Note: this is a reactive query now, while the old
// version was registered as a POST server function.
export const get = query({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const userId = await getUserId(ctx);
        if (!userId) return null;

        const existing = await getRatingEntry(ctx, { userId, bookId });
        return existing?.rating ?? null;
    },
});
