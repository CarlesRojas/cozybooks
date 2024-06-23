import { updateFinished } from "@/server/action/finished";
import { getClientSide } from "@/server/use/useUser";
import { Finished } from "@/type/Finished";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    id: number;
    bookId: string;
    timestamp: Date;
}

export const updateFinishedDate = async (props: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await updateFinished({ ...props, userId: user.id });
};

export const useUpdateFinishedDate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateFinishedDate,
        onMutate: async ({ bookId, id, timestamp }) => {
            await queryClient.cancelQueries({ queryKey: ["finishedDates", bookId] });
            const previousData: Finished[] | undefined = queryClient.getQueryData(["finishedDates", bookId]);

            if (previousData) {
                const newData = previousData
                    .map((finishedDate) => {
                        if (finishedDate.id === id) return { ...finishedDate, timestamp };
                        return finishedDate;
                    })
                    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                queryClient.setQueryData(["finishedDates", bookId], newData);
            }

            // TODO optimistic update for finished date inside book

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
