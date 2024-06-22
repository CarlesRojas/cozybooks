import { removeBookFromLibrary } from "@/server/action/library";
import { addToWantToRead } from "@/server/use/status/useAddToWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { getClientSide } from "@/server/use/useUser";
import { LibraryType } from "@/type/Library";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
    bookId: string;
}

export const removeFromReading = async ({ bookId }: Props) => {
    const user = await getClientSide();
    if (!user) return;

    await removeBookFromLibrary({ bookId, userId: user.id, type: LibraryType.READING });
};

const stopReading = async (props: Props) => {
    await Promise.all([removeFromReading(props), addToWantToRead(props)]);
};

export const useStopReading = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: stopReading,
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
            queryClient.invalidateQueries({ queryKey: ["libraryBooks", LibraryType.READING], refetchType: "all" });
        },
    });
};
