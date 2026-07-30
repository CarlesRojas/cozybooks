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
