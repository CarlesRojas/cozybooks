import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { catalogueParams, googleBooksRequest, parseGoogleVolume } from "./lib/googleBooks";
import { getBookByGoogleId, upsertBook } from "./lib/model";
import { publishBook } from "./lib/publish";
import type { PublishedBook } from "./lib/publish";
import { bookArgs } from "./lib/validators";

// Idempotent: inserting an already-cached book is a no-op.
export const add = mutation({
    args: bookArgs,
    handler: async (ctx, book) => {
        await upsertBook(ctx, book);
    },
});

// Point read through the `by_google_id` index.
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

// Serve from the Convex cache, otherwise fetch the volume from the Google Books API and
// cache it. Requires the GOOGLE_BOOKS_API_KEY environment variable on the Convex
// deployment.
export const getWithGoogleFallback = action({
    args: { bookId: v.string() },
    // Explicit annotations break the type-inference cycle caused by referencing
    // `internal.books.*` from this same module.
    handler: async (ctx, { bookId }): Promise<PublishedBook | null> => {
        const cached: PublishedBook | null = await ctx.runQuery(internal.books.getCached, { bookId });
        if (cached) return cached;

        try {
            const data = await googleBooksRequest({
                path: `/volumes/${bookId}`,
                params: { ...catalogueParams(), projection: "full" },
            });

            const parsed = parseGoogleVolume(data);
            if (!parsed) return null;

            const { googleId, ...fields } = parsed;
            await ctx.runMutation(internal.books.cache, { id: googleId, ...fields });
            return { id: googleId, ...fields };
        } catch (error) {
            // A missing book renders as "not found" rather than crashing the page, but
            // the reason still has to reach the logs — otherwise an API key or geo
            // problem looks identical to a book that genuinely isn't in the catalogue.
            console.error(`Google Books lookup for volume ${bookId} failed`, error);
            return null;
        }
    },
});
