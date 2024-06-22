import { PAGE_SIZE } from "@/const";
import { addBookToLibrary } from "@/server/action/library";
import { removeFromReading } from "@/server/use/status/useStopReading";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book, VolumesResult } from "@/type/Book";
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
    // TODO save finished timestamp
};

export const useFinishBook = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: finishBook,
        onMutate: async ({ book }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.NONE);

            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData([
                "libraryBooks",
                LibraryType.FINISHED,
                PAGE_SIZE,
                0,
            ]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items;
                newItems.unshift(book);
                if (newItems.length > PAGE_SIZE) newItems.pop();
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED, PAGE_SIZE, 0], {
                    ...previousFinishedData,
                    items: newItems,
                });
            }

            const previousReadingData: VolumesResult | undefined = queryClient.getQueryData([
                "libraryBooks",
                LibraryType.READING,
                PAGE_SIZE,
                0,
            ]);
            if (previousReadingData) {
                const newItems = previousReadingData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.READING, PAGE_SIZE, 0], { ...previousReadingData, items: newItems });
            }

            return { previousData, previousFinishedData, previousReadingData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED, PAGE_SIZE, 0], context.previousFinishedData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.READING, PAGE_SIZE, 0], context.previousReadingData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED], refetchType: "all" });
        },
    });
};
