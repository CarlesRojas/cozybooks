import { GOOGLE_BOOKS_URL } from "@/const";
import { parseGoogleBook } from "@/lib/util";
import type { VolumesResult } from "@/type/Book";
import { VolumesResultSchema } from "@/type/Book";
import type { BookShelfType } from "@/type/BookShelf";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    type: BookShelfType;
    booksPerPage?: number;
    offset?: number;
    googleToken: string;
}

export const getBookShelf = async ({ type, booksPerPage = 8, offset = 0, googleToken }: Props) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${type}/volumes`);
    const params = new URLSearchParams({
        access_token: googleToken,
        maxResults: booksPerPage.toString(),
        startIndex: offset.toString(),
        projection: "full",
    });
    url.search = params.toString();

    const response = await axios.get(url.toString());

    return VolumesResultSchema.parse({
        totalItems: response.data.totalItems,
        items: response.data.items.map((item: any) => parseGoogleBook(item)),
    });
};

export const useBookShelf = ({ type, booksPerPage, offset, googleToken }: Props) => {
    return useQuery({
        queryKey: ["bookShelf", type, booksPerPage, offset],
        queryFn: () => getBookShelf({ type, booksPerPage, offset, googleToken }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
