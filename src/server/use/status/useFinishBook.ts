import { addFinished } from "@/server/action/finished";
import { addBookToLibrary, isBookInLibrary } from "@/server/action/library";
import { removeFromReading } from "@/server/use/status/useStopReading";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book, VolumesResult } from "@/type/Book";
import { Finished } from "@/type/Finished";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const addToFinished = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    const addFinishedPromise = addFinished({ bookId: book.id, userId: user.id, timestamp: new Date() });
    const bookAlreadyFinished = await isBookInLibrary({ bookId: book.id, userId: user.id, type: LibraryType.FINISHED });
    if (!bookAlreadyFinished) await addBookToLibrary({ bookId: book.id, userId: user.id, type: LibraryType.FINISHED });
    await addFinishedPromise;
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

            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items;
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
                const newData: Finished[] = [
                    ...previousFinishedDatesData,
                    {
                        id: -1,
                        userId: -1,
                        bookId: book.id,
                        timestamp: new Date(),
                    },
                ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                queryClient.setQueryData(["finishedDates", book.id], newData);
            }

            return { previousData, previousFinishedData, previousReadingData, previousFinishedDatesData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.READING], context.previousReadingData);
            context && queryClient.setQueryData(["finishedDates", book.id], context.previousFinishedDatesData);
        },
        onSettled: (data, err, { book }) => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["finishedDates", book.id], refetchType: "all" });
        },
    });
};
