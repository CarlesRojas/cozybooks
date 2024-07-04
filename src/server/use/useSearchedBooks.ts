import { GOOGLE_BOOKS_URL } from "@/const";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { TokenProps, parseGoogleBook, withToken } from "@/util";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    query: string;
    booksPerPage?: number;
    offset?: number;
}

export const searchBooks = withToken(async ({ query, booksPerPage = 8, offset = 0, token }: Props & TokenProps) => {
    if (!query) return VolumesResultSchema.parse({ totalItems: 0, items: [] });

    const url = new URL(`${GOOGLE_BOOKS_URL}/volumes`);
    const params = new URLSearchParams({
        access_token: token,
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
});

export const useSearchedBooks = ({ query, booksPerPage, offset }: Props) => {
    return useQuery({
        queryKey: ["searchedBooks", query, booksPerPage, offset],
        queryFn: () => searchBooks({ query, booksPerPage, offset }),
        placeholderData: keepPreviousData,
    });
};
