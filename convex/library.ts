// Counterpart of `src/server/repo/library.ts`.
//
// Whose library is being read or written comes from the verified token now (see
// `convex/lib/auth.ts`), not from an argument. Reads degrade to an empty shelf while
// signed out rather than throwing, the same way the book page renders for a visitor;
// writes require a session.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId, requireUserId } from "./lib/auth";
import {
    addBookToLibrary,
    getBookByGoogleId,
    getFinishedForBook,
    getLibraryEntry,
    getRatingEntry,
    isBookVisibleTo,
    removeBookFromLibrary,
} from "./lib/model";
import { publishBook, publishFinished } from "./lib/publish";
import { libraryTypeValidator } from "./schema";

const libraryEntryArgs = {
    bookId: v.string(),
    type: libraryTypeValidator,
};

// Counterpart of `addBookToLibrary`. Idempotent (the old primary key made duplicates fail).
export const add = mutation({
    args: libraryEntryArgs,
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        await addBookToLibrary(ctx, { ...args, userId });
    },
});

// Counterpart of `removeBookFromLibrary`.
export const remove = mutation({
    args: libraryEntryArgs,
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        await removeBookFromLibrary(ctx, { ...args, userId });
    },
});

// Counterpart of `isBookInLibrary`. Point read through the `by_user_type_book` index.
export const isInLibrary = query({
    args: libraryEntryArgs,
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        if (!userId) return false;

        return !!(await getLibraryEntry(ctx, { ...args, userId }));
    },
});

// Counterpart of `getLibraryBooks`. The old version ran a COUNT query plus a
// three-way relational join; here it's one index range read (already sorted by
// creation date descending) and the per-book joins for the requested page happen
// in parallel through point-read indexes.
export const getBooks = query({
    args: {
        type: libraryTypeValidator,
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (ctx, { type, maxResults, startIndex }) => {
        const userId = await getUserId(ctx);
        if (!userId) return { totalItems: 0, items: [] };

        const entries = await ctx.db
            .query("library")
            .withIndex("by_user_type_created", (q) => q.eq("userId", userId).eq("type", type))
            .order("desc")
            .collect();

        const start = startIndex ?? 0;
        const page = entries.slice(start, maxResults !== undefined ? start + maxResults : undefined);

        const items = await Promise.all(
            page.map(async (entry) => {
                const [book, finished, rating] = await Promise.all([
                    getBookByGoogleId(ctx, entry.bookId),
                    getFinishedForBook(ctx, { userId, bookId: entry.bookId }),
                    getRatingEntry(ctx, { userId, bookId: entry.bookId }),
                ]);

                // A shelf can only ever hold this user's own books, so this filter has
                // nothing to do under normal use. It is here because it is the last
                // read that returns a book's contents, and a custom book must not come
                // back through it either — a stray library row pointing at somebody
                // else's private book would otherwise publish it.
                if (!book || !isBookVisibleTo(book, userId)) return null;

                return {
                    ...publishBook(book),
                    finished: finished.map(publishFinished),
                    rating: rating ? [{ rating: rating.rating }] : [],
                };
            }),
        );

        return {
            totalItems: entries.length,
            items: items.filter((item) => item !== null),
        };
    },
});
