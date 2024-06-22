import { getFinished } from "@/server/action/finished";
import { getClientSide } from "@/server/use/useUser";
import { useQuery } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId?: number;
}

export const getFinishedDates = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return [];

    return await getFinished(user.id, bookId);
};

export const useFinishedDates = ({ bookId }: Props) => {
    return useQuery({
        queryKey: ["finishedDates", bookId],
        queryFn: () => getFinishedDates({ bookId }),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};
