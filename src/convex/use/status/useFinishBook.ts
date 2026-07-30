// Counterpart of `src/server/use/status/useFinishBook.ts`. The old flow was five
// sequential server calls; now it's one transactional mutation.

import { toWireBook } from "@/convex/map";
import type { Book } from "@/type/Book";
import { setOptimisticBookStatus } from "@/convex/use/status/optimistic";
import { useTrackedMutation } from "@/convex/use/util";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

interface Props {
    book: Book;
    userId: string;
}

export const useFinishBook = () => {
    const finishBook = useMutation(api.status.finishBook).withOptimisticUpdate((localStore, { book, userId }) => {
        setOptimisticBookStatus(localStore, { bookId: book.id, userId, status: "NONE" });
    });

    return useTrackedMutation(({ book, userId }: Props) => finishBook({ book: toWireBook(book), userId }));
};
