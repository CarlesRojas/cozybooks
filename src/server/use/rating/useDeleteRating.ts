import { deleteRating } from "@/server/repo/rating";
import type { VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

interface Props {
    bookId: string;
    userId: string;
    queryClient: QueryClient;
}

export const deleteBookRating = async ({ bookId, userId }: Props) => {
    await deleteRating({ data: { userId, bookId } });
};

export const useDeleteRating = () => {
    return useMutation({
        mutationFn: deleteBookRating,

        onMutate: async ({ bookId, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["rating", bookId] });
            const previousData: number | undefined = queryClient.getQueryData(["rating", bookId]);
            queryClient.setQueryData(["rating", bookId], null);

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.map((item) => (item.id === bookId ? { ...item, rating: [] } : item));
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], { ...previousFinishedData, items: newItems });
            }

            return { previousData, previousFinishedData };
        },

        onError: (_, { bookId, queryClient }, context) => {
            context && queryClient.setQueryData(["rating", bookId], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },

        onSettled: (_, __, { bookId, queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["rating", bookId] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
