import { removeFromGoogleBookshelf } from "@/server/repo/google";
import { removeBookFromLibrary } from "@/server/repo/library";
import type { Book, VolumesResult } from "@/type/Book";
import { BookShelfType } from "@/type/BookShelf";
import { LibraryType } from "@/type/Library";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
    googleToken: string;
}

const removeFromFinished = async ({ book, userId, googleToken }: Props) => {
    await Promise.all([
        removeBookFromLibrary({ data: { bookId: book.id, userId, type: LibraryType.FINISHED } }),
        removeFromGoogleBookshelf({ book, googleToken, bookshelf: BookShelfType.HAVE_READ }),
    ]);
};

export const useRemoveBookFromFinished = () => {
    return useMutation({
        mutationFn: removeFromFinished,
        onMutate: async ({ book, queryClient }) => {
            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], { ...previousFinishedData, items: newItems });
            }

            return { previousFinishedData };
        },
        onError: (_, { queryClient }, context) => {
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },
        onSettled: (_, __, { queryClient }) => {
            queryClient.refetchQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
        },
    });
};
