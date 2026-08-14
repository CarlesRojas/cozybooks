// Books a user writes themselves, for everything the catalogue doesn't have: a
// self-published copy, a fanzine, a manuscript, a book Google simply doesn't list.
//
// They are rows in the same `books` table as catalogue volumes, distinguished by an
// `ownerId` and an id carrying the `custom:` prefix. That is the whole trick: the
// library shelves, the ratings, the finished dates, the book page and the search all
// key off a book id string, so a custom book flows through every one of them without
// a single special case — apart from the one that matters, which is that a book with
// an owner is only ever returned to that owner.

import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { CUSTOM_BOOK_ID_PREFIX, getOwnedCustomBook } from "./lib/model";
import { publishBook } from "./lib/publish";

// Cover images live in Vercel Blob; the book keeps the public URL. It is written to
// both `thumbnail` and `large` so the two size helpers on the frontend
// (`getSmallestBookImage` / `getBiggestBookImage`) each find it — a custom book has
// exactly one rendition, unlike the six Google returns.
const coverFields = (coverUrl: string | undefined) => ({
    smallThumbnail: undefined,
    thumbnail: coverUrl,
    small: undefined,
    medium: undefined,
    large: coverUrl,
    extraLarge: undefined,
});

// Everything the book page shows, and nothing else: title, authors, description,
// page count, cover, tags. Tags are stored in `categories`, which is where the book
// page already reads them from.
const customBookInput = {
    title: v.string(),
    authors: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    categories: v.optional(v.array(v.string())),
    coverUrl: v.optional(v.string()),
};

// The id has to contain the row's own id to be unique, and the row doesn't have one
// until it exists — hence insert, then patch. Both happen inside the one mutation,
// so no reader ever observes the placeholder.
export const create = mutation({
    args: { userId: v.string(), ...customBookInput },
    handler: async (ctx, { userId, coverUrl, ...fields }) => {
        const id = await ctx.db.insert("books", {
            googleId: "",
            ownerId: userId,
            createdAt: Date.now(),
            ...fields,
            ...coverFields(coverUrl),
        });

        const bookId = `${CUSTOM_BOOK_ID_PREFIX}${id}`;
        await ctx.db.patch(id, { googleId: bookId });

        return bookId;
    },
});

// Returns the cover URL that is no longer in use, if any, so the caller can drop the
// blob behind it. Convex has no access to the Blob store — the app server does.
export const update = mutation({
    args: { bookId: v.string(), userId: v.string(), ...customBookInput },
    handler: async (ctx, { bookId, userId, coverUrl, ...fields }) => {
        const book = await getOwnedCustomBook(ctx, bookId, userId);
        if (!book) return { discardedCoverUrl: undefined };

        const previousCoverUrl = book.large;
        await ctx.db.patch(book._id, { ...fields, ...coverFields(coverUrl) });

        return { discardedCoverUrl: previousCoverUrl && previousCoverUrl !== coverUrl ? previousCoverUrl : undefined };
    },
});

// Deleting the book has to take its shelves, ratings and finished dates with it:
// nothing else will ever clean them up, and a catalogue book's rows can at least be
// re-joined to a book that still exists. Only the owner can hold any of them, so
// this user's rows are all of them.
export const remove = mutation({
    args: { bookId: v.string(), userId: v.string() },
    handler: async (ctx, { bookId, userId }) => {
        const book = await getOwnedCustomBook(ctx, bookId, userId);
        if (!book) return { discardedCoverUrl: undefined };

        const libraryEntries = await ctx.db
            .query("library")
            .withIndex("by_user_type_created", (q) => q.eq("userId", userId))
            .collect();

        const finished = await ctx.db
            .query("finished")
            .withIndex("by_user_book_time", (q) => q.eq("userId", userId).eq("bookId", bookId))
            .collect();

        const rating = await ctx.db
            .query("ratings")
            .withIndex("by_user_book", (q) => q.eq("userId", userId).eq("bookId", bookId))
            .unique();

        await Promise.all([
            ...libraryEntries.filter((entry) => entry.bookId === bookId).map((entry) => ctx.db.delete(entry._id)),
            ...finished.map((entry) => ctx.db.delete(entry._id)),
            ...(rating ? [ctx.db.delete(rating._id)] : []),
        ]);

        await ctx.db.delete(book._id);

        return { discardedCoverUrl: book.large };
    },
});

const listForUser = async (ctx: QueryCtx, userId: string) =>
    await ctx.db
        .query("books")
        .withIndex("by_owner_created", (q) => q.eq("ownerId", userId))
        .order("desc")
        .collect();

// The Custom books page: everything this user has written, newest first.
export const list = query({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const books = await listForUser(ctx, userId);
        return books.map(publishBook);
    },
});

// Matches on title, author or tag — a substring match rather than anything cleverer,
// because a user's own books number in the dozens, not the millions, and every one
// of them is a book they typed in themselves and will search for by a word they know
// is in it.
const matches = (book: Doc<"books">, terms: Array<string>) => {
    const haystack = [book.title ?? "", ...(book.authors ?? []), ...(book.categories ?? [])].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
};

// Feeds the catalogue search in `googleBooks.ts`, which is an action and so can only
// reach the database through a query.
export const searchOwn = internalQuery({
    args: { userId: v.string(), query: v.string() },
    handler: async (ctx, { userId, query: search }) => {
        const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length === 0) return [];

        const books = await listForUser(ctx, userId);
        return books.filter((book) => matches(book, terms)).map(publishBook);
    },
});
