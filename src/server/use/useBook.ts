import { GOOGLE_BOOKS_URL } from "@/const";
import { Book, BookSchema } from "@/type/Book";
import { TokenProps, withToken } from "@/util";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    bookId: string;
}

export const getBook = withToken(async ({ bookId, token }: Props & TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/volumes/${bookId}`, GOOGLE_BOOKS_URL);
    const params = new URLSearchParams({
        access_token: token,
        projection: "full",
    });
    url.search = params.toString();

    try {
        const response = await axios.get(url.toString());
        return BookSchema.parse(response.data) as Book;
    } catch (error) {
        return undefined;
    }
});

export const useBook = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["book", bookId],
        queryFn: () => getBook({ bookId }),
    });
};
