import { addBook } from "@/server/action/book";
import { addBookToLibrary } from "@/server/action/library";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const addToWantToRead = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    try {
        await addBook(book);
    } catch (error) {}

    await addBookToLibrary({ bookId: book.id, userId: user.id, type: LibraryType.TO_READ });
};

export const useAddToWantToRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addToWantToRead,
        onMutate: async ({ book }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.WANT_TO_READ);

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ] });
            const previousToReadData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.TO_READ]);
            if (previousToReadData) {
                const newItems = previousToReadData.items;
                newItems.unshift(book);
                queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], { ...previousToReadData, items: newItems });
            }

            return { previousData, previousToReadData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], context.previousToReadData);
        },
        onSettled: (data, err, { book }) => {
            queryClient.refetchQueries({ queryKey: ["bookStatus", book.id], refetchType: "all" });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ], refetchType: "all" });
        },
    });
};
