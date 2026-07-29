// Counterpart of `src/server/repo/unreleasedBook.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { publishUnreleasedBook } from "./lib/publish";

// Counterpart of `addUnreleasedBook`.
export const add = mutation({
    args: { userId: v.string(), name: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert("unreleasedBooks", args);
    },
});

// Counterpart of `removeUnreleasedBook`. `userId` identifies the affected `list`
// query for client-side optimistic updates and doubles as an ownership check.
export const remove = mutation({
    args: { id: v.id("unreleasedBooks"), userId: v.string() },
    handler: async (ctx, { id, userId }) => {
        const existing = await ctx.db.get(id);
        if (existing && existing.userId === userId) await ctx.db.delete(id);
    },
});

// Counterpart of `getUnreleasedBooks`. The index returns the list already sorted
// by name ascending, matching the old `orderBy asc(name)`.
export const list = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const unreleasedBooks = await ctx.db
            .query("unreleasedBooks")
            .withIndex("by_user_name", (q) => q.eq("userId", userId))
            .collect();

        return unreleasedBooks.map(publishUnreleasedBook);
    },
});
