// Counterpart of `src/server/use/status/useRemoveFromWantToRead.ts`.

import type { Book } from "@/type/Book";
import { setOptimisticBookStatus } from "@/convex/use/status/optimistic";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
    userId: string;
}

export const useRemoveFromWantToRead = () => {
    const removeFromWantToRead = useMutation(api.status.removeFromWantToRead).withOptimisticUpdate((localStore, { bookId, userId }) => {
        setOptimisticBookStatus(localStore, { bookId, userId, status: "NONE" });
    });

    return useTrackedMutation(({ book, userId }: Props) => removeFromWantToRead({ bookId: book.id, userId }));
};
