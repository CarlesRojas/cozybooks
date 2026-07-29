// Counterpart of `src/server/repo/book.ts`.

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { GOOGLE_BOOKS_URL, parseGoogleVolume } from "./lib/googleBooks";
import { getBookByGoogleId, upsertBook } from "./lib/model";
import { publishBook } from "./lib/publish";
import type { PublishedBook } from "./lib/publish";
import { bookArgs } from "./lib/validators";

// Counterpart of `addBook`. Idempotent: inserting an already-cached book is a no-op
// (callers of the old version always swallowed the duplicate-key error).
export const add = mutation({
    args: bookArgs,
    handler: async (ctx, book) => {
        await upsertBook(ctx, book);
    },
});

// Counterpart of `getBook`. Point read through the `by_google_id` index.
export const get = query({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const book = await getBookByGoogleId(ctx, bookId);
        return book ? publishBook(book) : null;
    },
});

export const getCached = internalQuery({
    args: { bookId: v.string() },
    handler: async (ctx, { bookId }) => {
        const book = await getBookByGoogleId(ctx, bookId);
        return book ? publishBook(book) : null;
    },
});

export const cache = internalMutation({
    args: bookArgs,
    handler: async (ctx, book) => {
        await upsertBook(ctx, book);
    },
});

// Counterpart of `getBookWithGoogleFallback`: serve from the Convex cache, otherwise
// fetch the volume from the Google Books API and cache it. Requires the
// GOOGLE_BOOKS_API_KEY environment variable on the Convex deployment.
export const getWithGoogleFallback = action({
    args: { bookId: v.string() },
    // Explicit annotations break the type-inference cycle caused by referencing
    // `internal.books.*` from this same module.
    handler: async (ctx, { bookId }): Promise<PublishedBook | null> => {
        const cached: PublishedBook | null = await ctx.runQuery(internal.books.getCached, { bookId });
        if (cached) return cached;

        const url = new URL(`${GOOGLE_BOOKS_URL}/volumes/${bookId}`);
        url.search = new URLSearchParams({ key: process.env.GOOGLE_BOOKS_API_KEY ?? "", projection: "full" }).toString();

        try {
            const response = await fetch(url.toString());
            if (!response.ok) return null;

            const parsed = parseGoogleVolume(await response.json());
            if (!parsed) return null;

            const { googleId, ...fields } = parsed;
            await ctx.runMutation(internal.books.cache, { id: googleId, ...fields });
            return { id: googleId, ...fields };
        } catch {
            return null;
        }
    },
});
