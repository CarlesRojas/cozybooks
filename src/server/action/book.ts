"use server";

import { GOOGLE_BOOKS_URL } from "@/const";
import { env } from "@/env";
import { InferResultType, db } from "@/server/database";
import { book } from "@/server/schema";
import { Book, BookSchema } from "@/type/Book";
import axios from "axios";

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
