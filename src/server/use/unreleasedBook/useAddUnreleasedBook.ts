import { addUnreleasedBook } from "@/server/action/unreleasedBook";
import { getClientSide } from "@/server/use/useUser";
import { UnreleasedBook } from "@/type/UnreleasedBook";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    name: string;
}

export const addUserUnreleasedBook = async ({ name }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await addUnreleasedBook({ name, userId: user.id });
};

export const useAddUnreleasedBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addUserUnreleasedBook,

        onMutate: async ({ name }) => {
            await queryClient.cancelQueries({ queryKey: ["unreleasedBooks"] });
            const previousData: UnreleasedBook[] | undefined = queryClient.getQueryData(["unreleasedBooks"]);

            const randomNumber = -Math.floor(Math.random() * 10000000);

            previousData &&
                queryClient.setQueryData(
                    ["unreleasedBooks"],
                    previousData
                        .toSpliced(0, 0, { id: randomNumber, name, userId: randomNumber })
                        .toSorted((a, b) => a.name.localeCompare(b.name)),
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
