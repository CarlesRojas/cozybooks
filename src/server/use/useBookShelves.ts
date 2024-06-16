import { GOOGLE_BOOKS_URL } from "@/const";
import { BookShelf, BookShelfSchema } from "@/type/BookShelf";
import { TokenProps, filteredArray, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

export const getBookShelves = withToken(async ({ token }: TokenProps) => {
    const response = await axios.get(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves?access_token=${token}`);

    const knownBookShelves = filteredArray(BookShelfSchema).parse(response.data.items);
    return z.array(BookShelfSchema).parse(knownBookShelves) as BookShelf[];
});

export const useBookShelves = () => {
    return useQuery({
        queryKey: ["bookShelves"],
        queryFn: () => getBookShelves(),
    });
};
