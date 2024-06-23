import { getRating } from "@/server/action/rating";
import { getClientSide } from "@/server/use/useUser";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId?: number;
}

export const getBookRating = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return null;

    return await getRating({ userId: user.id, bookId });
};

export const useRating = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["rating", bookId],
        queryFn: () => getBookRating({ bookId }),
    });
};
