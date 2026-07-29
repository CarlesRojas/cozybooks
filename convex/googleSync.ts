// Daily reconciliation between the CozyBooks library and the user's classic Google
// Books "My Library" shelves (the surface the public Books API v1 operates on).
//
// The per-mutation sync in `status.ts` mirrors individual changes as they happen;
// this catches everything that slips through — changes made on Google directly,
// failed mirror ops, or removals that never reached Google. CozyBooks is the
// authority:
//
// - in CozyBooks, missing on the Google shelf          -> added to Google
// - on Google, missing in CozyBooks, tombstoned        -> removed from Google
//   (the book was removed in CozyBooks; see `libraryRemovals` in the schema)
// - on Google, missing in CozyBooks, no tombstone      -> imported into CozyBooks
//
// Removals made on the Google side are NOT propagated: the book is still in
// CozyBooks, so it gets re-added to Google.
//
// Triggered from the client on app open (`useDailyGoogleSync`), but rate-limited
// here: `claimDailySync` atomically claims the user's daily slot, so extra tabs,
// devices or reloads within 24h are no-ops.

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { BOOKSHELF, MAX_RESULTS, catalogueParams, googleBooksRequest, parseGoogleVolume } from "./lib/googleBooks";
import type { BookInput, LibraryType } from "./lib/model";
import { addBookToLibrary, getFinishedForBook, upsertBook } from "./lib/model";
import { bookArgs } from "./lib/validators";
import { libraryTypeValidator } from "./schema";

const DAY_MS = 24 * 60 * 60 * 1000;

// Hard cap on shelf pagination: 25 pages x 40 volumes. Only a safety net against a
// misbehaving API response loop.
const MAX_PAGES = 25;

const SHELVES: Array<{ bookshelf: number; type: LibraryType }> = [
    { bookshelf: BOOKSHELF.READING_NOW, type: "READING" },
    { bookshelf: BOOKSHELF.TO_READ, type: "TO_READ" },
    { bookshelf: BOOKSHELF.HAVE_READ, type: "FINISHED" },
];

// Atomically claims the user's daily sync slot. Claimed up front rather than on
// success so concurrent opens can't double-sync; a failed run simply waits for the
// next day (the per-change mirroring in status.ts keeps running regardless).
export const claimDailySync = internalMutation({
    args: { userId: v.string() },
    handler: async (ctx, { userId }) => {
        const existing = await ctx.db
            .query("googleSyncState")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();

        if (existing && existing.lastSyncedAt > Date.now() - DAY_MS) return false;

        if (existing) await ctx.db.patch(existing._id, { lastSyncedAt: Date.now() });
        else await ctx.db.insert("googleSyncState", { userId, lastSyncedAt: Date.now() });
        return true;
    },
});

// The CozyBooks side of one shelf: current members plus tombstoned removals.
export const getShelfState = internalQuery({
    args: { userId: v.string(), type: libraryTypeValidator },
    handler: async (ctx, { userId, type }) => {
        const [entries, removals] = await Promise.all([
            ctx.db
                .query("library")
                .withIndex("by_user_type_created", (q) => q.eq("userId", userId).eq("type", type))
                .collect(),
            ctx.db
                .query("libraryRemovals")
                .withIndex("by_user_type_book", (q) => q.eq("userId", userId).eq("type", type))
                .collect(),
        ]);

        return {
            bookIds: entries.map((entry) => entry.bookId),
            removedBookIds: removals.map((removal) => removal.bookId),
        };
    },
});

// Drops tombstones once their removal has reached Google (or turned out to be
// already gone there).
export const clearRemovals = internalMutation({
    args: { userId: v.string(), type: libraryTypeValidator, bookIds: v.array(v.string()) },
    handler: async (ctx, { userId, type, bookIds }) => {
        for (const bookId of bookIds) {
            const removal = await ctx.db
                .query("libraryRemovals")
                .withIndex("by_user_type_book", (q) => q.eq("userId", userId).eq("type", type).eq("bookId", bookId))
                .unique();
            if (removal) await ctx.db.delete(removal._id);
        }
    },
});

// Adds Google-only books to the CozyBooks library. `withFinishedDate` gives books
// imported into FINISHED a finished date of "now" when they have none — the app
// treats a finished book without dates as inconsistent state.
export const importFromGoogle = internalMutation({
    args: {
        userId: v.string(),
        type: libraryTypeValidator,
        books: v.array(v.object(bookArgs)),
        withFinishedDate: v.boolean(),
    },
    handler: async (ctx, { userId, type, books, withFinishedDate }) => {
        for (const book of books) {
            await upsertBook(ctx, book);
            await addBookToLibrary(ctx, { userId, type, bookId: book.id });

            if (withFinishedDate) {
                const finished = await getFinishedForBook(ctx, { userId, bookId: book.id });
                if (finished.length === 0) await ctx.db.insert("finished", { userId, bookId: book.id, timestamp: Date.now() });
            }
        }
    },
});

interface GoogleShelf {
    ids: Set<string>;
    volumes: Array<BookInput>;
}

const listGoogleShelf = async (googleToken: string, bookshelf: number): Promise<GoogleShelf> => {
    const ids = new Set<string>();
    const volumes: GoogleShelf["volumes"] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
        const data = await googleBooksRequest({
            path: `/mylibrary/bookshelves/${bookshelf}/volumes`,
            params: {
                ...catalogueParams(),
                maxResults: MAX_RESULTS.toString(),
                startIndex: (page * MAX_RESULTS).toString(),
                projection: "full",
            },
            googleToken,
        });

        const items: Array<any> = Array.isArray(data.items) ? data.items : [];
        if (items.length === 0) break;

        for (const item of items) {
            if (typeof item?.id === "string") ids.add(item.id);

            // Unparseable volumes still count as "on Google" (their id is in `ids`)
            // but can't be imported into CozyBooks, which needs at least a title.
            const parsed = parseGoogleVolume(item);
            if (parsed) {
                const { googleId, ...fields } = parsed;
                volumes.push({ id: googleId, ...fields });
            }
        }

        const totalItems = typeof data.totalItems === "number" ? data.totalItems : 0;
        if ((page + 1) * MAX_RESULTS >= totalItems) break;
    }

    return { ids, volumes };
};

export interface SyncSummary {
    skipped: boolean;
    addedToGoogle: number;
    removedFromGoogle: number;
    addedToCozyBooks: number;
}

export const run = action({
    args: { userId: v.string(), googleToken: v.string() },
    // Explicit annotations break the type-inference cycle caused by referencing
    // `internal.googleSync.*` from this same module.
    handler: async (ctx, { userId, googleToken }): Promise<SyncSummary> => {
        const claimed: boolean = await ctx.runMutation(internal.googleSync.claimDailySync, { userId });
        const summary: SyncSummary = { skipped: !claimed, addedToGoogle: 0, removedFromGoogle: 0, addedToCozyBooks: 0 };
        if (!claimed) return summary;

        const failures: Array<string> = [];

        for (const { bookshelf, type } of SHELVES) {
            try {
                const [google, cozy] = await Promise.all([
                    listGoogleShelf(googleToken, bookshelf),
                    ctx.runQuery(internal.googleSync.getShelfState, { userId, type }) as Promise<{
                        bookIds: Array<string>;
                        removedBookIds: Array<string>;
                    }>,
                ]);
                const cozySet = new Set(cozy.bookIds);
                const removedSet = new Set(cozy.removedBookIds);

                // CozyBooks -> Google. One request per volume; failures don't stop the rest.
                for (const bookId of cozy.bookIds) {
                    if (google.ids.has(bookId)) continue;
                    try {
                        await googleBooksRequest({
                            path: `/mylibrary/bookshelves/${bookshelf}/addVolume`,
                            params: { volumeId: bookId },
                            method: "POST",
                            googleToken,
                        });
                        summary.addedToGoogle++;
                    } catch (error) {
                        failures.push(
                            `addVolume ${bookId} to shelf ${bookshelf}: ${error instanceof Error ? error.message : String(error)}`,
                        );
                    }
                }

                // Removed in CozyBooks but still on Google -> remove from Google.
                const settledRemovals: Array<string> = [];
                for (const bookId of cozy.removedBookIds) {
                    if (!google.ids.has(bookId)) {
                        // Already gone on Google; the tombstone has done its job.
                        settledRemovals.push(bookId);
                        continue;
                    }
                    try {
                        await googleBooksRequest({
                            path: `/mylibrary/bookshelves/${bookshelf}/removeVolume`,
                            params: { volumeId: bookId },
                            method: "POST",
                            googleToken,
                        });
                        summary.removedFromGoogle++;
                        settledRemovals.push(bookId);
                    } catch (error) {
                        failures.push(
                            `removeVolume ${bookId} from shelf ${bookshelf}: ${error instanceof Error ? error.message : String(error)}`,
                        );
                    }
                }
                if (settledRemovals.length > 0)
                    await ctx.runMutation(internal.googleSync.clearRemovals, { userId, type, bookIds: settledRemovals });

                // On Google, unknown to CozyBooks and not removed here -> import.
                const missing = google.volumes.filter((volume) => !cozySet.has(volume.id) && !removedSet.has(volume.id));
                if (missing.length > 0) {
                    await ctx.runMutation(internal.googleSync.importFromGoogle, {
                        userId,
                        type,
                        books: missing,
                        withFinishedDate: type === "FINISHED",
                    });
                    summary.addedToCozyBooks += missing.length;
                }
            } catch (error) {
                failures.push(`shelf ${bookshelf} (${type}): ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Everything that could run has run; surface what didn't so shelf drift is
        // visible in the logs instead of silent.
        if (failures.length > 0) console.error(`Daily Google Books sync for user ${userId} had failures — ${failures.join("; ")}`);

        return summary;
    },
});
