// Counterparts of `src/server/repo/google.ts`, `src/server/use/useSearchedBooks.ts`
// and `src/server/use/useBookShelf.ts` — everything that talks to the Google Books
// API with the user's Google OAuth token.

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { GOOGLE_BOOKS_URL, googleBooksCountry, googleBooksFetch, parseGoogleVolume } from "./lib/googleBooks";

const publishVolume = (volume: ReturnType<typeof parseGoogleVolume>) => {
    if (!volume) return null;
    const { googleId, ...fields } = volume;
    return { id: googleId, ...fields };
};

const parseVolumesResponse = (data: any) => {
    const totalItems: number = typeof data.totalItems === "number" ? data.totalItems : 0;
    const rawItems: Array<any> = Array.isArray(data.items) ? data.items : [];

    return {
        totalItems,
        items: rawItems.map((item) => publishVolume(parseGoogleVolume(item))).filter((item) => item !== null),
    };
};

// Counterpart of `addToGoogleBookshelf` / `removeFromGoogleBookshelf`. Runs as a
// scheduled internal action (see `status.ts`) so bookshelf syncing happens off the
// critical path. Best-effort like the old code: failures are ignored.
export const syncBookshelves = internalAction({
    args: {
        googleToken: v.string(),
        volumeId: v.string(),
        ops: v.array(
            v.object({
                op: v.union(v.literal("add"), v.literal("remove")),
                bookshelf: v.number(),
            }),
        ),
    },
    handler: async (_ctx, { googleToken, volumeId, ops }) => {
        for (const { op, bookshelf } of ops) {
            const endpoint = op === "add" ? "addVolume" : "removeVolume";
            const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${bookshelf}/${endpoint}`);
            url.search = new URLSearchParams({ access_token: googleToken, volumeId }).toString();

            try {
                await fetch(url.toString(), { method: "POST" });
            } catch {}
        }
    },
});

// Counterpart of `searchBooks` (`useSearchedBooks.ts`).
export const search = action({
    args: {
        googleToken: v.string(),
        query: v.string(),
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (_ctx, { googleToken, query, maxResults, startIndex }) => {
        if (!query.trim()) return { totalItems: 0, items: [] };

        const url = new URL(`${GOOGLE_BOOKS_URL}/volumes`);
        url.search = new URLSearchParams({
            access_token: googleToken,
            q: query.trim(),
            maxResults: (maxResults ?? 8).toString(),
            startIndex: (startIndex ?? 0).toString(),
            printType: "books",
            orderBy: "relevance",
            country: googleBooksCountry(),
        }).toString();

        return parseVolumesResponse(await googleBooksFetch(url));
    },
});

// Counterpart of `getBookShelf` (`useBookShelf.ts`).
export const getBookShelf = action({
    args: {
        googleToken: v.string(),
        bookshelf: v.number(),
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (_ctx, { googleToken, bookshelf, maxResults, startIndex }) => {
        const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${bookshelf}/volumes`);
        url.search = new URLSearchParams({
            access_token: googleToken,
            maxResults: (maxResults ?? 8).toString(),
            startIndex: (startIndex ?? 0).toString(),
            projection: "full",
            country: googleBooksCountry(),
        }).toString();

        return parseVolumesResponse(await googleBooksFetch(url));
    },
});
