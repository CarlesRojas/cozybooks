import { deleteFinished, getFinished } from "@/server/repo/finished";
import { removeBookFromLibrary } from "@/server/repo/library";
import type { VolumesResult } from "@/type/Book";
import type { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

interface Props {
    bookId: string;
    id: number;
    userId: string;
    queryClient: QueryClient;
}

export const deleteFinishedDate = async ({ id, bookId, userId }: Props) => {
    await deleteFinished({ data: id });

    const finished = await getFinished({ data: { userId, bookId } });
    if (!finished || finished.length === 0) await removeBookFromLibrary({ data: { bookId, userId, type: LibraryType.FINISHED } });
};

export const useDeleteFinishedDate = () => {
    return useMutation({
        mutationFn: deleteFinishedDate,
        onMutate: async ({ bookId, id, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["finishedDates", bookId] });
            const previousData: Array<Finished> | undefined = queryClient.getQueryData(["finishedDates", bookId]);

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
