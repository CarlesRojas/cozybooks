// Shared database helpers used by the public functions. Keeping them here lets the
// composite mutations in `status.ts` reuse the exact same logic as the low-level
// counterparts in `books.ts` / `library.ts` / `finished.ts`, all inside a single
// transaction (Convex mutations are transactional).

import type { Infer } from "convex/values";
import type { Doc } from "../_generated/dataModel";
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

// Ids of user-created books, so a book id alone says whether it is a catalogue
// volume or somebody's own.
//
// Letters and a hyphen, nothing more exotic, because a book id has to survive two
// places that are picky about characters: a url path segment, and the CSS
// `view-transition-name` the covers are animated by, which only accepts an
// identifier. A Google volume id could in principle begin with these seven
// characters — it is a 12-character base64url string — but the odds are around one
// in ten trillion, and the cost of the collision is one book falling back to "not
// found".
export const CUSTOM_BOOK_ID_PREFIX = "custom-";

export const isCustomBookId = (bookId: string) => bookId.startsWith(CUSTOM_BOOK_ID_PREFIX);

// A catalogue book is everybody's; a custom book is only its owner's. Every read
// that can return a book runs through this — a missing `userId` sees the catalogue
// and nothing else.
export const isBookVisibleTo = (book: Doc<"books">, userId: string | undefined) => !book.ownerId || book.ownerId === userId;

export const getVisibleBook = async (ctx: QueryCtx, bookId: string, userId: string | undefined) => {
    const book = await getBookByGoogleId(ctx, bookId);
    return book && isBookVisibleTo(book, userId) ? book : null;
};

// Custom books are edited and deleted through their own mutations, which all start
// here: no id that isn't this user's own book gets any further.
export const getOwnedCustomBook = async (ctx: QueryCtx, bookId: string, userId: string) => {
    const book = await getBookByGoogleId(ctx, bookId);
    return book && book.ownerId === userId ? book : null;
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

export const addBookToLibrary = async (
    ctx: MutationCtx,
    { userId, type, bookId }: { userId: string; type: LibraryType; bookId: string },
) => {
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
