import { removeBookFromLibrary } from "@/server/repo/library";
import { Book, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { QueryClient, useMutation } from "@tanstack/react-query";

interface Props {
    book: Book;
    userId: string;
    queryClient: QueryClient;
}

export const removeFromFinished = async ({ book, userId }: Props) => {
    await removeBookFromLibrary({ data: { bookId: book.id, userId, type: LibraryType.FINISHED } });
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
