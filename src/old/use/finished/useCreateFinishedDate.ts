import { addFinished } from "@/server/action/finished";
import { getClientSide } from "@/server/use/useUser";
import { VolumesResult } from "@/type/Book";
import { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
    timestamp: Date;
}

export const createFinishedDate = async ({ bookId, timestamp }: Props) => {
    const user = await getClientSide();
    if (!user) return;

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

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.map((item) => {
                    if (item.id !== bookId) return item;
                    const finished = item.finished ?? [];
                    finished.push({ id: -1, userId: -1, bookId, timestamp });
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
            queryClient.refetchQueries({ queryKey: ["finishedDates", bookId], refetchType: "all" });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
