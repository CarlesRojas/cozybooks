import { GOOGLE_BOOKS_URL } from "@/const";
import { addToWantToRead } from "@/server/use/useAddToWantToRead";
import { BookStatus } from "@/server/use/useBookStatus";
import { BookShelfType } from "@/type/BookShelf";
import { TokenProps, withToken } from "@/util";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Props {
    bookId: string;
}

export const removeFromReading = withToken(async ({ bookId, token }: Props & TokenProps) => {
    const url = new URL(`${GOOGLE_BOOKS_URL}/mylibrary/bookshelves/${BookShelfType.READING_NOW}/removeVolume`);
    const params = new URLSearchParams({
        access_token: token,
        volumeId: bookId,
    });
    url.search = params.toString();

    await axios.post(url.toString());
});

export const stopReading = withToken(async ({ bookId, token }: Props & TokenProps) => {
    await removeFromReading({ bookId });
    await addToWantToRead({ bookId });
});

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
            queryClient.invalidateQueries({ queryKey: ["bookShelf", BookShelfType.TO_READ] });
            queryClient.invalidateQueries({ queryKey: ["bookShelf", BookShelfType.READING_NOW] });
        },
    });
};
