// Catalogue search against the Google Books API. The authenticated "My Library"
// surface (bookshelf mirroring, the "Books for you" shelf, the daily reconciliation)
// was removed — Google deprecated those endpoints, and the Convex tables are the
// source of truth for the user's library.

import { v } from "convex/values";
import { action } from "./_generated/server";
import { catalogueParams, clampMaxResults, googleBooksRequest, parseGoogleVolume } from "./lib/googleBooks";

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

// Catalogue search. `volumes.list` is a public endpoint — it takes the API key, never
// a user token.
//
// `showPreorders` defaults to false, which is why announced-but-unpublished books
// can't be found at all — the gap the unreleased book list exists to paper over.
//
// `filter` is deliberately not sent: its only values that would cut down the
// academic and scanned material (`ebooks`, `paid-ebooks`) also hide books with no
// ebook edition, which was a worse result in practice than the noise it removed.
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
                showPreorders: "true",
            },
        });

        return parseVolumesResponse(data);
    },
});
