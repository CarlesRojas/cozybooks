// Catalogue search against the Google Books API. The authenticated "My Library"
// surface (bookshelf mirroring, the "Books for you" shelf, the daily reconciliation)
// was removed — Google deprecated those endpoints, and the Convex tables are the
// source of truth for the user's library.

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { catalogueParams, clampMaxResults, googleBooksRequest, parseGoogleVolume } from "./lib/googleBooks";
import type { PublishedBook } from "./lib/publish";

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
//
// The user's own books come first and the catalogue follows, as one paginated list.
// They lead because they are the only results the reader put there on purpose: a
// book typed in by hand is being searched for by name, and burying it behind forty
// Google volumes would defeat the point of having written it down.
export const search = action({
    args: {
        query: v.string(),
        maxResults: v.optional(v.number()),
        startIndex: v.optional(v.number()),
        userId: v.optional(v.string()),
    },
    handler: async (ctx, { query, maxResults, startIndex, userId }): Promise<{ totalItems: number; items: Array<PublishedBook> }> => {
        const trimmed = query.trim();
        if (!trimmed) return { totalItems: 0, items: [] };

        const limit = clampMaxResults(maxResults);
        const start = startIndex ?? 0;

        const custom: Array<PublishedBook> = userId ? await ctx.runQuery(internal.customBooks.searchOwn, { userId, query: trimmed }) : [];
        const customPage = custom.slice(start, start + limit);

        // Google's offset counts only Google's results, so the custom books already
        // handed out have to come off the front of it.
        const googleLimit = limit - customPage.length;

        // A page filled entirely by the reader's own books still has the catalogue
        // behind it. `totalItems` is a lower bound rather than a count here — one
        // more than what's been served is enough to keep the infinite list asking,
        // and the next page comes back with the real total.
        if (googleLimit <= 0) return { totalItems: custom.length + 1, items: customPage };

        const data = await googleBooksRequest({
            path: "/volumes",
            params: {
                ...catalogueParams(),
                q: trimmed,
                maxResults: googleLimit.toString(),
                startIndex: Math.max(0, start - custom.length).toString(),
                printType: "books",
                orderBy: "relevance",
                showPreorders: "true",
            },
        });

        const { totalItems, items } = parseVolumesResponse(data);
        return { totalItems: custom.length + totalItems, items: [...customPage, ...items] };
    },
});

// Books to show alongside the one being viewed, sequels first.
//
// The API cannot express "same series". `volumeInfo` carries no series field on the
// public endpoints, there is no series search operator, and the `seriesInfo` that
// occasionally appears in a volume payload is undocumented and cannot be searched by
// anyway. Same publisher is expressible (`inpublisher:`) but that is an imprint, not
// a look — nothing in the API describes cover art or a design line.
//
// What is reliable is `inauthor:`, and within one author's work a series announces
// itself in the title: instalments repeat the opening words ("Harry Potter and the
// …", "The Wheel of Time …"). So: ask for the author's books, then rank by how much
// of the title's opening they share with this one. Series-mates surface first,
// everything else follows as more by the same author.
const titleWords = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean);

const sharedOpeningWords = (a: Array<string>, b: Array<string>) => {
    let shared = 0;
    while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++;
    return shared;
};

export const related = action({
    args: {
        bookId: v.string(),
        title: v.string(),
        author: v.optional(v.string()),
        maxResults: v.optional(v.number()),
    },
    handler: async (_ctx, { bookId, title, author, maxResults }) => {
        const words = titleWords(title);
        // Without an author there is nothing dependable to relate by; the title's
        // opening is the next best thing, and on a one-word title not even that.
        const query = author
            ? `inauthor:"${author.replace(/"/g, "")}"`
            : words.length > 1
              ? `intitle:"${words.slice(0, 2).join(" ")}"`
              : null;
        if (!query) return { totalItems: 0, items: [] };

        const data = await googleBooksRequest({
            path: "/volumes",
            params: {
                ...catalogueParams(),
                q: query,
                // Over-fetch: other editions of this same book are common and get
                // dropped below, so a page's worth of candidates rarely survives whole.
                maxResults: "40",
                printType: "books",
                orderBy: "relevance",
                showPreorders: "true",
            },
        });

        const { items } = parseVolumesResponse(data);
        const seen = new Set<string>([titleWords(title).join(" ")]);

        const candidates = items
            .filter((item) => {
                if (item.id === bookId) return false;

                // Reprints and translations of the book being viewed are not related
                // books, they are the same book again.
                const key = titleWords(item.title).join(" ");
                if (seen.has(key)) return false;
                seen.add(key);

                return true;
            })
            .map((item) => ({ item, shared: sharedOpeningWords(words, titleWords(item.title)) }));

        candidates.sort((a, b) => b.shared - a.shared || (b.item.ratingsCount ?? 0) - (a.item.ratingsCount ?? 0));

        const limit = clampMaxResults(maxResults);
        return { totalItems: candidates.length, items: candidates.slice(0, limit).map(({ item }) => item) };
    },
});
