import { db } from "@/server/db";
import { library, libraryInsertSchema } from "@/server/db/schema";
import type { VolumesResult } from "@/type/Book";
import { BookSchema, VolumesResultSchema } from "@/type/Book";
import type { LibraryType } from "@/type/Library";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import z from "zod";

type InsertLibraryBook = typeof library.$inferInsert;

export const addBookToLibrary = createServerFn({ method: "POST" })
    .validator((libraryBook: InsertLibraryBook) => libraryInsertSchema.parse(libraryBook))
    .handler(async ({ data: libraryBook }) => {
        await db.insert(library).values(libraryBook);
    });

export const removeBookFromLibrary = createServerFn({ method: "POST" })
    .validator((libraryBook: InsertLibraryBook) => libraryInsertSchema.parse(libraryBook))
    .handler(async ({ data: libraryBook }) => {
        await db
            .delete(library)
            .where(and(eq(library.type, libraryBook.type), eq(library.userId, libraryBook.userId), eq(library.bookId, libraryBook.bookId)));
    });

export const isBookInLibrary = createServerFn({ method: "POST" })
    .validator((libraryBook: InsertLibraryBook) => libraryInsertSchema.parse(libraryBook))
    .handler(async ({ data: libraryBook }) => {
        const result = await db.query.library.findFirst({
            where: (library, { eq, and }) =>
                and(eq(library.type, libraryBook.type), eq(library.userId, libraryBook.userId), eq(library.bookId, libraryBook.bookId)),
        });
        return !!result;
    });

interface GetLibraryProps {
    userId: string;
    type: LibraryType;
    maxResults?: number;
    startIndex?: number;
}

export const getLibraryBooks = createServerFn({ method: "GET" })
    .validator((data: GetLibraryProps) =>
        z
            .object({ userId: z.string(), type: z.string(), maxResults: z.number().optional(), startIndex: z.number().optional() })
            .parse(data),
    )
    .handler(async ({ data: { userId, type, maxResults, startIndex } }) => {
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
        });
    });
