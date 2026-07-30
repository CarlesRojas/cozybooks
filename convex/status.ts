// Book-status flows. Each one is a single transactional mutation over the library rows
// and finished dates; mirroring the change onto the user's Google "My Library" shelves is
// scheduled server-side so it never blocks the user-facing write.

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { BOOKSHELF } from "./lib/googleBooks";
import { addBookToLibrary, getLibraryEntry, removeBookFromLibrary, upsertBook } from "./lib/model";
import { bookArgs } from "./lib/validators";

const googleTokenArg = { googleToken: v.optional(v.string()) };

type BookshelfOp = { op: "add" | "remove"; bookshelf: number };

const scheduleBookshelfSync = async (
    ctx: MutationCtx,
    { googleToken, volumeId, ops }: { googleToken?: string; volumeId: string; ops: Array<BookshelfOp> },
) => {
    // Loud on purpose: a missing token means the change will never reach Google, and
    // a silent skip here is indistinguishable from a Google-side failure in the logs.
    if (!googleToken) {
        console.warn(`Google shelf sync skipped for volume ${volumeId}: no Google token was provided`);
        return;
    }
    await ctx.scheduler.runAfter(0, internal.googleBooks.syncBookshelves, { googleToken, volumeId, ops });
};

export const addToWantToRead = mutation({
    args: { book: v.object(bookArgs), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { book, userId, googleToken }) => {
        await upsertBook(ctx, book);
        await addBookToLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
        await scheduleBookshelfSync(ctx, { googleToken, volumeId: book.id, ops: [{ op: "add", bookshelf: BOOKSHELF.TO_READ }] });
    },
});

export const removeFromWantToRead = mutation({
    args: { bookId: v.string(), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { bookId, userId, googleToken }) => {
        await removeBookFromLibrary(ctx, { userId, type: "TO_READ", bookId });
        await scheduleBookshelfSync(ctx, { googleToken, volumeId: bookId, ops: [{ op: "remove", bookshelf: BOOKSHELF.TO_READ }] });
    },
});

// Leaves TO_READ, enters READING.
export const startReading = mutation({
    args: { book: v.object(bookArgs), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { book, userId, googleToken }) => {
        await upsertBook(ctx, book);
        await removeBookFromLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
        await addBookToLibrary(ctx, { userId, type: "READING", bookId: book.id });
        await scheduleBookshelfSync(ctx, {
            googleToken,
            volumeId: book.id,
            ops: [
                { op: "remove", bookshelf: BOOKSHELF.TO_READ },
                { op: "add", bookshelf: BOOKSHELF.READING_NOW },
            ],
        });
    },
});

// Leaves READING, back to TO_READ.
export const stopReading = mutation({
    args: { book: v.object(bookArgs), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { book, userId, googleToken }) => {
        await upsertBook(ctx, book);
        await removeBookFromLibrary(ctx, { userId, type: "READING", bookId: book.id });
        await addBookToLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
        await scheduleBookshelfSync(ctx, {
            googleToken,
            volumeId: book.id,
            ops: [
                { op: "remove", bookshelf: BOOKSHELF.READING_NOW },
                { op: "add", bookshelf: BOOKSHELF.TO_READ },
            ],
        });
    },
});

// Leaves READING, enters FINISHED and records a finished date.
export const finishBook = mutation({
    args: { book: v.object(bookArgs), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { book, userId, googleToken }) => {
        await upsertBook(ctx, book);
        await removeBookFromLibrary(ctx, { userId, type: "READING", bookId: book.id });
        await addBookToLibrary(ctx, { userId, type: "FINISHED", bookId: book.id });
        await ctx.db.insert("finished", { userId, bookId: book.id, timestamp: Date.now() });
        await scheduleBookshelfSync(ctx, {
            googleToken,
            volumeId: book.id,
            ops: [
                { op: "remove", bookshelf: BOOKSHELF.READING_NOW },
                { op: "add", bookshelf: BOOKSHELF.HAVE_READ },
            ],
        });
    },
});

export const removeFromFinished = mutation({
    args: { bookId: v.string(), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { bookId, userId, googleToken }) => {
        await removeBookFromLibrary(ctx, { userId, type: "FINISHED", bookId });
        await scheduleBookshelfSync(ctx, { googleToken, volumeId: bookId, ops: [{ op: "remove", bookshelf: BOOKSHELF.HAVE_READ }] });
    },
});

// Two point reads, and reactive: status buttons update live after mutations.
export const getBookStatus = query({
    args: { bookId: v.string(), userId: v.string() },
    handler: async (ctx, { bookId, userId }) => {
        const [reading, toRead] = await Promise.all([
            getLibraryEntry(ctx, { userId, type: "READING", bookId }),
            getLibraryEntry(ctx, { userId, type: "TO_READ", bookId }),
        ]);

        if (reading) return "READING_NOW";
        if (toRead) return "WANT_TO_READ";
        return "NONE";
    },
});
