import { GOOGLE_BOOKS_URL } from "@/const";
import { BookSchema, SearchResult, SearchResultSchema } from "@/type/Book";
import { TokenProps, filteredArray, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    query: string;
    booksPerPage?: number;
    offset?: number;
}

export const searchBooks = withToken(async ({ query, booksPerPage = 8, offset = 0, token }: Props & TokenProps) => {
    const response = await axios.get(
        `${GOOGLE_BOOKS_URL}/volumes?q=${query}&maxResults=${booksPerPage}&startIndex=${offset}&printType=books&orderBy=relevance&access_token=${token}`,
    );

    const items = filteredArray(BookSchema).parse(response.data.items);
    return SearchResultSchema.parse({ totalItems: response.data.totalItems, items }) as SearchResult;
});

export const useSearchedBooks = ({ query, booksPerPage, offset }: Props) => {
    return useQuery({
        queryKey: ["searchedBooks", query, booksPerPage, offset],
        queryFn: () => searchBooks({ query, booksPerPage, offset }),
        enabled: !!query,
    });
};
