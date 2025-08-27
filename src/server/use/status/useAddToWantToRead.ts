import { addBook } from "@/server/repo/book";
import { addBookToLibrary } from "@/server/repo/library";
import { Book, BookStatus, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
}

export const addToWantToRead = async ({ book, userId }: Props) => {
    try {
        await addBook({ data: book });
    } catch (error) {}

    await addBookToLibrary({ data: { bookId: book.id, userId, type: LibraryType.TO_READ } });
};

export const useAddToWantToRead = () => {
    return useMutation({
        mutationFn: addToWantToRead,
        onMutate: async ({ book, queryClient }) => {
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
