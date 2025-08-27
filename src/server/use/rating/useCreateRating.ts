import { createRating } from "@/server/repo/rating";
import { VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    bookId: string;
    rating: number;
    userId: string;
    queryClient: QueryClient;
}

export const createBookRating = async ({ bookId, rating, userId }: Props) => {
    await createRating({ data: { userId, bookId, rating } });
};

export const useCreateRating = () => {
    return useMutation({
        mutationFn: createBookRating,

        onMutate: async ({ bookId, rating, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["rating", bookId] });
            const previousData: number | undefined = queryClient.getQueryData(["rating", bookId]);
            queryClient.setQueryData(["rating", bookId], rating);

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.map((item) => (item.id === bookId ? { ...item, rating: [{ rating }] } : item));
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
