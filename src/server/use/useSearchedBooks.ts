import { GOOGLE_BOOKS_URL } from "@/const";
import { parseGoogleBook } from "@/lib/util";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    query: string;
    booksPerPage?: number;
    offset?: number;
    googleToken: string;
}

export const searchBooks = async ({ query, booksPerPage = 8, offset = 0, googleToken }: Props) => {
    if (!query) return VolumesResultSchema.parse({ totalItems: 0, items: [] });

    const url = new URL(`${GOOGLE_BOOKS_URL}/volumes`);
    const params = new URLSearchParams({
        access_token: googleToken,
        q: query.trim(),
        maxResults: booksPerPage.toString(),
        startIndex: offset.toString(),
        printType: "books",
        orderBy: "relevance",
    });
    url.search = params.toString();

    const response = await axios.get(url.toString());

    return VolumesResultSchema.parse({
        totalItems: response.data.totalItems,
        items: response.data.items.map((item: any) => parseGoogleBook(item)),
    }) as VolumesResult;
};

export const useSearchedBooks = ({ query, booksPerPage, offset, googleToken }: Props) => {
    return useQuery({
        queryKey: ["searchedBooks", query, booksPerPage, offset],
        queryFn: () => searchBooks({ query, booksPerPage, offset, googleToken }),
        placeholderData: keepPreviousData,
    });
};
