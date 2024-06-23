import { deleteFinished } from "@/server/action/finished";
import { VolumesResult } from "@/type/Book";
import { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
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

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.map((item) => {
                    if (item.id !== bookId) return item;
                    const finished = item.finished?.filter((finishedDate) => finishedDate.id !== id);
                    return { ...item, finished };
                });
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], { ...previousFinishedData, items: newItems });
            }

            return { previousData, previousFinishedData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["finishedDates", bookId], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },
        onSettled: (data, err, { bookId }) => {
            queryClient.invalidateQueries({ queryKey: ["finishedDates", bookId], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
