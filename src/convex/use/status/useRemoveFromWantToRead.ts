// Counterpart of `src/server/use/status/useRemoveFromWantToRead.ts`.

import type { Book } from "@/type/Book";
import { setOptimisticBookStatus } from "@/convex/use/status/optimistic";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
}

export const useRemoveFromWantToRead = () => {
    const removeFromWantToRead = useMutation(api.status.removeFromWantToRead).withOptimisticUpdate((localStore, { bookId }) => {
        setOptimisticBookStatus(localStore, { bookId, status: "NONE" });
    });

    return useTrackedMutation(({ book }: Props) => removeFromWantToRead({ bookId: book.id }));
};
