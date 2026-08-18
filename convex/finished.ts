// Counterpart of `src/server/repo/finished.ts`. Whose dates these are comes from the
// verified token — see `convex/lib/auth.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId, requireUserId } from "./lib/auth";
import { getFinishedForBook, removeBookFromLibrary } from "./lib/model";
import { publishFinished } from "./lib/publish";

// Counterpart of `addFinished`.
export const add = mutation({
    args: { bookId: v.string(), timestamp: v.number() },
    handler: async (ctx, { bookId, timestamp }) => {
        const userId = await requireUserId(ctx);
        await ctx.db.insert("finished", { userId, bookId, timestamp });
    },
});

// Counterpart of `updateFinished`. `bookId` identifies the affected `getForBook` query
// for client-side optimistic updates; the ownership check is against the caller.
export const update = mutation({
    args: { id: v.id("finished"), bookId: v.string(), timestamp: v.number() },
    handler: async (ctx, { id, bookId, timestamp }) => {
        const userId = await requireUserId(ctx);

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
    args: { id: v.id("finished"), bookId: v.string() },
    handler: async (ctx, { id, bookId }) => {
        const userId = await requireUserId(ctx);

        const finished = await ctx.db.get(id);
        if (!finished || finished.userId !== userId || finished.bookId !== bookId) return;

        await ctx.db.delete(id);

        const remaining = await getFinishedForBook(ctx, { userId, bookId });
        if (remaining.length === 0) await removeBookFromLibrary(ctx, { userId, type: "FINISHED", bookId });
    },
});

// Counterpart of `getFinished`. The index returns the dates already sorted by
// timestamp ascending, matching the old `orderBy asc(timestamp)`.
export const getForBook = query({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const userId = await getUserId(ctx);
        if (!userId) return [];

        const finished = await getFinishedForBook(ctx, { userId, bookId });
        return finished.map(publishFinished);
    },
});
