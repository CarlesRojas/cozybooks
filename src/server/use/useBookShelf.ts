import { GOOGLE_BOOKS_URL } from "@/const";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { BookShelfType } from "@/type/BookShelf";
import { TokenProps, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    type: BookShelfType;
    booksPerPage?: number;
    offset?: number;
}

export const getBookShelf = withToken(async ({ type, booksPerPage = 8, offset = 0, token }: Props & TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${type}/volumes`, GOOGLE_BOOKS_URL);
    const params = new URLSearchParams({
        access_token: token,
        maxResults: booksPerPage.toString(),
        startIndex: offset.toString(),
        projection: "full",
    });
    url.search = params.toString();

    const response = await axios.get(url.toString());

    return VolumesResultSchema.parse(response.data) as VolumesResult;
});

export const useBookShelf = ({ type, booksPerPage, offset }: Props) => {
    return useQuery({
        queryKey: ["bookShelf", type, booksPerPage, offset],
        queryFn: () => getBookShelf({ type, booksPerPage, offset }),
    });
};
