// Catalogue search against the Google Books API. The authenticated "My Library"
// surface (bookshelf mirroring, the "Books for you" shelf, the daily reconciliation)
// was removed — Google deprecated those endpoints, and the Convex tables are the
// source of truth for the user's library.

import { v } from "convex/values";
import { action } from "./_generated/server";
import { catalogueParams, clampMaxResults, googleBooksRequest, parseGoogleVolume, suggestSearchQuery } from "./lib/googleBooks";

const publishVolume = (volume: ReturnType<typeof parseGoogleVolume>) => {
    if (!volume) return null;
    const { googleId, ...fields } = volume;
    return { id: googleId, ...fields };
};

// The API has no "only novels" facet, and `orderBy` accepts nothing but `relevance`
// and `newest` — so a search for a popular novel still comes back mixed with study
// guides, conference proceedings and scanned reports. This score demotes those:
// what a real trade book has and a scanned document doesn't is a cover, an ISBN, a
// blurb, a sensible length, and readers who rated it.
const qualityScore = (item: any) => {
    const info = item?.volumeInfo ?? {};
    let score = 0;

    // Ratings are the only popularity signal in the payload. Logarithmic, so a
    // hugely popular book beats an obscure one without swamping relevance.
    const ratingsCount = typeof info.ratingsCount === "number" ? info.ratingsCount : 0;
    if (ratingsCount > 0) score += Math.min(Math.log10(ratingsCount + 1) * 2, 4);
    if (typeof info.averageRating === "number") score += info.averageRating / 5;

    score += info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail ? 2 : -2;

    const identifiers: Array<any> = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
    score += identifiers.some((identifier) => typeof identifier?.type === "string" && identifier.type.startsWith("ISBN")) ? 1.5 : -1.5;

    if (typeof info.description === "string" && info.description.length > 0) score += 0.5;

    // Papers, pamphlets and extracts.
    if (typeof info.pageCount === "number" && info.pageCount > 0 && info.pageCount < 50) score -= 1.5;

    return score;
};

// Re-orders one page of results. Google's own position still dominates — the score
// only shifts an entry by a few places — so this sharpens the ordering instead of
// replacing Google's relevance with a popularity contest. Ordering (rather than
// dropping) junk keeps the item count intact, which the offset pagination needs.
const rankByQuality = (items: Array<any>) =>
    items
        .map((item, index) => ({ item, rank: index - qualityScore(item) }))
        .sort((a, b) => a.rank - b.rank)
        .map(({ item }) => item);

const parseVolumesResponse = (data: any) => {
    const totalItems: number = typeof data.totalItems === "number" ? data.totalItems : 0;
    const rawItems: Array<any> = Array.isArray(data.items) ? data.items : [];

    return {
        totalItems,
        items: rankByQuality(rawItems)
            .map((item) => publishVolume(parseGoogleVolume(item)))
            .filter((item) => item !== null),
    };
};

const runSearch = async (query: string, maxResults: number | undefined, startIndex: number | undefined) =>
    await googleBooksRequest({
        path: "/volumes",
        params: {
            ...catalogueParams(),
            q: query,
            maxResults: clampMaxResults(maxResults).toString(),
            startIndex: (startIndex ?? 0).toString(),
            printType: "books",
            orderBy: "relevance",
        },
    });

// Catalogue search. `volumes.list` is a public endpoint — it takes the API key, never
// a user token.
//
// Terms are sent unquoted, so Google requires all of them but in any order and not
// next to each other ("potter harry" finds the same books as "harry potter"). What it
// won't do is match a prefix: the index is word-based, so "har pot" matches nothing at
// all. When that happens the query is completed first (see `suggestSearchQuery`) and
// the search runs again.
export const search = action({
    args: {
        query: v.string(),
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
    },
    handler: async (_ctx, { query, maxResults, startIndex }) => {
        const trimmed = query.trim();
        if (!trimmed) return { totalItems: 0, items: [] };

        const data = await runSearch(trimmed, maxResults, startIndex);
        const parsed = parseVolumesResponse(data);
        if (parsed.items.length > 0) return parsed;

        const completed = await suggestSearchQuery(trimmed);
        if (!completed) return parsed;

        return parseVolumesResponse(await runSearch(completed, maxResults, startIndex));
    },
});
