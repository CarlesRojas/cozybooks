// Counterpart of `src/server/use/status/useRemoveFromWantToRead.ts`.

import type { Book } from "@/convex/type";
import { setOptimisticBookStatus } from "@/convex/use/status/optimistic";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
    userId: string;
    googleToken: string;
}

export const useRemoveFromWantToRead = () => {
    const removeFromWantToRead = useMutation(api.status.removeFromWantToRead).withOptimisticUpdate((localStore, { bookId, userId }) => {
        setOptimisticBookStatus(localStore, { bookId, userId, status: "NONE" });
    });

    return useTrackedMutation(({ book, userId, googleToken }: Props) => removeFromWantToRead({ bookId: book.id, userId, googleToken }));
};
