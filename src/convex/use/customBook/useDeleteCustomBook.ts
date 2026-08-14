// Deleting a user's own book, together with everything hanging off it: its shelves,
// its rating and its finished dates go in the same Convex transaction, and its cover
// blob follows once the row is gone.

import { deleteCover } from "@/lib/blob";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    bookId: string;
    userId: string;
}

export const useDeleteCustomBook = () => {
    const remove = useMutation(api.customBooks.remove).withOptimisticUpdate((localStore, { bookId, userId }) => {
        const current = localStore.getQuery(api.customBooks.list, { userId });
        if (current === undefined) return;

        localStore.setQuery(
            api.customBooks.list,
            { userId },
            current.filter((book) => book.id !== bookId),
        );
    });

    return useTrackedMutation(async ({ bookId, userId }: Props) => {
        const { discardedCoverUrl } = await remove({ bookId, userId });
        if (discardedCoverUrl) void deleteCover(discardedCoverUrl);
    });
};
