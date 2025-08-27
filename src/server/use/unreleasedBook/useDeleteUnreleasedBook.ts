import { removeUnreleasedBook } from "@/server/repo/unreleasedBook";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    unreleasedBookId: number;
    queryClient: QueryClient;
}

export const deleteUnreleasedBook = async ({ unreleasedBookId }: Props) => {
    await removeUnreleasedBook({ data: unreleasedBookId });
};

export const useDeleteUnreleasedBook = () => {
    return useMutation({
        mutationFn: deleteUnreleasedBook,

        onMutate: async ({ unreleasedBookId, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["unreleasedBooks"] });
            const previousData: UnreleasedBook[] | undefined = queryClient.getQueryData(["unreleasedBooks"]);

            previousData &&
                queryClient.setQueryData(
                    ["unreleasedBooks"],
                    previousData.filter((unreleasedBook) => unreleasedBook.id !== unreleasedBookId),
                );

            return { previousData };
        },

        onError: (_, { queryClient }, context) => {
            context && queryClient.setQueryData(["libraryBooks"], context.previousData);
        },

        onSettled: (_, __, { queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["libraryBooks"] });
        },
    });
};
