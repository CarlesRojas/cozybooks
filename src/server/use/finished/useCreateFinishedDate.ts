import { addFinished } from "@/server/repo/finished";
import type { VolumesResult } from "@/type/Book";
import type { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

interface Props {
    userId: string;
    bookId: string;
    timestamp: Date;
    queryClient: QueryClient;
}

export const createFinishedDate = async ({ bookId, timestamp, userId }: Props) => {
    await addFinished({ data: { bookId, userId, timestamp } });
};

export const useCreateFinishedDate = () => {
    return useMutation({
        mutationFn: createFinishedDate,
        onMutate: async ({ bookId, timestamp, queryClient, userId }) => {
            await queryClient.cancelQueries({ queryKey: ["finishedDates", bookId] });
            const previousData: Array<Finished> | undefined = queryClient.getQueryData(["finishedDates", bookId]);

            if (previousData) {
                const newData = [...previousData, { id: -1, userId, bookId, timestamp }].sort(
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
                    finished.push({ id: -1, userId, bookId, timestamp });
                    return { ...item, finished };
                });
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], { ...previousFinishedData, items: newItems });
            }

            return { previousData, previousFinishedData };
        },
        onError: (_, { bookId, queryClient }, context) => {
            context && queryClient.setQueryData(["finishedDates", bookId], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },
        onSettled: (_, __, { bookId, queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["finishedDates", bookId] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
