// Book-status flows. Whose shelves are being moved comes from the verified token —
// see `convex/lib/auth.ts`.
//
// Book-status flows. Each one is a single transactional mutation over the library rows
// and finished dates. The Convex tables are the sole source of truth — the old mirror
// onto the user's Google "My Library" shelves was removed along with the rest of the
// deprecated `mylibrary` integration.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId, requireUserId } from "./lib/auth";
import { addBookToLibrary, getLibraryEntry, removeBookFromLibrary, upsertBook } from "./lib/model";
import { bookArgs } from "./lib/validators";

export const addToWantToRead = mutation({
    args: { book: v.object(bookArgs) },
    handler: async (ctx, { book }) => {
        const userId = await requireUserId(ctx);

        await upsertBook(ctx, book);
        await addBookToLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
    },
});

export const removeFromWantToRead = mutation({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const userId = await requireUserId(ctx);
        await removeBookFromLibrary(ctx, { userId, type: "TO_READ", bookId });
    },
});

// Leaves TO_READ, enters READING.
export const startReading = mutation({
    args: { book: v.object(bookArgs) },
    handler: async (ctx, { book }) => {
        const userId = await requireUserId(ctx);

        await upsertBook(ctx, book);
        await removeBookFromLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
        await addBookToLibrary(ctx, { userId, type: "READING", bookId: book.id });
    },
});

// Leaves READING, back to TO_READ.
export const stopReading = mutation({
    args: { book: v.object(bookArgs) },
    handler: async (ctx, { book }) => {
        const userId = await requireUserId(ctx);

        await upsertBook(ctx, book);
        await removeBookFromLibrary(ctx, { userId, type: "READING", bookId: book.id });
        await addBookToLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
    },
});

// Leaves READING, enters FINISHED and records a finished date.
export const finishBook = mutation({
    args: { book: v.object(bookArgs) },
    handler: async (ctx, { book }) => {
        const userId = await requireUserId(ctx);

        await upsertBook(ctx, book);
        await removeBookFromLibrary(ctx, { userId, type: "READING", bookId: book.id });
        await addBookToLibrary(ctx, { userId, type: "FINISHED", bookId: book.id });
        await ctx.db.insert("finished", { userId, bookId: book.id, timestamp: Date.now() });
    },
});

export const removeFromFinished = mutation({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const userId = await requireUserId(ctx);
        await removeBookFromLibrary(ctx, { userId, type: "FINISHED", bookId });
    },
});

// Two point reads, and reactive: status buttons update live after mutations.
export const getBookStatus = query({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const userId = await getUserId(ctx);
        if (!userId) return "NONE";

        const [reading, toRead] = await Promise.all([
            getLibraryEntry(ctx, { userId, type: "READING", bookId }),
            getLibraryEntry(ctx, { userId, type: "TO_READ", bookId }),
        ]);

        if (reading) return "READING_NOW";
        if (toRead) return "WANT_TO_READ";
        return "NONE";
    },
});
