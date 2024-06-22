import { addBookToLibrary } from "@/server/action/library";
import { removeFromWantToRead } from "@/server/use/status/useRemoveFromWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
}

export const addToReading = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await addBookToLibrary({ bookId, userId: user.id, type: LibraryType.READING });
};

const startReading = async (props: Props) => {
    await Promise.all([removeFromWantToRead(props), addToReading(props)]);
};

export const useStartReading = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: startReading,
        onMutate: async ({ bookId }: { bookId: string }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", bookId] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", bookId]);
            queryClient.setQueryData(["bookStatus", bookId], BookStatus.READING_NOW);

            return { previousData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["bookStatus", bookId], context.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
        },
    });
};
