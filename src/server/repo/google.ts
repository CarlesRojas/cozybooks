import { GOOGLE_BOOKS_URL } from "@/const";
import type { Book } from "@/type/Book";
import type { BookShelfType } from "@/type/BookShelf";
import axios from "axios";

export const addToGoogleBookshelf = async ({
    book,
    googleToken,
    bookshelf,
}: {
    book: Book;
    googleToken: string;
    bookshelf: BookShelfType;
}) => {
    try {
        const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${bookshelf}/addVolume`);
        const params = new URLSearchParams({
            access_token: googleToken,
            volumeId: book.id,
        });
        url.search = params.toString();

        await axios.post(url.toString());
    } catch {}
};

export const removeFromGoogleBookshelf = async ({
    book,
    googleToken,
    bookshelf,
}: {
    book: Book;
    googleToken: string;
    bookshelf: BookShelfType;
}) => {
    try {
        const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${bookshelf}/removeVolume`);
        const params = new URLSearchParams({
            access_token: googleToken,
            volumeId: book.id,
        });
        url.search = params.toString();

        await axios.post(url.toString());
    } catch {}
};
