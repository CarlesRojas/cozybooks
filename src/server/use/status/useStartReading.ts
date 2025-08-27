import { addBookToLibrary } from "@/server/repo/library";
import { removeFromWantToRead } from "@/server/use/status/useRemoveFromWantToRead";
import { Book, BookStatus, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
}

export const addToReading = async ({ book, userId }: Props) => {
    await addBookToLibrary({ data: { bookId: book.id, userId, type: LibraryType.READING } });
};

const startReading = async (props: Props) => {
    await removeFromWantToRead(props);
    await addToReading(props);
};

export const useStartReading = () => {
    return useMutation({
        mutationFn: startReading,
        onMutate: async ({ book, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.READING_NOW);

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.READING] });
            const previousReadingData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.READING]);
            if (previousReadingData) {
                const newItems = previousReadingData.items;
                newItems.unshift(book);
                queryClient.setQueryData(["libraryBooks", LibraryType.READING], { ...previousReadingData, items: newItems });
            }

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ] });
            const previousToReadData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.TO_READ]);
            if (previousToReadData) {
                const newItems = previousToReadData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], { ...previousToReadData, items: newItems });
            }

            return { previousData, previousReadingData, previousToReadData };
        },
        onError: (_, { book, queryClient }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], context.previousToReadData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.READING], context.previousReadingData);
        },
        onSettled: (_, __, { book, queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["bookStatus", book.id] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.READING] });
        },
    });
};
