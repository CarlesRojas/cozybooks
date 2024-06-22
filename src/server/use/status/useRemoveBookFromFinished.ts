import { removeBookFromLibrary } from "@/server/action/library";
import { getClientSide } from "@/server/use/useUser";
import { Book } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const removeFromFinished = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await removeBookFromLibrary({ bookId: book.id, userId: user.id, type: LibraryType.FINISHED });
};

export const useRemoveBookFromFinished = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeFromFinished,
        onMutate: async ({ book }) => {
            // TODO optimistic update
        },
        onError: (err, { book }, context) => {},
        onSettled: () => {},
    });
};
