"use server";

import { toDomainBook } from "@/server/action/book";
import { InferResultType, db } from "@/server/database";
import { library } from "@/server/schema";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { LibraryBook, LibraryBookSchema, LibraryType } from "@/type/Library";
import { and, count, eq } from "drizzle-orm";

type InsertLibraryBook = typeof library.$inferInsert;
type SelectLibraryBook = InferResultType<"library", { book: true }>;

export const addBookToLibrary = async (libraryBook: InsertLibraryBook) => {
    await db.insert(library).values(libraryBook);
};

export const removeBookFromLibrary = async ({ type, userId, bookId }: InsertLibraryBook) => {
    await db.delete(library).where(and(eq(library.type, type), eq(library.userId, userId), eq(library.bookId, bookId)));
};

export const isBookInLibrary = async ({ bookId, type, userId }: InsertLibraryBook) => {
    const result = await db.query.library.findFirst({
        where: (library, { eq, and }) => and(eq(library.type, type), eq(library.userId, userId), eq(library.bookId, bookId)),
    });
    return !!result;
};

interface GetLibraryProps {
    userId: number;
    type: LibraryType;
    maxResults: number;
    startIndex: number;
}

export const getLibraryBooks = async ({ userId, type, maxResults, startIndex }: GetLibraryProps): Promise<VolumesResult> => {
    const numberOfBooks = (
        await db
            .select({ value: count() })
            .from(library)
            .where(and(eq(library.type, type), eq(library.userId, userId)))
    )[0].value;

    const results = await db.query.library.findMany({
        where: (library, { and, eq }) => and(eq(library.type, type), eq(library.userId, userId)),
        with: { book: true },
        orderBy: (library, { desc }) => desc(library.createdAt),
        limit: maxResults,
        offset: startIndex * maxResults,
    });

    return VolumesResultSchema.parse({
        totalItems: numberOfBooks,
        items: results.map((libraryBook) => toDomainBook(libraryBook.book)),
    }) as VolumesResult;
};

const toDomainLibraryBook = (libraryBook: SelectLibraryBook) => {
    return LibraryBookSchema.parse(libraryBook) as LibraryBook;
};
