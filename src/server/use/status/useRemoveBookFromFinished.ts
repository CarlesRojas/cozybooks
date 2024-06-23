import { removeBookFromLibrary } from "@/server/action/library";
import { getClientSide } from "@/server/use/useUser";
import { Book, VolumesResult } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    book: Book;
}

export const removeFromFinished = async ({ book }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await removeBookFromLibrary({ bookId: book.id, userId: user.id, type: LibraryType.FINISHED });
};

export const useRemoveBookFromFinished = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeFromFinished,
        onMutate: async ({ book }) => {
            await queryClient.cancelQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED] });
            const previousFinishedData: VolumesResult | undefined = queryClient.getQueryData(["libraryBooks", LibraryType.FINISHED]);
            if (previousFinishedData) {
                const newItems = previousFinishedData.items.filter((item) => item.id !== book.id);
                queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], { ...previousFinishedData, items: newItems });
            }

            return { previousFinishedData };
        },
        onError: (err, { book }, context) => {
            context && queryClient.setQueryData(["libraryBooks", LibraryType.FINISHED], context.previousFinishedData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.FINISHED], refetchType: "all" });
        },
    });
};
