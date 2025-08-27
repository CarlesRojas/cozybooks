import { addUnreleasedBook } from "@/server/repo/unreleasedBook";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    name: string;
    userId: string;
    queryClient: QueryClient;
}

export const addUserUnreleasedBook = async (data: Props) => {
    await addUnreleasedBook({ data });
};

export const useAddUnreleasedBook = () => {
    return useMutation({
        mutationFn: addUserUnreleasedBook,

        onMutate: async ({ name, userId, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["unreleasedBooks"] });
            const previousData: UnreleasedBook[] | undefined = queryClient.getQueryData(["unreleasedBooks"]);

            const randomNumber = -Math.floor(Math.random() * 10000000);

            const newData = [...(previousData ?? []), { id: randomNumber, name, userId }].sort((a, b) => a.name.localeCompare(b.name));
            queryClient.setQueryData(["unreleasedBooks"], newData);

            return { previousData };
        },

        onError: (_, { queryClient }, context) => {
            context && queryClient.setQueryData(["unreleasedBooks"], context.previousData);
        },

        onSettled: (_, __, { queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["unreleasedBooks"] });
        },
    });
};
