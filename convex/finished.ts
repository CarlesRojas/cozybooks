// Counterpart of `src/server/repo/finished.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getFinishedForBook, removeBookFromLibrary } from "./lib/model";
import { publishFinished } from "./lib/publish";

// Counterpart of `addFinished`.
export const add = mutation({
    args: { userId: v.string(), bookId: v.string(), timestamp: v.number() },
    handler: async (ctx, args) => {
        await ctx.db.insert("finished", args);
    },
});

// Counterpart of `updateFinished`. `userId`/`bookId` identify the affected
// `getForBook` query for client-side optimistic updates and double as an ownership check.
export const update = mutation({
    args: { id: v.id("finished"), userId: v.string(), bookId: v.string(), timestamp: v.number() },
    handler: async (ctx, { id, userId, bookId, timestamp }) => {
        const finished = await ctx.db.get(id);
        if (!finished || finished.userId !== userId || finished.bookId !== bookId) return;
        await ctx.db.patch(id, { timestamp });
    },
});

// Counterpart of `deleteFinished` + the follow-up in `deleteFinishedDate`
// (`src/server/use/finished/useDeleteFinishedDate.ts`): when the last finished date
// of a book is deleted, the book also leaves the FINISHED library. The old flow
// needed three sequential server calls; this is one transactional mutation.
export const remove = mutation({
    args: { id: v.id("finished"), userId: v.string(), bookId: v.string() },
    handler: async (ctx, { id, userId, bookId }) => {
        const finished = await ctx.db.get(id);
        if (!finished || finished.userId !== userId || finished.bookId !== bookId) return;

        await ctx.db.delete(id);

        const remaining = await getFinishedForBook(ctx, { userId: finished.userId, bookId: finished.bookId });
        if (remaining.length === 0)
            await removeBookFromLibrary(ctx, { userId: finished.userId, type: "FINISHED", bookId: finished.bookId });
    },
});

// Counterpart of `getFinished`. The index returns the dates already sorted by
// timestamp ascending, matching the old `orderBy asc(timestamp)`.
export const getForBook = query({
    args: { userId: v.string(), bookId: v.string() },
    handler: async (ctx, args) => {
        const finished = await getFinishedForBook(ctx, args);
        return finished.map(publishFinished);
    },
});
