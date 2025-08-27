import { removeBookFromLibrary } from "@/server/repo/library";
import { addToWantToRead } from "@/server/use/status/useAddToWantToRead";
import { Book, BookStatus, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
}

export const removeFromReading = async ({ book, userId }: Props) => {
    await removeBookFromLibrary({ data: { bookId: book.id, userId, type: LibraryType.READING } });
};

const stopReading = async (props: Props) => {
    await removeFromReading(props);
    await addToWantToRead(props);
};

export const useStopReading = () => {
    return useMutation({
        mutationFn: stopReading,
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

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.READING] });
            const previousReadingData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.READING]);
            if (previousReadingData) {
                const newItems = previousReadingData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.READING], { ...previousReadingData, items: newItems });
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
