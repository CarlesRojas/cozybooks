import { GOOGLE_BOOKS_URL } from "@/const";
import { BookSchema, SearchResult, SearchResultSchema } from "@/type/Book";
import { TokenProps, filteredArray, withToken } from "@/util";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    query: string;
    booksPerPage?: number;
    offset?: number;
    isAuthor?: boolean;
}

export const searchBooks = withToken(async ({ query, booksPerPage = 8, offset = 0, isAuthor = false, token }: Props & TokenProps) => {
    if (!query) return SearchResultSchema.parse({ totalItems: 0, items: [] });

    const url = new URL(`${GOOGLE_BOOKS_URL}/volumes`, GOOGLE_BOOKS_URL);
    const params = new URLSearchParams({
        access_token: token,
        q: isAuthor ? `inauthor:"${query}"` : `intitle:"${query}"`,
        maxResults: booksPerPage.toString(),
        startIndex: offset.toString(),
        printType: "books",
        orderBy: "relevance",
    });
    url.search = params.toString();

    const response = await axios.get(url.toString());

    const items = filteredArray(BookSchema).parse(response.data.items);
    return SearchResultSchema.parse({ totalItems: response.data.totalItems, items }) as SearchResult;
});

export const useSearchedBooks = ({ query, booksPerPage, offset }: Props) => {
    return useQuery({
        queryKey: ["searchedBooks", query, booksPerPage, offset],
        queryFn: () => searchBooks({ query, booksPerPage, offset }),
        placeholderData: keepPreviousData,
    });
};
