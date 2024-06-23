import { addBookToLibrary } from "@/server/action/library";
import { removeFromWantToRead } from "@/server/use/status/useRemoveFromWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { Book, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const addToReading = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await addBookToLibrary({ bookId: book.id, userId: user.id, type: LibraryType.READING });
};

const startReading = async (props: Props) => {
    await removeFromWantToRead(props);
    await addToReading(props);
};

export const useStartReading = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: startReading,
        onMutate: async ({ book }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", book.id] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", book.id]);
            queryClient.setQueryData(["bookStatus", book.id], BookStatus.READING_NOW);

            const previousReadingData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.READING]);
            if (previousReadingData) {
                const newItems = previousReadingData.items;
                newItems.unshift(book);
                queryClient.setQueryData(["libraryBooks", LibraryType.READING], { ...previousReadingData, items: newItems });
            }

            const previousToReadData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.TO_READ]);
            if (previousToReadData) {
                const newItems = previousToReadData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.TO_READ], { ...previousToReadData, items: newItems });
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
