// Counterpart of `src/server/repo/unreleasedBook.ts`. Whose list comes from the
// verified token — see `convex/lib/auth.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId, requireUserId } from "./lib/auth";
import { publishUnreleasedBook } from "./lib/publish";

// Counterpart of `addUnreleasedBook`.
export const add = mutation({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        const userId = await requireUserId(ctx);
        await ctx.db.insert("unreleasedBooks", { userId, name });
    },
});

// Counterpart of `removeUnreleasedBook`. The row has to belong to the caller: the id
// alone says nothing about whose list it is on.
export const remove = mutation({
    args: { id: v.id("unreleasedBooks") },
    handler: async (ctx, { id }) => {
        const userId = await requireUserId(ctx);

        const existing = await ctx.db.get(id);
        if (existing && existing.userId === userId) await ctx.db.delete(existing._id);
    },
});

// Counterpart of `getUnreleasedBooks`. The index returns the list already sorted
// by name ascending, matching the old `orderBy asc(name)`.
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const unreleasedBooks = await ctx.db
            .query("unreleasedBooks")
            .withIndex("by_user_name", (q) => q.eq("userId", userId))
            .collect();

        return unreleasedBooks.map(publishUnreleasedBook);
    },
});
