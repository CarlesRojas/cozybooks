// Everything that talks to the Google Books API: catalogue search, and the user's
// "My Library" bookshelves.

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { catalogueParams, clampMaxResults, googleBooksCountry, googleBooksRequest, parseGoogleVolume } from "./lib/googleBooks";

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

// Mirrors a CozyBooks status change onto the user's Google "My Library" shelves. Runs as
// a scheduled internal action (see `status.ts`) so syncing never blocks the user-facing
// write.
//
// Every op is attempted even if an earlier one fails, so one rejected shelf can't stop
// the rest — but the failures are then raised together. That deliberately differs from
// the old fire-and-forget behavior: silently swallowing errors here means the two
// libraries drift apart with nothing to show why.
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
        const failures: Array<string> = [];

        for (const { op, bookshelf } of ops) {
            const endpoint = op === "add" ? "addVolume" : "removeVolume";

            try {
                await googleBooksRequest({
                    path: `/mylibrary/bookshelves/${bookshelf}/${endpoint}`,
                    // `country` matters on writes too: without it Google has to geolocate
                    // the caller's IP, which fails from a datacenter (see lib/googleBooks).
                    params: { volumeId, country: googleBooksCountry() },
                    method: "POST",
                    googleToken,
                });
            } catch (error) {
                failures.push(`${endpoint} on shelf ${bookshelf}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        if (failures.length > 0) throw new Error(`Google bookshelf sync failed for volume ${volumeId} — ${failures.join("; ")}`);
    },
});

// Catalogue search. Uses the API key rather than the user's OAuth token: `volumes.list`
// is a public endpoint, so search stays up even when a Google token has expired.
export const search = action({
    args: {
        query: v.string(),
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (_ctx, { query, maxResults, startIndex }) => {
        if (!query.trim()) return { totalItems: 0, items: [] };

        const data = await googleBooksRequest({
            path: "/volumes",
            params: {
                ...catalogueParams(),
                q: query.trim(),
                maxResults: clampMaxResults(maxResults).toString(),
                startIndex: (startIndex ?? 0).toString(),
                printType: "books",
                orderBy: "relevance",
            },
        });

        return parseVolumesResponse(data);
    },
});

// Lists one of the user's Google bookshelves. Unlike search this is per-user data, so it
// needs the OAuth token.
export const getBookShelf = action({
    args: {
        googleToken: v.string(),
        bookshelf: v.number(),
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (_ctx, { googleToken, bookshelf, maxResults, startIndex }) => {
        const data = await googleBooksRequest({
            path: `/mylibrary/bookshelves/${bookshelf}/volumes`,
            params: {
                ...catalogueParams(),
                maxResults: clampMaxResults(maxResults).toString(),
                startIndex: (startIndex ?? 0).toString(),
                projection: "full",
            },
            googleToken,
        });

        return parseVolumesResponse(data);
    },
});
