import { GOOGLE_BOOKS_URL } from "@/const";
import { BookStatus } from "@/server/use/useBookStatus";
import { VolumesResult, VolumesResultSchema } from "@/type/Book";
import { BookShelfType } from "@/type/BookShelf";
import { TokenProps, withToken } from "@/util";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    type: BookShelfType;
    booksPerPage?: number;
    offset?: number;
}

export const getBookShelf = withToken(async ({ type, booksPerPage = 8, offset = 0, token }: Props & TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${type}/volumes`);
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
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["bookShelf", type, booksPerPage, offset],
        queryFn: async () => {
            const volumes = await getBookShelf({ type, booksPerPage, offset });

            if (type === BookShelfType.READING_NOW)
                volumes.items.map((volume) => queryClient.setQueryData(["bookStatus", volume.id], BookStatus.READING_NOW));

            if (type === BookShelfType.TO_READ)
                volumes.items.map((volume) => queryClient.setQueryData(["bookStatus", volume.id], BookStatus.WANT_TO_READ));

            return volumes;
        },
    });
};
