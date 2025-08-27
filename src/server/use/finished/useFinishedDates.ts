import { getFinished } from "@/server/repo/finished";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId: string;
}

export const getFinishedDates = async ({ bookId, userId }: Props) => {
    return await getFinished({ data: { userId, bookId } });
};

export const useFinishedDates = ({ bookId, userId }: Props) => {
    return useQuery({
        queryKey: ["finishedDates", bookId],
        queryFn: () => getFinishedDates({ bookId, userId }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
