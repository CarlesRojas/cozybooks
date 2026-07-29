// Counterpart of `src/server/repo/rating.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getRatingEntry } from "./lib/model";

// Counterpart of `createRating` (which was already an upsert).
export const set = mutation({
    args: { userId: v.string(), bookId: v.string(), rating: v.number() },
    handler: async (ctx, { userId, bookId, rating }) => {
        const existing = await getRatingEntry(ctx, { userId, bookId });
        if (existing) await ctx.db.patch(existing._id, { rating });
        else await ctx.db.insert("ratings", { userId, bookId, rating });
    },
});

// Counterpart of `deleteRating`.
export const remove = mutation({
    args: { userId: v.string(), bookId: v.string() },
    handler: async (ctx, args) => {
        const existing = await getRatingEntry(ctx, args);
        if (existing) await ctx.db.delete(existing._id);
    },
});

// Counterpart of `getRating`. Note: this is a reactive query now, while the old
// version was registered as a POST server function.
export const get = query({
    args: { userId: v.string(), bookId: v.string() },
    handler: async (ctx, args) => {
        const existing = await getRatingEntry(ctx, args);
        return existing?.rating ?? null;
    },
});
