import { removeUnreleasedBook } from "@/server/action/unreleasedBook";
import { getClientSide } from "@/server/use/useUser";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    unreleasedBookId: number;
}

export const deleteUnreleasedBook = async ({ unreleasedBookId }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await removeUnreleasedBook(unreleasedBookId);
};

export const useDeleteUnreleasedBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUnreleasedBook,

        onMutate: async ({ unreleasedBookId }) => {
            await queryClient.cancelQueries({ queryKey: ["unreleasedBooks"] });
            const previousData: UnreleasedBook[] | undefined = queryClient.getQueryData(["unreleasedBooks"]);

            previousData &&
                queryClient.setQueryData(
                    ["unreleasedBooks"],
                    previousData.filter((unreleasedBook) => unreleasedBook.id !== unreleasedBookId),
                );

            return { previousData };
        },

        onError: (error, vars, context) => {
            context && queryClient.setQueryData(["libraryBooks"], context.previousData);
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks"] });
        },
    });
};
