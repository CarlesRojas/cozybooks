import { deleteFinished } from "@/server/action/finished";
import { Finished } from "@/type/Finished";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
    id: number;
}

export const deleteFinishedDate = async ({ id }: Props) => {
    await deleteFinished(id);
};

export const useDeleteFinishedDate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteFinishedDate,
        onMutate: async ({ bookId, id }) => {
            await queryClient.cancelQueries({ queryKey: ["finishedDates", bookId] });
            const previousData: Finished[] | undefined = queryClient.getQueryData(["finishedDates", bookId]);

            if (previousData) {
                const newData = previousData.filter((finishedDate) => finishedDate.id !== id);
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
