import { addFinished } from "@/server/repo/finished";
import { addBookToLibrary, isBookInLibrary } from "@/server/repo/library";
import { removeFromReading } from "@/server/use/status/useStopReading";
import { Book, BookStatus, VolumesResult } from "@/type/Book";
import { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
}

export const addToFinished = async ({ book, userId }: Props) => {
    const addFinishedPromise = addFinished({ data: { bookId: book.id, userId, timestamp: new Date() } });
    const bookAlreadyFinished = await isBookInLibrary({ data: { bookId: book.id, userId, type: LibraryType.FINISHED } });
    if (!bookAlreadyFinished) await addBookToLibrary({ data: { bookId: book.id, userId, type: LibraryType.FINISHED } });
    await addFinishedPromise;
};

export const finishBook = async (props: Props) => {
    await removeFromReading(props);
    await addToFinished(props);
};

export const useFinishBook = () => {
    return useMutation({
        mutationFn: finishBook,
        onMutate: async ({ book, queryClient, userId }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.NONE);

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = [...previousFinishedData.items];
                newItems.unshift(book);
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], {
                    ...previousFinishedData,
                    items: newItems,
                });
            }

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.READING] });
            const previousReadingData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.READING]);
            if (previousReadingData) {
                const newItems = previousReadingData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.READING], { ...previousReadingData, items: newItems });
            }

            await queryClient.cancelQueries({ queryKey: ["finishedDates", book.id] });
            const previousFinishedDatesData: Finished[] | undefined = queryClient.getQueryData(["finishedDates", book.id]);
            if (previousFinishedDatesData) {
                const newData: Finished[] = [...previousFinishedDatesData, { id: -1, userId, bookId: book.id, timestamp: new Date() }].sort(
                    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
                );

                queryClient.setQueryData(["finishedDates", book.id], newData);
            }

            return { previousData, previousFinishedData, previousReadingData, previousFinishedDatesData };
        },
        onError: (_, { book, queryClient }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.READING], context.previousReadingData);
            context && queryClient.setQueryData(["finishedDates", book.id], context.previousFinishedDatesData);
        },
        onSettled: (_, __, { book, queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["bookStatus", book.id] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.READING] });
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            queryClient.refetchQueries({ queryKey: ["finishedDates", book.id] });
        },
    });
};
