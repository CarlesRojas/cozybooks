// Domain types for the Convex-backed data layer. Counterparts of `src/type/Book.ts`,
// `src/type/Finished.ts` and `src/type/UnreleasedBook.ts` with one difference: rows
// that used to have a serial Postgres id are now identified by their Convex document
// id (a branded string) instead of a number.

import type { Id } from "@convex/_generated/dataModel";

export interface FinishedDate {
    id: Id<"finished">;
    userId: string;
    bookId: string;
    timestamp: Date;
}

export interface UnreleasedBook {
    id: Id<"unreleasedBooks">;
    userId: string;
    name: string;
}

export interface Book {
    id: string;

    title?: string;
    authors?: Array<string>;
    publisher?: string;
    publishedDate?: Date;
    description?: string;
    pageCount?: number;
    categories?: Array<string>;
    mainCategory?: string;
    averageRating?: number;
    ratingsCount?: number;
    language?: string;
    previewLink?: string;

    smallThumbnail?: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;

    finished?: Array<FinishedDate>;
    rating?: Array<{ rating: number }>;
}

export interface VolumesResult {
    totalItems: number;
    items: Array<Book>;
}
