import { GOOGLE_BOOKS_URL } from "@/const";
import { removeToWantToRead } from "@/server/use/status/useRemoveFromWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { BookShelfType } from "@/type/BookShelf";
import { TokenProps, withToken } from "@/util";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    bookId: string;
}

export const addToReading = withToken(async ({ bookId, token }: Props & TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${BookShelfType.READING_NOW}/addVolume`);
    const params = new URLSearchParams({
        access_token: token,
        volumeId: bookId,
    });
    url.search = params.toString();

    await axios.post(url.toString());
});

export const startReading = withToken(async ({ bookId }: Props & TokenProps) => {
    await removeToWantToRead({ bookId });
    await addToReading({ bookId });
});

export const useStartReading = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: startReading,
        onMutate: async ({ bookId }: { bookId: string }) => {
            await queryClient.cancelQueries({ queryKey: ["bookStatus", bookId] });
            const previousData: BookStatus | undefined = queryClient.getQueryData(["bookStatus", bookId]);
            queryClient.setQueryData(["bookStatus", bookId], BookStatus.READING_NOW);

            return { previousData };
        },
        onError: (err, { bookId }, context) => {
            context && queryClient.setQueryData(["bookStatus", bookId], context.previousData);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["bookShelf", BookShelfType.TO_READ] });
            queryClient.invalidateQueries({ queryKey: ["bookShelf", BookShelfType.READING_NOW] });
        },
    });
};
