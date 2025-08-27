import { deleteRating } from "@/server/action/rating";
import { getClientSide } from "@/server/use/useUser";
import { VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
}

export const deleteBookRating = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await deleteRating({ userId: user.id, bookId });
};

export const useDeleteRating = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBookRating,

        onMutate: async ({ bookId }) => {
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

        onError: (error, { bookId }, context) => {
            context && queryClient.setQueryData(["rating", bookId], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },

        onSettled: (data, error, { bookId }) => {
            queryClient.invalidateQueries({ queryKey: ["rating", bookId] });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
