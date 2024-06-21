import { GOOGLE_BOOKS_URL } from "@/const";
import { BookShelfType } from "@/type/BookShelf";
import { TokenProps, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

interface Props {
    bookId: string;
}

export enum BookStatus {
    NONE = "NONE",
    READING_NOW = "READING_NOW",
    WANT_TO_READ = "WANT_TO_READ",
}

const isBookInReadingList = async (bookId: string, token: string) => {
    const params = new URLSearchParams({
        access_token: token,
        volumeId: bookId,
        volumePosition: "0",
    });
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${BookShelfType.READING_NOW}/moveVolume`);
    url.search = params.toString();

    try {
        await axios.post(url.toString());
        return true;
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status && error.response.status >= 500) return true;
        return false;
    }
};

const isBookInWantToReadList = async (bookId: string, token: string) => {
    const params = new URLSearchParams({
        access_token: token,
        volumeId: bookId,
        volumePosition: "0",
    });
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${BookShelfType.TO_READ}/moveVolume`);
    url.search = params.toString();

    try {
        await axios.post(url.toString());
        return true;
    } catch (err) {
        const error = err as AxiosError;
        if (error.response?.status && error.response.status >= 500) return true;
        return false;
    }
};

export const getBookStatus = withToken(async ({ bookId, token }: Props & TokenProps) => {
    if (await isBookInReadingList(bookId, token)) return BookStatus.READING_NOW;
    if (await isBookInWantToReadList(bookId, token)) return BookStatus.WANT_TO_READ;

    return BookStatus.NONE;
});

export const useBookStatus = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["bookStatus", bookId],
        queryFn: () => getBookStatus({ bookId }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
