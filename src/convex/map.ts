// Conversions between the Convex wire shapes (dates as ms since epoch, no Date
// objects allowed over the wire) and the domain types in `src/convex/type.ts`.

import type { Book, FinishedDate, VolumesResult } from "@/convex/type";
import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type WireBook = NonNullable<FunctionReturnType<typeof api.books.get>>;
export type WireFinished = FunctionReturnType<typeof api.finished.getForBook>[number];
export type WireVolumesResult = FunctionReturnType<typeof api.library.getBooks>;

// Accepts both the new `Book` and the old `src/type/Book` shape (whose optional
// fields can also be null), so call sites can be migrated incrementally.
interface BookInput {
    id: string;
    title?: string | null;
    authors?: Array<string> | null;
    publisher?: string | null;
    publishedDate?: Date | null;
    description?: string | null;
    pageCount?: number | null;
    categories?: Array<string> | null;
    mainCategory?: string | null;
    averageRating?: number | null;
    ratingsCount?: number | null;
    language?: string | null;
    previewLink?: string | null;
    smallThumbnail?: string | null;
    thumbnail?: string | null;
    small?: string | null;
    medium?: string | null;
    large?: string | null;
    extraLarge?: string | null;
}

export const toWireBook = (book: BookInput) => ({
    id: book.id,

    title: book.title ?? undefined,
    authors: book.authors ?? undefined,
    publisher: book.publisher ?? undefined,
    publishedDate: book.publishedDate?.getTime(),
    description: book.description ?? undefined,
    pageCount: book.pageCount ?? undefined,
    categories: book.categories ?? undefined,
    mainCategory: book.mainCategory ?? undefined,
    averageRating: book.averageRating ?? undefined,
    ratingsCount: book.ratingsCount ?? undefined,
    language: book.language ?? undefined,
    previewLink: book.previewLink ?? undefined,

    smallThumbnail: book.smallThumbnail ?? undefined,
    thumbnail: book.thumbnail ?? undefined,
    small: book.small ?? undefined,
    medium: book.medium ?? undefined,
    large: book.large ?? undefined,
    extraLarge: book.extraLarge ?? undefined,
});

export const fromWireFinished = (finished: WireFinished): FinishedDate => ({
    ...finished,
    timestamp: new Date(finished.timestamp),
});

export const fromWireBook = (book: WireBook & { finished?: Array<WireFinished>; rating?: Array<{ rating: number }> }): Book => ({
    ...book,
    publishedDate: book.publishedDate !== undefined ? new Date(book.publishedDate) : undefined,
    finished: book.finished?.map(fromWireFinished),
    rating: book.rating,
});

export const fromWireVolumesResult = (result: { totalItems: number; items: Array<Parameters<typeof fromWireBook>[0]> }): VolumesResult => ({
    totalItems: result.totalItems,
    items: result.items.map(fromWireBook),
});
