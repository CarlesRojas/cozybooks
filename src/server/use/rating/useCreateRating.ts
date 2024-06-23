import { createRating } from "@/server/action/rating";
import { getClientSide } from "@/server/use/useUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
    rating: number;
}

export const createBookRating = async ({ bookId, rating }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await createRating({ userId: user.id, bookId, rating });
};

export const useCreateRating = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBookRating,

        onMutate: async ({ bookId, rating }) => {
            await queryClient.cancelQueries({ queryKey: ["rating", bookId] });
            const previousData: number | undefined = queryClient.getQueryData(["rating", bookId]);
            queryClient.setQueryData(["rating", bookId], rating);
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
