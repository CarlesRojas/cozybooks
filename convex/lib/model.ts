// Shared database helpers used by the public functions. Keeping them here lets the
// composite mutations in `status.ts` reuse the exact same logic as the low-level
// counterparts in `books.ts` / `library.ts` / `finished.ts`, all inside a single
// transaction (Convex mutations are transactional).

import type { Infer } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { libraryTypeValidator } from "../schema";
import type { bookValidator } from "./validators";

export type LibraryType = Infer<typeof libraryTypeValidator>;
export type BookInput = Infer<typeof bookValidator>;

export const getBookByGoogleId = async (ctx: QueryCtx, googleId: string) => {
    return await ctx.db
        .query("books")
        .withIndex("by_google_id", (q) => q.eq("googleId", googleId))
        .unique();
};

// Insert-if-missing, like the old `addBook` whose duplicate-key errors were always
// swallowed by callers. Never overwrites an existing cached book.
export const upsertBook = async (ctx: MutationCtx, book: BookInput) => {
    const { id, ...fields } = book;
    const existing = await getBookByGoogleId(ctx, id);
    if (existing) return existing._id;
    return await ctx.db.insert("books", { googleId: id, ...fields });
};

export const getLibraryEntry = async (ctx: QueryCtx, { userId, type, bookId }: { userId: string; type: LibraryType; bookId: string }) => {
    return await ctx.db
        .query("library")
        .withIndex("by_user_type_book", (q) => q.eq("userId", userId).eq("type", type).eq("bookId", bookId))
        .unique();
};

const getLibraryRemoval = async (ctx: QueryCtx, { userId, type, bookId }: { userId: string; type: LibraryType; bookId: string }) => {
    return await ctx.db
        .query("libraryRemovals")
        .withIndex("by_user_type_book", (q) => q.eq("userId", userId).eq("type", type).eq("bookId", bookId))
        .unique();
};

export const addBookToLibrary = async (
    ctx: MutationCtx,
    { userId, type, bookId }: { userId: string; type: LibraryType; bookId: string },
) => {
    // A re-added book must not be removed from Google by a stale tombstone.
    const removal = await getLibraryRemoval(ctx, { userId, type, bookId });
    if (removal) await ctx.db.delete(removal._id);

    const existing = await getLibraryEntry(ctx, { userId, type, bookId });
    if (existing) return existing._id;
    return await ctx.db.insert("library", { userId, type, bookId, createdAt: Date.now() });
};

export const removeBookFromLibrary = async (
    ctx: MutationCtx,
    { userId, type, bookId }: { userId: string; type: LibraryType; bookId: string },
) => {
    const existing = await getLibraryEntry(ctx, { userId, type, bookId });
    if (!existing) return;

    await ctx.db.delete(existing._id);

    // Tombstone so the daily Google reconciliation propagates this removal even if
    // the immediate best-effort mirror (status.ts) fails or runs without a token.
    const removal = await getLibraryRemoval(ctx, { userId, type, bookId });
    if (removal) await ctx.db.patch(removal._id, { removedAt: Date.now() });
    else await ctx.db.insert("libraryRemovals", { userId, type, bookId, removedAt: Date.now() });
};

export const getFinishedForBook = async (ctx: QueryCtx, { userId, bookId }: { userId: string; bookId: string }) => {
    return await ctx.db
        .query("finished")
        .withIndex("by_user_book_time", (q) => q.eq("userId", userId).eq("bookId", bookId))
        .collect();
};

export const getRatingEntry = async (ctx: QueryCtx, { userId, bookId }: { userId: string; bookId: string }) => {
    return await ctx.db
        .query("ratings")
        .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
        .unique();
};
