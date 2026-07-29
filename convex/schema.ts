import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const libraryTypeValidator = v.union(v.literal("READING"), v.literal("TO_READ"), v.literal("FINISHED"));

// Counterpart of `src/server/db/schema/book.ts`. `googleId` is the Google Books volume id
// (the primary key of the old `book` table). Dates are stored as ms since epoch.
export const bookFields = {
    googleId: v.string(),

    title: v.optional(v.string()),
    authors: v.optional(v.array(v.string())),
    publisher: v.optional(v.string()),
    publishedDate: v.optional(v.number()),
    description: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    categories: v.optional(v.array(v.string())),
    mainCategory: v.optional(v.string()),
    averageRating: v.optional(v.number()),
    ratingsCount: v.optional(v.number()),
    language: v.optional(v.string()),
    previewLink: v.optional(v.string()),

    smallThumbnail: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    small: v.optional(v.string()),
    medium: v.optional(v.string()),
    large: v.optional(v.string()),
    extraLarge: v.optional(v.string()),
};

export default defineSchema({
    // ─── Auth (counterparts of `src/server/db/schema/auth.ts`) ───────────────────
    // `authId` keeps the original better-auth row id so phase 2 (data migration) can
    // copy rows 1:1 and domain tables can keep referencing users by that same id.
    users: defineTable({
        authId: v.string(),
        name: v.string(),
        email: v.string(),
        emailVerified: v.boolean(),
        image: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_auth_id", ["authId"])
        .index("by_email", ["email"]),

    sessions: defineTable({
        authId: v.string(),
        expiresAt: v.number(),
        token: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        userId: v.string(),
    })
        .index("by_auth_id", ["authId"])
        .index("by_token", ["token"])
        .index("by_user", ["userId"]),

    accounts: defineTable({
        authId: v.string(),
        accountId: v.string(),
        providerId: v.string(),
        userId: v.string(),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        idToken: v.optional(v.string()),
        accessTokenExpiresAt: v.optional(v.number()),
        refreshTokenExpiresAt: v.optional(v.number()),
        scope: v.optional(v.string()),
        password: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_auth_id", ["authId"])
        .index("by_user", ["userId"]),

    verifications: defineTable({
        authId: v.string(),
        identifier: v.string(),
        value: v.string(),
        expiresAt: v.number(),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_auth_id", ["authId"])
        .index("by_identifier", ["identifier"]),

    // ─── Domain ──────────────────────────────────────────────────────────────────
    books: defineTable(bookFields).index("by_google_id", ["googleId"]),

    // Counterpart of `library` (userId + type + bookId used to be the primary key).
    library: defineTable({
        userId: v.string(),
        bookId: v.string(),
        type: libraryTypeValidator,
        createdAt: v.number(),
    })
        // Listing a shelf, newest first: single index range read, already sorted.
        .index("by_user_type_created", ["userId", "type", "createdAt"])
        // Point lookups: isInLibrary / add / remove.
        .index("by_user_type_book", ["userId", "type", "bookId"]),

    // Counterpart of `finished` (serial id → Convex _id).
    finished: defineTable({
        userId: v.string(),
        bookId: v.string(),
        timestamp: v.number(),
    })
        // Dates for a user's book, already sorted by timestamp ascending.
        .index("by_user_book_time", ["userId", "bookId", "timestamp"]),

    // Counterpart of `rating` (userId + bookId used to be the primary key).
    ratings: defineTable({
        userId: v.string(),
        bookId: v.string(),
        rating: v.number(),
    }).index("by_user_book", ["userId", "bookId"]),

    // Counterpart of `unreleasedBook` (serial id → Convex _id).
    unreleasedBooks: defineTable({
        userId: v.string(),
        name: v.string(),
    })
        // A user's list, already sorted by name ascending.
        .index("by_user_name", ["userId", "name"]),
});
