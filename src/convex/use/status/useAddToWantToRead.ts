// Counterpart of `src/server/use/status/useAddToWantToRead.ts`. The old flow was
// three client-orchestrated server calls; now it's one transactional mutation.

import { toWireBook } from "@/convex/map";
import type { Book } from "@/type/Book";
import { setOptimisticBookStatus } from "@/convex/use/status/optimistic";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
}

export const useAddToWantToRead = () => {
    const addToWantToRead = useMutation(api.status.addToWantToRead).withOptimisticUpdate((localStore, { book }) => {
        setOptimisticBookStatus(localStore, { bookId: book.id, status: "WANT_TO_READ" });
    });

    return useTrackedMutation(({ book }: Props) => addToWantToRead({ book: toWireBook(book) }));
};
