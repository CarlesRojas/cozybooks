import { getRating } from "@/server/repo/rating";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId: string;
}

export const getBookRating = async ({ bookId, userId }: Props) => {
    return await getRating({ data: { userId, bookId } });
};

export const useRating = ({ bookId, userId }: Props) => {
    return useQuery({
        queryKey: ["rating", bookId],
        queryFn: () => getBookRating({ bookId, userId }),
    });
};
