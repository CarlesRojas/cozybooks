// Counterpart of `src/server/repo/library.ts`.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
    addBookToLibrary,
    getBookByGoogleId,
    getFinishedForBook,
    getLibraryEntry,
    getRatingEntry,
    removeBookFromLibrary,
} from "./lib/model";
import { publishBook, publishFinished } from "./lib/publish";
import { libraryTypeValidator } from "./schema";

const libraryEntryArgs = {
    userId: v.string(),
    bookId: v.string(),
    type: libraryTypeValidator,
};

// Counterpart of `addBookToLibrary`. Idempotent (the old primary key made duplicates fail).
export const add = mutation({
    args: libraryEntryArgs,
    handler: async (ctx, args) => {
        await addBookToLibrary(ctx, args);
    },
});

// Counterpart of `removeBookFromLibrary`.
export const remove = mutation({
    args: libraryEntryArgs,
    handler: async (ctx, args) => {
        await removeBookFromLibrary(ctx, args);
    },
});

// Counterpart of `isBookInLibrary`. Point read through the `by_user_type_book` index.
export const isInLibrary = query({
    args: libraryEntryArgs,
    handler: async (ctx, args) => {
        return !!(await getLibraryEntry(ctx, args));
    },
});

// Counterpart of `getLibraryBooks`. The old version ran a COUNT query plus a
// three-way relational join; here it's one index range read (already sorted by
// creation date descending) and the per-book joins for the requested page happen
// in parallel through point-read indexes.
export const getBooks = query({
    args: {
        userId: v.string(),
        type: libraryTypeValidator,
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (ctx, { userId, type, maxResults, startIndex }) => {
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

                if (!book) return null;

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
