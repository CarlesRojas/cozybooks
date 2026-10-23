// Everything the Android home-screen widget talks to. The widget is native code, so it
// can't reuse the better-auth session living inside Chrome; the web app mints a
// long-lived token here (an action, because queries and mutations lack Web Crypto) and
// hands it to the app through a cozybooks:// deep link. HTTP requests then arrive in
// `http.ts` carrying the token, get hashed and resolved to a user id here, and read the
// same shelves the app shows. Widget tokens are strictly read-only: the only thing they
// unlock is the sections payload below.

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getUserId, requireUserId } from "./lib/auth";
import { getBookByGoogleId, getFinishedForBook, isBookVisibleTo } from "./lib/model";

// A user re-pairing devices shouldn't grow tokens without bound, but replacing the token
// on every pairing would break the previous device. Keep a small pool instead.
const MAX_TOKENS_PER_USER = 5;

const bytesToHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function hashWidgetToken(token: string) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    return bytesToHex(new Uint8Array(digest));
}

export const mintWidgetToken = action({
    args: {},
    handler: async (ctx): Promise<{ token: string }> => {
        const userId = await requireUserId(ctx);

        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const token = bytesToHex(bytes);

        await ctx.runMutation(internal.widget.storeToken, { userId, tokenHash: await hashWidgetToken(token) });

        return { token };
    },
});

export const storeToken = internalMutation({
    args: { userId: v.string(), tokenHash: v.string() },
    handler: async (ctx, { userId, tokenHash }) => {
        await ctx.db.insert("widgetTokens", { userId, tokenHash, createdAt: Date.now(), lastUsedAt: null });

        const tokens = await ctx.db
            .query("widgetTokens")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        const excess = tokens.sort((a, b) => a.createdAt - b.createdAt).slice(0, Math.max(0, tokens.length - MAX_TOKENS_PER_USER));
        for (const token of excess) await ctx.db.delete(token._id);
    },
});

export const revokeWidgetTokens = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUserId(ctx);

        const tokens = await ctx.db
            .query("widgetTokens")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const token of tokens) await ctx.db.delete(token._id);
    },
});

// Null while the session is still arriving, rather than throwing, so the widget page
// can render before its token has.
export const getWidgetTokenStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        if (!userId) return null;

        const tokens = await ctx.db
            .query("widgetTokens")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        return { tokenCount: tokens.length };
    },
});

export const getUserByTokenHash = internalQuery({
    args: { tokenHash: v.string() },
    handler: async (ctx, { tokenHash }) => {
        const token = await ctx.db
            .query("widgetTokens")
            .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
            .unique();

        if (!token) return null;

        return { tokenId: token._id, userId: token.userId, lastUsedAt: token.lastUsedAt };
    },
});

export const touchToken = internalMutation({
    args: { tokenId: v.id("widgetTokens") },
    handler: async (ctx, { tokenId }) => {
        const token = await ctx.db.get(tokenId);
        if (token) await ctx.db.patch(tokenId, { lastUsedAt: Date.now() });
    },
});

// --- Section payload -------------------------------------------------------------------

// The widget renders the app's shelves as read-only covers: same titles, and a tap that
// opens the book in the app. Nothing writable travels in the payload.

const SITE_URL = "https://www.cozybooks.app";
const MAX_WIDGET_SECTION_ITEMS = 12;

export interface WidgetItem {
    bookId: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    appUrl: string;
}

export interface WidgetSection {
    key: string;
    title: string;
    items: Array<WidgetItem>;
}

const biggestImage = (book: Doc<"books">) =>
    book.extraLarge ?? book.large ?? book.medium ?? book.small ?? book.thumbnail ?? book.smallThumbnail;

// The cover `BookCover` shows: Google's front cover at the size the app asks for when
// the volume has one, otherwise the biggest image on record. Always https, since
// Android blocks cleartext and Google Books still hands out http links.
const coverUrl = (book: Doc<"books">) => {
    const biggest = biggestImage(book);
    if (!biggest) return null;

    const id = new URLSearchParams(biggest.split("?")[1] ?? "").get("id");
    if (id) return `https://books.google.com/books/publisher/content/images/frontcover/${id}?fife=w400-h616&source=gbs_api`;

    return biggest.replace(/^http:\/\//, "https://");
};

const widgetItem = (book: Doc<"books">): WidgetItem => ({
    bookId: book.googleId,
    title: book.title ?? "",
    author: book.authors?.[0] ?? null,
    coverUrl: coverUrl(book),
    appUrl: `${SITE_URL}/book/${encodeURIComponent(book.googleId)}`,
});

const shelf = async (ctx: QueryCtx, userId: string, type: Doc<"library">["type"]) => {
    const entries = await ctx.db
        .query("library")
        .withIndex("by_user_type_created", (q) => q.eq("userId", userId).eq("type", type))
        .order("desc")
        .collect();

    const books = await Promise.all(entries.map((entry) => getBookByGoogleId(ctx, entry.bookId)));
    return books.filter((book): book is Doc<"books"> => !!book && isBookVisibleTo(book, userId));
};

export const getWidgetSections = internalQuery({
    // The bounds of the current year in the phone's own time zone, which is how the app
    // decides what counts as this year too (`getFullYear()` in the browser).
    args: { userId: v.string(), yearStart: v.number(), yearEnd: v.number() },
    handler: async (ctx, { userId, yearStart, yearEnd }): Promise<{ sections: Array<WidgetSection> }> => {
        const [reading, toRead, finished] = await Promise.all([
            shelf(ctx, userId, "READING"),
            shelf(ctx, userId, "TO_READ"),
            shelf(ctx, userId, "FINISHED"),
        ]);

        // Finished this year, most recently finished first. A reread finished twice this
        // year still shows once.
        const finishedThisYear = (
            await Promise.all(
                finished.map(async (book) => {
                    const dates = await getFinishedForBook(ctx, { userId, bookId: book.googleId });
                    const latest = dates
                        .map((date) => date.timestamp)
                        .filter((timestamp) => timestamp >= yearStart && timestamp < yearEnd)
                        .reduce<number | null>((max, timestamp) => (max === null || timestamp > max ? timestamp : max), null);

                    return latest === null ? null : { book, latest };
                }),
            )
        )
            .filter((entry) => entry !== null)
            .sort((a, b) => b.latest - a.latest)
            .map((entry) => entry.book);

        return {
            sections: [
                { key: "reading", title: "Reading", items: reading.slice(0, MAX_WIDGET_SECTION_ITEMS).map(widgetItem) },
                { key: "to-read", title: "Want to read", items: toRead.slice(0, MAX_WIDGET_SECTION_ITEMS).map(widgetItem) },
                {
                    key: "finished-year",
                    title: "Finished this year",
                    items: finishedThisYear.slice(0, MAX_WIDGET_SECTION_ITEMS).map(widgetItem),
                },
            ],
        };
    },
});
