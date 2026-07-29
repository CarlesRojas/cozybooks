// Conversions between the Convex wire shapes (dates as ms since epoch, no Date
// objects allowed over the wire) and the domain types in `src/type`.

import type { Book, VolumesResult } from "@/type/Book";
import type { Finished } from "@/type/Finished";
import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type WireBook = NonNullable<FunctionReturnType<typeof api.books.get>>;
export type WireFinished = FunctionReturnType<typeof api.finished.getForBook>[number];
export type WireVolumesResult = FunctionReturnType<typeof api.library.getBooks>;

export const toWireBook = (book: Book) => ({
    id: book.id,

    title: book.title,
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

export const fromWireFinished = (finished: WireFinished): Finished => ({
    ...finished,
    timestamp: new Date(finished.timestamp),
});

export const fromWireBook = (book: WireBook & { finished?: Array<WireFinished>; rating?: Array<{ rating: number }> }): Book => ({
    ...book,
    title: book.title ?? "",
    publishedDate: book.publishedDate !== undefined ? new Date(book.publishedDate) : undefined,
    finished: book.finished?.map(fromWireFinished),
    rating: book.rating,
});

export const fromWireVolumesResult = (result: { totalItems: number; items: Array<Parameters<typeof fromWireBook>[0]> }): VolumesResult => ({
    totalItems: result.totalItems,
    items: result.items.map(fromWireBook),
});
