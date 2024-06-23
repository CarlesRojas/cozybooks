import { removeBookFromLibrary } from "@/server/action/library";
import { addToWantToRead } from "@/server/use/status/useAddToWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book, VolumesResult } from "@/type/Book";
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

            const previousToReadData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.TO_READ]);
            if (previousToReadData) {
                const newItems = previousToReadData.items;
                newItems.unshift(book);
                queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], { ...previousToReadData, items: newItems });
            }

            const previousReadingData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.READING]);
            if (previousReadingData) {
                const newItems = previousReadingData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.READING], { ...previousReadingData, items: newItems });
            }

            return { previousData, previousReadingData, previousToReadData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["bookStatus", book.id], context.previousData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], context.previousToReadData);
            context && queryClient.setQueryData(["libraryBooks", LibraryType.READING], context.previousReadingData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ], refetchType: "all" });
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
        },
    });
};
