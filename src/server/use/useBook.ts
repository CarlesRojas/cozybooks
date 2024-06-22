import { GOOGLE_BOOKS_URL } from "@/const";
import { Book, BookSchema } from "@/type/Book";
import { TokenProps, withToken } from "@/util";
import { useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    bookId: string;
}

export const parseGoogleBook = (googleBook: any) => {
    const rawBook = { id: googleBook.id };
    if (googleBook.volumeInfo) Object.assign(rawBook, googleBook.volumeInfo);
    if (googleBook.volumeInfo?.imageLinks) Object.assign(rawBook, googleBook.volumeInfo.imageLinks);
    return BookSchema.parse(rawBook) as Book;
};

export const getBook = withToken(async ({ bookId, token }: Props & TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/volumes/${bookId}`);
    const params = new URLSearchParams({
        access_token: token,
        projection: "full",
    });
    url.search = params.toString();

    try {
        const response = await axios.get(url.toString());
        return parseGoogleBook(response.data);
    } catch (error) {
        return undefined;
    }
});

export const useBook = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["book", bookId],
        queryFn: () => getBook({ bookId }),
        staleTime: Infinity,
    });
};

export const useBooks = (bookIds: string[]) => {
    return useQueries({
        queries: bookIds?.map((bookId) => ({
            queryKey: ["book", bookId],
            queryFn: () => getBook({ bookId }),
            staleTime: Infinity,
        })),
    });
};
