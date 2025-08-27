import { removeBookFromLibrary } from "@/server/repo/library";
import type { Book, VolumesResult } from "@/type/Book";
import { BookStatus } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
}

export const removeFromWantToRead = async ({ book, userId }: Props) => {
    await removeBookFromLibrary({ data: { bookId: book.id, userId, type: LibraryType.TO_READ } });
};

export const useRemoveFromWantToRead = () => {
    return useMutation({
        mutationFn: removeFromWantToRead,
        onMutate: async ({ book, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.NONE);

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ] });
            const previousToReadData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.TO_READ]);
            if (previousToReadData) {
                const newItems = previousToReadData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], { ...previousToReadData, items: newItems });
            }

            return { previousData, previousToReadData };
        },
        onError: (_, { book, queryClient }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], context.previousToReadData);
        },
        onSettled: (_, __, { book, queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["bookStatus", book.id] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ] });
        },
    });
};
