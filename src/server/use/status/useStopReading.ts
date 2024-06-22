import { removeBookFromLibrary } from "@/server/action/library";
import { addToWantToRead } from "@/server/use/status/useAddToWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const removeFromReading = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await removeBookFromLibrary({ bookId: book.id, userId: user.id, type: LibraryType.READING });
};

const stopReading = async (props: Props) => {
    await removeFromReading(props);
    await addToWantToRead(props);
};

export const useStopReading = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: stopReading,
        onMutate: async ({ book }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.WANT_TO_READ);

            return { previousData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
        },
    });
};
