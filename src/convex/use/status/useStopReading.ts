// Counterpart of `src/server/use/status/useStopReading.ts`.

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

export const useStopReading = () => {
    const stopReading = useMutation(api.status.stopReading).withOptimisticUpdate((localStore, { book, userId }) => {
        setOptimisticBookStatus(localStore, { bookId: book.id, userId, status: "WANT_TO_READ" });
    });

    return useTrackedMutation(({ book, userId }: Props) => stopReading({ book: toWireBook(book), userId }));
};
