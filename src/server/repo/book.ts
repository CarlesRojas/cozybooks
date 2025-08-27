import { GOOGLE_BOOKS_URL } from "@/const";
import { env } from "@/env";
import { db, InferResultType } from "@/server/db";
import { book, bookInsertSchema } from "@/server/db/schema/book";
import { Book, BookSchema } from "@/type/Book";
import { createServerFn } from "@tanstack/react-start";
import axios from "axios";
import z from "zod";

type InsertBook = typeof book.$inferInsert;
type SelectBook = InferResultType<"book">;

export const addBook = createServerFn({ method: "POST" })
    .validator((book: InsertBook) => {
        return bookInsertSchema.parse(book);
    })
    .handler(async ({ data: insertBook }) => {
        await db.insert(book).values(insertBook);
    });

export const getBook = createServerFn({ method: "GET" })
    .validator((id: string) => {
        return z.string().parse(id);
    })
    .handler(async ({ data: id }) => {
        const result = await db.query.book.findFirst({
            where: (book, { eq }) => eq(book.id, id),
        });

        return !!result ? toDomainBook(result) : null;
    });

export const getBookWithGoogleFallback = createServerFn({ method: "GET" })
    .validator((id: string) => {
        return z.string().parse(id);
    })
    .handler(async ({ data: bookId }) => {
        const book = await getBook({ data: bookId });
        if (book) return book;

        const googleBook = await getGoogleBook(bookId);
        if (!googleBook) return undefined;

        try {
            await addBook({ data: googleBook });
        } catch (error) {}

        return googleBook;
    });

export const parseGoogleBook = (googleBook: any) => {
    const rawBook = { id: googleBook.id };
    if (googleBook.volumeInfo) Object.assign(rawBook, googleBook.volumeInfo);
    if (googleBook.volumeInfo?.imageLinks) Object.assign(rawBook, googleBook.volumeInfo.imageLinks);
    return BookSchema.parse(rawBook) as Book;
};

export const getGoogleBook = async (bookId: string) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/volumes/${bookId}`);
    const params = new URLSearchParams({
        key: env.GOOGLE_BOOKS_API_KEY,
        projection: "full",
    });
    url.search = params.toString();

    try {
        const response = await axios.get(url.toString());
        return parseGoogleBook(response.data);
    } catch (error) {
        return undefined;
    }
};

export const toDomainBook = (book: SelectBook) => {
    return BookSchema.parse(book) as Book;
};
