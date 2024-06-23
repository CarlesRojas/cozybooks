"use server";

import { db } from "@/server/database";
import { library } from "@/server/schema";
import { BookSchema, VolumesResult, VolumesResultSchema } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { and, count, eq } from "drizzle-orm";

type InsertLibraryBook = typeof library.$inferInsert;

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
    maxResults?: number;
    startIndex?: number;
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
        with: {
            book: {
                with: {
                    finished: { where: (finished, { eq }) => eq(finished.userId, userId) },
                    rating: { where: (rating, { eq }) => eq(rating.userId, userId) },
                },
            },
        },
        orderBy: (library, { desc }) => desc(library.createdAt),
        limit: maxResults,
        offset: startIndex,
    });

    return VolumesResultSchema.parse({
        totalItems: numberOfBooks,
        items: results.map((libraryBook) => BookSchema.parse(libraryBook.book)),
    }) as VolumesResult;
};
