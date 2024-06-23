import { deleteRating } from "@/server/action/rating";
import { getClientSide } from "@/server/use/useUser";
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

            // TODO optimistic update for rating inside book

            return { previousData };
        },

        onError: (error, { bookId }, context) => {
            context && queryClient.setQueryData(["rating", bookId], context.previousData);
        },

        onSettled: (data, error, { bookId }) => {
            queryClient.invalidateQueries({ queryKey: ["rating", bookId] });
        },
    });
};
