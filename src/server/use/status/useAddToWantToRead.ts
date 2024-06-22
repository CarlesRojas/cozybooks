import { addBookToLibrary } from "@/server/action/library";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
}

export const addToWantToRead = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await addBookToLibrary({ bookId, userId: user.id, type: LibraryType.TO_READ });
};

export const useAddToWantToRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addToWantToRead,
        onMutate: async ({ bookId }: { bookId: string }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", bookId] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", bookId]);
            queryClient.setQueryData(["bookStatus", bookId], BookStatus.WANT_TO_READ);

            return { previousData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["bookStatus", bookId], context.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.TO_READ], refetchType: "all" });
        },
    });
};
