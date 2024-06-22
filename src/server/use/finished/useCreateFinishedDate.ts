import { addFinished } from "@/server/action/finished";
import { getClientSide } from "@/server/use/useUser";
import { Finished } from "@/type/Finished";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
    timestamp: Date;
}

export const createFinishedDate = async ({ bookId, timestamp }: Props) => {
    const user = await getClientSide();
    if (!user) return [];

    await addFinished({ bookId, userId: user.id, timestamp });
};

export const useCreateFinishedDate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createFinishedDate,
        onMutate: async ({ bookId, timestamp }) => {
            await queryClient.cancelQueries({ queryKey: ["finishedDates", bookId] });
            const previousData: Finished[] | undefined = queryClient.getQueryData(["finishedDates", bookId]);

            if (previousData) {
                const newData = [...previousData, { id: -1, userId: -1, bookId, timestamp }].sort(
                    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
                );
                queryClient.setQueryData(["finishedDates", bookId], newData);
            }

            return { previousData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["finishedDates", bookId], context.previousData);
        },
        onSettled: (data, err, { bookId }) => {
            queryClient.invalidateQueries({ queryKey: ["finishedDates", bookId], refetchType: "all" });
        },
    });
};
