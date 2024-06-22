import { addBookToLibrary } from "@/server/action/library";
import { removeFromReading } from "@/server/use/status/useStopReading";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
}

export const addToFinished = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await addBookToLibrary({ bookId, userId: user.id, type: LibraryType.FINISHED });
};

export const finishBook = async (props: Props) => {
    await Promise.all([removeFromReading(props), addToFinished(props)]);
};

export const useFinishBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: finishBook,
        onMutate: async ({ bookId }: { bookId: string }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", bookId] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", bookId]);
            queryClient.setQueryData(["bookStatus", bookId], BookStatus.NONE);

            return { previousData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["bookStatus", bookId], context.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED], refetchType: "all" });
        },
    });
};
