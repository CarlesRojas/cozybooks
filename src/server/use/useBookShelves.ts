import { GOOGLE_BOOKS_URL } from "@/const";
import { BookShelf, BookShelfSchema } from "@/type/BookShelf";
import { TokenProps, filteredArray, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

export const getBookShelves = withToken(async ({ token }: TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves`);
    const params = new URLSearchParams({
        access_token: token,
    });
    url.search = params.toString();

    const response = await axios.get(url.toString());

    const knownBookShelves = filteredArray(BookShelfSchema).parse(response.data.items);
    return z.array(BookShelfSchema).parse(knownBookShelves) as BookShelf[];
});

export const useBookShelves = () => {
    return useQuery({
        queryKey: ["bookShelves"],
        queryFn: () => getBookShelves(),
    });
};
