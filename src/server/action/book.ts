"use server";

import { InferResultType, db } from "@/server/database";
import { book } from "@/server/schema";
import { Book, BookSchema } from "@/type/Book";

type InsertBook = typeof book.$inferInsert;
type SelectBook = InferResultType<"book">;

export const addBook = async (insertBook: InsertBook) => {
    await db.insert(book).values(insertBook);
};

export const getBook = async (id: string) => {
    const result = await db.query.book.findFirst({
        where: (book, { eq }) => eq(book.id, id),
    });

    return !!result ? toDomainBook(result) : null;
};

export const toDomainBook = (book: SelectBook) => {
    return BookSchema.parse(book) as Book;
};
