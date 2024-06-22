import { addBookToLibrary } from "@/server/action/library";
import { removeFromReading } from "@/server/use/status/useStopReading";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const addToFinished = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await addBookToLibrary({ bookId: book.id, userId: user.id, type: LibraryType.FINISHED });
};

export const finishBook = async (props: Props) => {
    await removeFromReading(props);
    await addToFinished(props);
};

export const useFinishBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: finishBook,
        onMutate: async ({ book }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.NONE);

            return { previousData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED], refetchType: "all" });
        },
    });
};
