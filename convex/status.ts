// Counterparts of the book-status flows in `src/server/use/status/*` and
// `src/server/use/useBookStatus.ts`.
//
// The old flows orchestrated 2-5 sequential server calls from the browser (add/remove
// library rows, insert finished dates, sync Google bookshelves). Each flow is now a
// single transactional mutation; the Google Bookshelf sync (best-effort in the old
// code too — errors were swallowed) is scheduled server-side so it never blocks the
// user-facing write.

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
    if (!googleToken) return;
    await ctx.scheduler.runAfter(0, internal.googleBooks.syncBookshelves, { googleToken, volumeId, ops });
};

// Counterpart of `addToWantToRead` (`useAddToWantToRead.ts`).
export const addToWantToRead = mutation({
    args: { book: v.object(bookArgs), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { book, userId, googleToken }) => {
        await upsertBook(ctx, book);
        await addBookToLibrary(ctx, { userId, type: "TO_READ", bookId: book.id });
        await scheduleBookshelfSync(ctx, { googleToken, volumeId: book.id, ops: [{ op: "add", bookshelf: BOOKSHELF.TO_READ }] });
    },
});

// Counterpart of `removeFromWantToRead` (`useRemoveFromWantToRead.ts`).
export const removeFromWantToRead = mutation({
    args: { bookId: v.string(), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { bookId, userId, googleToken }) => {
        await removeBookFromLibrary(ctx, { userId, type: "TO_READ", bookId });
        await scheduleBookshelfSync(ctx, { googleToken, volumeId: bookId, ops: [{ op: "remove", bookshelf: BOOKSHELF.TO_READ }] });
    },
});

// Counterpart of `startReading` (`useStartReading.ts`): leaves TO_READ, enters READING.
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

// Counterpart of `stopReading` (`useStopReading.ts`): leaves READING, back to TO_READ.
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

// Counterpart of `finishBook` (`useFinishBook.ts`): leaves READING, enters FINISHED
// and records a finished date.
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

// Counterpart of `removeFromFinished` (`useRemoveBookFromFinished.ts`).
export const removeFromFinished = mutation({
    args: { bookId: v.string(), userId: v.string(), ...googleTokenArg },
    handler: async (ctx, { bookId, userId, googleToken }) => {
        await removeBookFromLibrary(ctx, { userId, type: "FINISHED", bookId });
        await scheduleBookshelfSync(ctx, { googleToken, volumeId: bookId, ops: [{ op: "remove", bookshelf: BOOKSHELF.HAVE_READ }] });
    },
});

// Counterpart of `getBookStatus` (`useBookStatus.ts`). Two point reads instead of two
// sequential server calls, and reactive: status buttons update live after mutations.
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
